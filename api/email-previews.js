// /api/email-previews.js
// Lets Parker read every automated email in the browser.
//   /api/email-previews          -> index of all templates
//   /api/email-previews?t=KEY    -> that email rendered with sample data
const lh = require('./lead-handler.js');
const { T, buildEmail } = lh._internal;

const SAMPLE = {
  firstname: 'Jordan', lastname: 'Sample', email: 'jordan@example.com',
  phone: '8435551234', program: 'instrument rating', source: 'Accelerated', temp: 'HOT'
};

const GROUPS = [
  ['Sent instantly (one per form)', ['homepage_welcome', 'accelerated_welcome', 'flight_school_welcome', 'cost_calc_welcome', 'chatbot_welcome', 'careers_welcome']],
  ['Day 1 nudge (everyone)', ['day1_universal']],
  ['Day 3 follow-up (per form)', ['day3_homepage', 'day3_accelerated', 'day3_flight_school', 'day3_cost_calc', 'day3_chatbot']],
  ['Days 7 / 14 / 30 (everyone)', ['day7_reality', 'day14_lastcall', 'day30_cooldown']],
  ['Days 60 / 120 (sent by daily cron)', ['day60_winback', 'day120_quarterly']],
  ['Internal (to the team, not leads)', ['internal_alert']]
];

module.exports = async (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex');
  const key = (req.query || {}).t;
  if (key) {
    if (!T[key]) { res.status(404).send('No such template. Go back to /api/email-previews'); return; }
    const e = buildEmail(key, SAMPLE, { withUnsub: key !== 'internal_alert' });
    res.status(200).setHeader('Content-Type', 'text/html');
    res.send(e.html);
    return;
  }
  let rows = '';
  for (const [label, keys] of GROUPS) {
    rows += `<h2>${label}</h2><ul>`;
    for (const k of keys) {
      const subj = T[k].subject.replace(/\{(\w+)\}/g, (_, v) => String(SAMPLE[v] || '').toUpperCase());
      rows += `<li><a href="/api/email-previews?t=${k}" target="_blank">${subj}</a> <span class="k">${k}</span></li>`;
    }
    rows += '</ul>';
  }
  res.status(200).setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>CRAFT Email Previews</title>
<style>body{background:#0A0D12;color:#fff;font-family:'Helvetica Neue',Arial,sans-serif;max-width:720px;margin:0 auto;padding:40px 20px;line-height:1.6}
h1{font-weight:900;text-transform:uppercase}h1 span{color:#E63027}
h2{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#E63027;margin:28px 0 8px}
ul{list-style:none;padding:0;margin:0}li{padding:7px 0;border-bottom:1px solid rgba(255,255,255,.07)}
a{color:#fff;text-decoration:none;font-weight:bold}a:hover{color:#E63027}
.k{font-family:'Courier New',monospace;font-size:11px;color:rgba(255,255,255,.35);margin-left:8px}</style></head>
<body><h1>Every automated email<span>.</span></h1>
<p>Click any subject to read the full email exactly as a lead sees it (sample data). These live in the website code, not in Resend's dashboard.</p>
${rows}</body></html>`);
};
