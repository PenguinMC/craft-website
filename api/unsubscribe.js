// /api/unsubscribe.js
// One-click unsubscribe. Linked from the footer of every lead-facing email and
// from the List-Unsubscribe header (RFC 8058 one-click POST).
// Does two things:
//   1. Marks the contact unsubscribed in the Resend audience (lead-handler and
//      drip-cron both check this before sending anything in the future).
//   2. Cancels every still-scheduled Resend email queued for that address.

const lh = require('./lead-handler.js');
const { resend, unsubSig, AUDIENCE_ID } = lh._internal;

async function markUnsubscribed(email) {
  // Create (in case they were never added), then patch. Either may 4xx, fine.
  await resend(`/audiences/${AUDIENCE_ID}/contacts`, 'POST', { email, unsubscribed: true });
  await resend(`/audiences/${AUDIENCE_ID}/contacts/${encodeURIComponent(email)}`, 'PATCH', { unsubscribed: true });
}

async function cancelScheduled(email) {
  const target = email.toLowerCase();
  let canceled = 0, after = null;
  for (let page = 0; page < 10; page++) {
    const path = '/emails?limit=100' + (after ? `&after=${after}` : '');
    const r1 = await resend(path, 'GET');
    if (!r1.ok || !r1.data.data || !r1.data.data.length) break;
    for (const e of r1.data.data) {
      const tos = (e.to || []).map(t => String(t).toLowerCase());
      if (e.last_event === 'scheduled' && tos.includes(target)) {
        const c = await resend(`/emails/${e.id}/cancel`, 'POST');
        if (c.ok) canceled++;
      }
    }
    if (!r1.data.has_more) break;
    after = r1.data.data[r1.data.data.length - 1].id;
  }
  return canceled;
}

function page(message) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark"><title>CRAFT</title></head>
<body style="margin:0;background:#0A0D12;color:#fff;font-family:'Helvetica Neue',Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
<div style="max-width:480px;padding:40px;background:#14181F;border:1px solid rgba(230,48,39,0.25);border-radius:10px;border-top:4px solid #E63027;">
<div style="font-weight:900;font-size:24px;letter-spacing:0.06em;">CRAFT<span style="color:#E63027;">.</span></div>
<p style="line-height:1.6;color:rgba(255,255,255,0.85);">${message}</p>
<p style="font-size:12px;color:rgba(255,255,255,0.4);">CRAFT Flight Training and Simulation &middot; KCHS &middot; 6060 S. Aviation Ave, Suite 109, North Charleston, SC 29406</p>
</div></body></html>`;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') { res.status(405).json({ error: 'GET or POST' }); return; }
  try {
    const q = req.query || {};
    const email = String(q.email || '').trim();
    const s = String(q.s || '');
    if (!email || unsubSig(email) !== s) {
      res.status(400).setHeader('Content-Type', 'text/html');
      res.send(page('That unsubscribe link is invalid or expired. Email <a href="mailto:craft@flycraftchs.com" style="color:#E63027;">craft@flycraftchs.com</a> and we will remove you by hand.'));
      return;
    }
    await markUnsubscribed(email);
    const canceled = await cancelScheduled(email);
    if (req.method === 'POST') { res.status(200).json({ ok: true, canceled }); return; }
    res.status(200).setHeader('Content-Type', 'text/html');
    res.send(page("Done. You're unsubscribed and anything we had queued for you is canceled. No hard feelings. If you ever want back in, just reach out, a human reads that inbox."));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
