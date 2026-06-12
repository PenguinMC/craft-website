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

module.exports = async (req, res) => {
  // Guard: Vercel sends Authorization: Bearer ${CRON_SECRET} when the env var is set.
  if (process.env.CRON_SECRET) {
    if ((req.headers['authorization'] || '') !== `Bearer ${process.env.CRON_SECRET}`) {
      res.status(401).json({ error: 'unauthorized' }); return;
    }
  }

  const out = { sent: [], skipped: [], errors: [] };
  try {
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
