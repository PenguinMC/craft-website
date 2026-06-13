// /api/calendly-webhook.js
// Calendly -> HubSpot bridge (native integration needs Enterprise-only scopes).
// On invitee.created: upsert the contact, stamp discovery_booked_at, set lead
// status, and create/advance their deal to Discovery Scheduled.
// Auth: ?k=<sig> query param (HMAC, same secret family as unsubscribe links).

const lh = require('./lead-handler.js');
const { unsubSig } = lh._internal;

const PIPELINE_ID = '908741278';
const STAGE_DISCOVERY = '1378445221'; // Discovery Scheduled
const OWNERS = { parker: '164470446', max: '164470444' };

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

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  if ((req.query || {}).k !== unsubSig('calendly')) { res.status(401).json({ error: 'bad key' }); return; }
  try {
    const body = req.body || {};
    if (body.event !== 'invitee.created') { res.status(200).json({ ok: true, ignored: body.event }); return; }
    const inv = (body.payload || {});
    const email = String(inv.email || '').trim().toLowerCase();
    if (!email) { res.status(200).json({ ok: false, error: 'no email in payload' }); return; }
    const first = inv.first_name || String(inv.name || '').split(' ')[0] || '';
    const last = inv.last_name || String(inv.name || '').split(' ').slice(1).join(' ') || '';
    let phone = '';
    for (const qa of (inv.questions_and_answers || [])) {
      if (/phone|number|cell/i.test(qa.question || '')) phone = qa.answer || '';
    }
    const startTime = ((inv.scheduled_event || {}).start_time) || null;

    // Upsert contact
    const props = {
      email, firstname: first, lastname: last,
      hs_lead_status: 'discovery_booked',
      discovery_booked_at: startTime ? new Date(startTime).getTime() : Date.now()
    };
    if (phone) props.phone = phone;
    let contactId = null;
    const create = await hubspot('/crm/v3/objects/contacts', 'POST', { properties: props });
    if (create.ok) contactId = create.data.id;
    else if (create.status === 409) {
      const m = String(create.data.message || '').match(/(\d+)\s*$/);
      if (m) {
        delete props.email;
        const patch = await hubspot(`/crm/v3/objects/contacts/${m[1]}`, 'PATCH', { properties: props });
        if (patch.ok) contactId = m[1];
      }
    }
    if (!contactId) { res.status(200).json({ ok: false, error: 'contact upsert failed', detail: create.data }); return; }

    // Deal: advance existing open deal, or create one in Discovery Scheduled
    const out = { contactId };
    const assoc = await hubspot(`/crm/v4/objects/contacts/${contactId}/associations/deals`, 'GET');
    const existing = (assoc.ok && assoc.data.results && assoc.data.results[0]) ? assoc.data.results[0].toObjectId : null;
    if (existing) {
      await hubspot(`/crm/v3/objects/deals/${existing}`, 'PATCH', { properties: { dealstage: STAGE_DISCOVERY } });
      out.deal = { id: existing, moved: 'Discovery Scheduled' };
    } else {
      let h = 0;
      for (const ch of email) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      const deal = await hubspot('/crm/v3/objects/deals', 'POST', {
        properties: {
          dealname: `${first} ${last} - Discovery Flight`.trim(),
          pipeline: PIPELINE_ID, dealstage: STAGE_DISCOVERY,
          hubspot_owner_id: h % 2 === 0 ? OWNERS.parker : OWNERS.max
        },
        associations: [{ to: { id: contactId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }] }]
      });
      out.deal = { id: (deal.data || {}).id, created: 'Discovery Scheduled' };
    }
    res.status(200).json({ ok: true, ...out });
  } catch (e) {
    res.status(200).json({ ok: false, error: String(e) });
  }
};
