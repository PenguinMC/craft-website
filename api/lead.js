// CRAFT Lead Capture — direct-to-HubSpot CRM, bypasses HubSpot Forms entirely.
//
// Why this exists:
//   HubSpot Forms got into a corrupt state via repeated API PATCHes.
//   Republishing requires the `forms-write` scope which our Private App token doesn't have.
//   This serverless function uses `crm.objects.contacts.write` (which IS granted)
//   to upsert a contact directly — works regardless of any form state.
//
// Used by every form on the site.
//
// POST /api/lead
//   firstname, lastname, email, phone, lead_track, plus any whitelisted custom props.
//
// Env: HUBSPOT_TOKEN must be set in Vercel project settings.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const TOKEN = process.env.HUBSPOT_TOKEN;
  if (!TOKEN) return res.status(500).json({ error: 'missing_token' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const { firstname, email } = body;
  if (!email || !firstname) {
    return res.status(400).json({ error: 'missing_required', detail: 'firstname and email required' });
  }

  // Whitelist lead_track to prevent injection
  const validTracks = new Set(['cost_calculator', 'chatbot', 'general', 'accelerated', 'self_paced', 'discovery', 'careers']);
  const track = validTracks.has(body.lead_track) ? body.lead_track : 'general';

  // Whitelist of contact properties we'll accept from the client
  const PROP_MAP = {
    firstname: { max: 100 },
    lastname:  { max: 100 },
    email:     { max: 200, transform: (s) => s.toLowerCase() },
    phone:     { max: 50 },
    message:   { max: 5000, target: 'message' },
    program_interest:    { max: 50, target: 'craft_program_interest' },
    total_flight_hours:  { num: true, target: 'craft_total_flight_hours' },
    target_start:        { max: 30, target: 'craft_target_start' },
    financing:           { bool: true, target: 'craft_financing' },
    role_applied_for:    { max: 30, target: 'craft_role_applied_for' },
    checkride_failures:  { num: true, target: 'craft_checkride_failures' },
    dual_given_hours:    { num: true, target: 'craft_dual_given_hours' },
    resume_url:          { max: 500, target: 'craft_resume_url' },
  };

  const props = { craft_lead_track: track };
  for (const [key, cfg] of Object.entries(PROP_MAP)) {
    const v = body[key];
    if (v === undefined || v === null || v === '') continue;
    const target = cfg.target || key;
    if (cfg.num) {
      const n = parseFloat(v);
      if (!isNaN(n)) props[target] = n;
    } else if (cfg.bool) {
      props[target] = (v === true || v === 'true' || v === 'yes') ? 'true' : 'false';
    } else {
      let s = String(v).trim().slice(0, cfg.max || 200);
      if (cfg.transform) s = cfg.transform(s);
      props[target] = s;
    }
  }

  // Upsert by email
  try {
    const resp = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [{ idProperty: 'email', id: props.email, properties: props }],
      }),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error('HubSpot upsert failed', resp.status, data);
      return res.status(502).json({ error: 'hubspot_error', status: resp.status });
    }

    return res.status(200).json({ ok: true, track, contact_id: data?.results?.[0]?.id || null });
  } catch (e) {
    console.error('Lead capture error', e);
    return res.status(500).json({ error: 'internal' });
  }
}
