// /api/preview.js - sends ONE of every template to OWNER_EMAIL so Parker can review the full pipeline
const handler = require('./lead-handler.js');

const RESEND_API = 'https://api.resend.com/emails';

module.exports = async (req, res) => {
  // Reuse the FROM/REPLY_TO/wrap/T objects by re-importing - but easier to just call them via require's leak
  // Instead, replicate the minimal logic.
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'POST or GET' }); return;
  }

  try {
    const owner = process.env.OWNER_EMAIL || 'parkerhughes@flycraftchs.com';
    // For preview, we POST to /api/lead-handler with each of the 5 form IDs (Careers excluded since just 1 email)
    // This is the cleanest way - reuses the actual templates and schedules
    const baseUrl = (req.headers['x-forwarded-host'] && ('https://' + req.headers['x-forwarded-host'])) || 'https://parkerh.com';
    const forms = [
      { id: '870b2177-3a5b-4bbb-961e-43923f1d3b84', name: 'Homepage Contact' },
      { id: 'abc1c335-31db-4e46-8b57-b364118570c7', name: 'Accelerated' },
      { id: '4b1ded9e-709f-4292-885a-52a243ddada2', name: 'Careers' },
      { id: '01e019b1-e27a-4df1-a310-56cc88f2a7d2', name: 'Flight School' },
      { id: '910de1fd-7ca7-4f62-88d4-e9cad413831f', name: 'Cost Calculator' },
      { id: 'a22614d5-4579-4ad1-95d1-d497805dae61', name: 'Chatbot Gate' }
    ];

    const results = [];
    for (const f of forms) {
      const r = await fetch(baseUrl + '/api/lead-handler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: f.id,
          firstname: 'PREVIEW-' + f.name,
          lastname: 'Sample',
          email: owner,
          phone: '8438006498',
          program_interest: 'discovery_flight'
        })
      });
      const j = await r.json();
      results.push({ form: f.name, ok: r.ok, sent: (j.sent || []).length, errors: (j.errors || []).length });
    }
    res.status(200).json({ ok: true, message: 'Preview emails fired. Check ' + owner, results });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
