// CRAFT Lead Capture — direct-to-HubSpot CRM, bypasses HubSpot Forms entirely.
//
// Why this exists:
//   HubSpot Forms get unpublished by API PATCHes (any structural change → draft state).
//   Republishing requires the `forms-write` scope which our Private App token doesn't have.
//   This serverless function uses the `crm.objects.contacts.write` scope (which IS granted)
//   to upsert a contact directly — works whether forms are published or not.
//
// Used by: /cost-calculator gate, /assets/chatbot.js gate
//
// POST /api/lead
//   { firstname, lastname, email, phone, lead_track }
//
// Env: HUBSPOT_TOKEN must be set in Vercel project settings.

export default async function handler(req, res) {
  // CORS — allow same-origin and the *.vercel.app preview domains
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

  const { firstname, lastname, email, phone, lead_track, page_uri, page_name } = body;

  if (!email || !firstname) {
    return res.status(400).json({ error: 'missing_required', detail: 'firstname and email required' });
  }

  // Whitelist lead_track to prevent injection
  const validTracks = new Set(['cost_calculator', 'chatbot', 'general', 'accelerated', 'self_paced', 'discovery', 'careers']);
  const track = validTracks.has(lead_track) ? lead_track : 'general';

  const props = {
    firstname: String(firstname).trim().slice(0, 100),
    email: String(email).trim().toLowerCase().slice(0, 200),
    craft_lead_track: track,
  };
  if (lastname) props.lastname = String(lastname).trim().slice(0, 100);
  if (phone)    props.phone    = String(phone).trim().slice(0, 50);

  // Upsert by email — HubSpot CRM batch upsert endpoint
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

    // Optional: log a note on the contact with the page they came from
    return res.status(200).json({ ok: true, track, contact_id: data?.results?.[0]?.id || null });
  } catch (e) {
    console.error('Lead capture error', e);
    return res.status(500).json({ error: 'internal' });
  }
}
