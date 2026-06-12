// /api/send-info.js
// Powers the /send-info admin page. Sends one of the published Resend
// course-info templates to a single lead, no Resend UI required.
// Auth: same ADMIN_PASSWORD as the /admin pricing page.

const lh = require('./lead-handler.js');
const { resend } = lh._internal;

const COURSES = {
  ifr:        { id: 'f4cc2906-a8de-4af5-906b-76aa9af533a9', label: 'IFR (7 days, $9,900)' },
  commercial: { id: '2df8e301-4b00-42d4-81be-e2f36ab4864d', label: 'Commercial (5 days, $8,600)' },
  multi:      { id: 'a8435877-0062-48e9-b3df-67cb71366305', label: 'Multi-Engine (4 days, $9,500)' },
  cfi:        { id: 'bf040c38-9dc3-43e2-a9c8-f2407efbf4e5', label: 'CFI (10-12 days, $12,000)' },
  ppl:        { id: 'f4e62586-3747-4942-914d-1fe4d9dcc656', label: 'Private Pilot' }
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  try {
    const { password = '', course = '', firstname = '', email = '' } = req.body || {};
    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      res.status(401).json({ error: 'Wrong password' }); return;
    }
    const c = COURSES[course];
    if (!c) { res.status(400).json({ error: 'Unknown course. Use: ' + Object.keys(COURSES).join(', ') }); return; }
    if (!firstname || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      res.status(400).json({ error: 'Need a first name and a valid email' }); return;
    }

    // Pull the published template and fill the variable.
    const t = await resend(`/templates/${c.id}`, 'GET');
    if (!t.ok) { res.status(502).json({ error: 'Could not load template from Resend' }); return; }
    const html = String(t.data.html).replace(/\{\{\{FIRST_NAME\}\}\}/g, firstname);

    const send = await resend('/emails', 'POST', {
      from: t.data.from || 'CRAFT Flight Training & Simulation <craft@flycraftchs.com>',
      to: [email],
      subject: t.data.subject,
      reply_to: 'craft@flycraftchs.com',
      html
    });
    if (!send.ok) { res.status(502).json({ error: 'Resend rejected the send', detail: send.data }); return; }
    res.status(200).json({ ok: true, id: send.data.id, sent: `${t.data.subject} -> ${email}` });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
