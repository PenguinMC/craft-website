// /api/drip-cron.js
// Daily Vercel cron (see vercel.json). Sends the long-tail drip touches that
// Resend cannot pre-schedule (scheduled_at caps at 30 days):
//   T+60  day60_winback
//   T+120 day120_quarterly
// Finds contacts via HubSpot by createdate window, skips Careers and unsubscribes.

const lh = require('./lead-handler.js');
const { buildEmail, sendEmail, isUnsubscribed } = lh._internal;

const TOUCHES = [
  { key: 'day60_winback', days: 60 },
  { key: 'day120_quarterly', days: 120 }
];

async function hubspotContactsCreatedBetween(fromMs, toMs) {
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filterGroups: [{ filters: [
        { propertyName: 'createdate', operator: 'BETWEEN', value: String(fromMs), highValue: String(toMs) }
      ]}],
      properties: ['email', 'firstname', 'lastname', 'lead_source_detail', 'program_interest'],
      limit: 100
    })
  });
  if (!res.ok) throw new Error(`HubSpot search ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.results || [];
}

const PIPELINE_ID = '908741278';
const DAY = 86400 * 1000;

async function hubspotDealDateTasks(out) {
  // Deals with a Course Start Date drive two automatic tasks:
  //   T-5 days: pre-course check-in.  T+14 days: review + next-rating follow-up.
  const r = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filterGroups: [{ filters: [
        { propertyName: 'pipeline', operator: 'EQ', value: PIPELINE_ID },
        { propertyName: 'course_start_date', operator: 'HAS_PROPERTY' }
      ]}],
      properties: ['dealname', 'course_start_date', 'hubspot_owner_id', 'precourse_task_created', 'post_course_followup_created'],
      limit: 100
    })
  });
  if (!r.ok) { out.errors.push('deal date search ' + r.status); return; }
  const deals = (await r.json()).results || [];
  for (const d of deals) {
    const p = d.properties || {};
    const start = Date.parse(p.course_start_date);
    if (!start) continue;
    const now = Date.now();
    const mk = async (subject, body, marker) => {
      const t = await fetch('https://api.hubapi.com/crm/v3/objects/tasks', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: {
            hs_task_subject: subject, hs_task_body: body,
            hs_timestamp: now + 3600 * 1000,
            hs_task_status: 'NOT_STARTED', hs_task_type: 'TODO', hs_task_priority: 'MEDIUM',
            ...(p.hubspot_owner_id ? { hubspot_owner_id: p.hubspot_owner_id } : {})
          },
          associations: [{ to: { id: d.id }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 216 }] }]
        })
      });
      if (t.ok) {
        await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${d.id}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${process.env.HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ properties: { [marker]: now } })
        });
        out.sent.push({ deal: p.dealname, task: subject });
      }
    };
    if (!p.precourse_task_created && now >= start - 5 * DAY && now < start) {
      await mk(`PRE-COURSE: ${p.dealname} starts in ~5 days`,
        'Check in before the course: confirm arrival plans, housing sorted, materials received and studied, DPE still locked.',
        'precourse_task_created');
    }
    if (!p.post_course_followup_created && now >= start + 14 * DAY) {
      await mk(`COURSE DONE: follow up with ${p.dealname}`,
        'Course window has passed. Congratulate them, send the post-checkride review-request email template, and pitch the next rating.',
        'post_course_followup_created');
    }
  }
}

module.exports = async (req, res) => {
  // Guard: Vercel sends Authorization: Bearer ${CRON_SECRET} when the env var is set.
  if (process.env.CRON_SECRET) {
    if ((req.headers['authorization'] || '') !== `Bearer ${process.env.CRON_SECRET}`) {
      res.status(401).json({ error: 'unauthorized' }); return;
    }
  }

  const out = { sent: [], skipped: [], errors: [] };
  try {
    await hubspotDealDateTasks(out);
    for (const touch of TOUCHES) {
      // Contacts created in the 24h window exactly `days` ago. Runs daily, so
      // every contact passes through each window exactly once.
      const to = Date.now() - touch.days * 86400 * 1000;
      const from = to - 86400 * 1000;
      let contacts = [];
      try {
        contacts = await hubspotContactsCreatedBetween(from, to);
      } catch (e) { out.errors.push({ touch: touch.key, err: String(e) }); continue; }

      for (const c of contacts) {
        const p = c.properties || {};
        const email = (p.email || '').trim();
        const firstname = p.firstname || '';
        if (!email || !firstname) { out.skipped.push({ email, why: 'missing email/firstname' }); continue; }
        if ((p.lead_source_detail || '') === 'Careers') { out.skipped.push({ email, why: 'careers' }); continue; }
        try {
          if (await isUnsubscribed(email)) { out.skipped.push({ email, why: 'unsubscribed' }); continue; }
          const vars = {
            firstname, lastname: p.lastname || '', email, phone: '',
            program: (p.program_interest || '').replace(/_/g, ' ') || 'flight training'
          };
          const e = buildEmail(touch.key, vars);
          const r1 = await sendEmail({ to: email, subject: e.subject, html: e.html, text: e.text, headers: e.headers });
          out.sent.push({ touch: touch.key, email, id: r1.id });
        } catch (e) { out.errors.push({ touch: touch.key, email, err: String(e) }); }
      }
    }
    res.status(200).json({ ok: true, ...out });
  } catch (e) {
    res.status(500).json({ error: String(e), ...out });
  }
};
