// /api/deal-webhook.js
// HubSpot private-app webhook target. Fires when a deal's stage changes.
// When a deal in the Flight Training Funnel moves to Enrolled (= deposit paid),
// sends the course-materials packet via Resend exactly once (materials_sent stamp).
// Configure in HubSpot: Settings -> Integrations -> Private Apps -> the app ->
// Webhooks -> target https://flycraftchs.com/api/deal-webhook,
// subscribe: deal.propertyChange (dealstage).

const lh = require('./lead-handler.js');
const { resend } = lh._internal;

const PIPELINE_ID = '908741278';
const STAGE_ENROLLED = '1378445223';
const GENERIC_TEMPLATE = '332f755d-5bb2-45c9-910a-ac5f91b4c6e9'; // course-materials

const COURSE_LABELS = [
  [/ifr|instrument/i, 'IFR'], [/cpl|commercial/i, 'Commercial'],
  [/multi|mei/i, 'Multi-Engine'], [/cfii/i, 'CFII'], [/cfi/i, 'CFI'],
  [/ppl|private/i, 'Private Pilot']
];

async function hubspot(path, method, payload) {
  const res = await fetch('https://api.hubapi.com' + path, {
    method: method || 'GET',
    headers: { 'Authorization': `Bearer ${process.env.HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined
  });
  let data = {};
  try { data = await res.json(); } catch (e) { /* fine */ }
  return { ok: res.ok, status: res.status, data };
}

async function processDeal(dealId, out) {
  const d = await hubspot(`/crm/v3/objects/deals/${dealId}?properties=dealname,dealstage,pipeline,materials_sent&associations=contacts`);
  if (!d.ok) { out.errors.push(`deal ${dealId}: ${d.status}`); return; }
  const p = d.data.properties || {};
  if (p.pipeline !== PIPELINE_ID || p.dealstage !== STAGE_ENROLLED) { out.skipped.push(`${dealId}: not enrolled`); return; }
  if (p.materials_sent) { out.skipped.push(`${dealId}: materials already sent`); return; }
  const assoc = ((d.data.associations || {}).contacts || {}).results || [];
  if (!assoc.length) { out.errors.push(`${dealId}: no contact attached`); return; }
  const c = await hubspot(`/crm/v3/objects/contacts/${assoc[0].id}?properties=email,firstname,program_interest`);
  const cp = (c.data || {}).properties || {};
  if (!cp.email) { out.errors.push(`${dealId}: contact has no email`); return; }

  const hint = `${cp.program_interest || ''} ${p.dealname || ''}`;
  const course = (COURSE_LABELS.find(([re]) => re.test(hint)) || [null, 'accelerated'])[1];

  const t = await resend(`/templates/${GENERIC_TEMPLATE}`, 'GET');
  if (!t.ok) { out.errors.push(`${dealId}: template fetch failed`); return; }
  const html = String(t.data.html)
    .replace(/\{\{\{FIRST_NAME\}\}\}/g, cp.firstname || 'there')
    .replace(/\{\{\{COURSE\}\}\}/g, course);
  const send = await resend('/emails', 'POST', {
    from: t.data.from, to: [cp.email], subject: t.data.subject,
    reply_to: 'craft@flycraftchs.com', html
  });
  if (!send.ok) { out.errors.push(`${dealId}: send failed ${JSON.stringify(send.data)}`); return; }

  await hubspot(`/crm/v3/objects/deals/${dealId}`, 'PATCH', { properties: { materials_sent: Date.now() } });
  out.sent.push({ dealId, email: cp.email, course });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    const dealIds = [...new Set(events.filter(e => e && e.objectId).map(e => String(e.objectId)))];
    const out = { sent: [], skipped: [], errors: [] };
    for (const id of dealIds) await processDeal(id, out);
    res.status(200).json({ ok: true, ...out });
  } catch (e) {
    res.status(200).json({ ok: false, error: String(e) }); // 200 so HubSpot doesn't retry-storm
  }
};
