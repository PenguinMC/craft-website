// /api/lead-handler.js
// Vercel serverless. Fires alongside the HubSpot form submit on every site form.
// Sends the internal alert + an 8-touch lead sequence via Resend.
// Resend caps scheduled_at at 30 days, so T+0 through T+30 are scheduled here.
// T+60 and T+120 are sent by /api/drip-cron (daily Vercel cron, see vercel.json).

const FROM = 'CRAFT Flight Training & Simulation <craft@flycraftchs.com>';
const REPLY_TO = 'craft@flycraftchs.com';
const SITE = 'https://flycraftchs.com';   // marketing links (real domain)
const APP = 'https://flycraftchs.com';    // primary domain on Vercel since the June 2026 cutover
const LOGO = APP + '/assets/craft-logo.png';
const AUDIENCE_ID = '1d34fbda-a782-4413-9784-764f9d336df6'; // Resend "General" audience
const crypto = require('crypto');

// Render {var} placeholders. No em dashes anywhere in templates.
function r(tmpl, vars) {
  return String(tmpl).replace(/\{(\w+)\}/g, (_, k) => vars[k] || '');
}

function unsubSig(email) {
  return crypto.createHmac('sha256', process.env.ADMIN_PASSWORD || 'craft-unsub')
    .update(String(email).trim().toLowerCase()).digest('hex').slice(0, 16);
}
function unsubUrl(email) {
  return APP + '/api/unsubscribe?email=' + encodeURIComponent(email) + '&s=' + unsubSig(email);
}

// ---------- Brand-styled HTML wrapper ----------
// Inline styles only (Gmail/Outlook/Apple Mail). Dark surface, beacon red,
// real logo, Suite 109 address, unsubscribe link on every lead-facing email.
function wrap({ title, body, ctaLabel, ctaUrl, unsub }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<style>
:root { color-scheme: dark; supported-color-schemes: dark; }
body, .body-bg { background-color: #0A0D12 !important; }
</style>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0D12;color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;line-height:1.55;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0A0D12;padding:24px 0;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color:#14181F;border:1px solid rgba(230,48,39,0.25);border-radius:10px;max-width:600px;width:100%;">
<tr>
<td style="background-color:#E63027;height:4px;border-radius:10px 10px 0 0;"></td>
</tr>
<tr>
<td style="padding:32px 40px 20px;">
<img src="${LOGO}" alt="CRAFT Flight Training and Simulation" width="180" style="display:block;width:180px;height:auto;border:0;">
</td>
</tr>
<tr>
<td style="padding:0 40px 12px;">
<h1 style="font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:30px;line-height:1.1;letter-spacing:-0.01em;color:#ffffff;margin:0 0 8px;text-transform:uppercase;">
${title}
</h1>
</td>
</tr>
<tr>
<td style="padding:0 40px 24px;color:#ffffff;font-size:15px;line-height:1.65;">
${body}
</td>
</tr>
${ctaLabel ? `<tr>
<td style="padding:0 40px 28px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="background-color:#E63027;border-radius:6px;">
<a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;">${ctaLabel} &rarr;</a>
</td>
</tr>
</table>
</td>
</tr>` : ''}
<tr>
<td style="padding:24px 40px 28px;border-top:1px solid rgba(255,255,255,0.08);">
<div style="font-size:14px;color:#ffffff;line-height:1.6;">
Parker Hughes<br>
<span style="color:rgba(255,255,255,0.6);">Training Advisor and CFI</span><br>
<a href="tel:+18438006498" style="color:#E63027;text-decoration:none;">843.800.6498</a> &middot;
<a href="mailto:craft@flycraftchs.com" style="color:#E63027;text-decoration:none;">craft@flycraftchs.com</a>
</div>
${unsub ? `<div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:14px;line-height:1.5;">You're getting these because you reached out to CRAFT about flight training. <a href="${unsub}" style="color:rgba(255,255,255,0.55);text-decoration:underline;">Unsubscribe</a> with one click and you won't hear from us again.</div>` : ''}
</td>
</tr>
<tr>
<td style="padding:18px 40px;background-color:#0A0D12;border-top:1px solid rgba(255,255,255,0.05);border-radius:0 0 10px 10px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.22em;color:rgba(255,255,255,0.35);text-transform:uppercase;">
CRAFT &middot; KCHS &middot; 6060 S. Aviation Ave, Suite 109, North Charleston, SC 29406
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// Plain-text version. Strips HTML.
function toText(html, unsub) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&middot;/g, '·')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    + '\n\nParker Hughes\nTraining Advisor and CFI\nCRAFT Flight Training and Simulation\n843.800.6498'
    + (unsub ? '\n\nUnsubscribe: ' + unsub : '');
}

// ---------- Templates ----------
// Vars: {firstname}, {lastname}, {email}, {phone}, {program}, {source}, {temp}.
// Voice: a CFI talking to you, not marketing copy. ALL CAPS subjects. No em dashes.
const T = {

  // ===== T+0 welcomes, one per form =====
  homepage_welcome: {
    subject: 'GOT YOUR MESSAGE. HERE IS THE FAST PATH.',
    title: 'What is next for you?',
    body: `<p>Hey {firstname},</p>
<p>Parker here. I run training at CRAFT at Charleston International. Got your message, so let me save you some clicking. This usually goes one of three ways:</p>
<p><strong style="color:#E63027;">Never flown, curious.</strong> Book a Discovery Flight. $325, one hour at the controls of a Diamond DA40 NG with a CFI in the right seat. You will know by the time you land.</p>
<p><strong style="color:#E63027;">Ready for your license.</strong> Private Pilot at your pace, 1 to 3 lessons a week. Class C airspace, real ATC, 96% first-time pass rate.</p>
<p><strong style="color:#E63027;">Already rated, want the next one fast.</strong> Reply with the rating (IFR, Commercial, Multi, CFI) and your target month. I will send dates and a flat price.</p>
<p>Fastest answer: reply to this email or call <a href="tel:+18438006498" style="color:#E63027;">843.800.6498</a>. I pick up.</p>`,
    ctaLabel: 'Book a Discovery Flight',
    ctaUrl: SITE + '/discovery-flight'
  },

  accelerated_welcome: {
    subject: 'LET US LOCK YOUR DATES',
    title: 'Let us lock dates',
    body: `<p>{firstname},</p>
<p>You asked about accelerated training, so here is how it works. You arrive with prerequisites done. We fly twice a day, sim mornings, airplane afternoons. The DPE is booked before your course starts, so the checkride date is locked from day one. 96% first-time pass rate.</p>
<p><strong style="color:#E63027;">Timelines and flat prices:</strong></p>
<p style="color:rgba(255,255,255,0.85);">IFR: 7 days, $9,900<br>Commercial: 5 days, $8,600<br>Multi-Engine add-on: 4 days, $9,500<br>CFI initial: 10 to 12 days, $12,000<br>CFII: $4,950 when bundled with the CFI, about 4 extra days</p>
<p>Slots book 2 to 4 weeks out. To get on the calendar, reply with:</p>
<p style="color:rgba(255,255,255,0.85);">1. Current ratings and total time<br>2. Target start window</p>
<p>I will come back with a real schedule, not a brochure. Or call <a href="tel:+18438006498" style="color:#E63027;">843.800.6498</a> and we will sort it in five minutes.</p>`,
    ctaLabel: 'See the Programs',
    ctaUrl: SITE + '/accelerated'
  },

  flight_school_welcome: {
    subject: 'YOUR FIRST LICENSE. THE REAL NUMBERS.',
    title: 'Step by step, no fog',
    body: `<p>Hey {firstname},</p>
<p>Here is exactly what Private Pilot training looks like at CRAFT, numbers included, because most schools make you ask twice.</p>
<p><strong style="color:#E63027;">The path.</strong> Discovery Flight first. Then ground school plus flying toward your first solo. Then cross-countries and checkride prep. Then the ride itself. We work directly with local DPEs, so when you are ready, the date is locked. No waitlist scramble.</p>
<p><strong style="color:#E63027;">The money.</strong> DA40 NG at $260 per hour, instruction at $65 per hour. The FAA minimum is 40 hours, call it a $13.5K floor. Our students average about 58 hours, so a realistic budget is around $19.6K. We quote you the floor and the realistic number, because surprising you at hour 50 is how schools lose students.</p>
<p><strong style="color:#E63027;">The pace.</strong> 1, 2, or 3 lessons a week, your schedule. Online written prep is included, and your CFI backs it up with one-on-one ground.</p>
<p>Best first step is the Discovery Flight. $325, one hour, you do most of the flying, and it counts toward your 40 if you continue.</p>`,
    ctaLabel: 'Book a Discovery Flight',
    ctaUrl: SITE + '/discovery-flight'
  },

  cost_calc_welcome: {
    subject: 'ABOUT THAT NUMBER YOU JUST RAN',
    title: 'Your estimate, with context',
    body: `<p>{firstname},</p>
<p>Saw you ran the cost calculator. Those numbers come from our actual rates, not industry averages, so they are worth more than most quotes you will collect this week. Three things the calculator cannot tell you:</p>
<p><strong style="color:#E63027;">Cadence is the hidden variable.</strong> Fly 2 to 3 times a week and the skills stick, so you finish in fewer total hours. Stretch it thin and you pay to relearn. Same rates, very different totals.</p>
<p><strong style="color:#E63027;">Accelerated is a different animal.</strong> Ratings like IFR and Commercial run as flat-fee programs. One price, everything included, checkride pre-booked.</p>
<p><strong style="color:#E63027;">The Discovery Flight counts.</strong> $325, one hour in the DA40 NG, and the time goes in your logbook if you continue.</p>
<p>Still researching? Book the Discovery. Ready to start? Reply with your target date and I will get you on the schedule. Or call <a href="tel:+18438006498" style="color:#E63027;">843.800.6498</a>.</p>`,
    ctaLabel: 'Book a Discovery Flight',
    ctaUrl: SITE + '/discovery-flight'
  },

  chatbot_welcome: {
    subject: 'THE BOT DID ITS BEST. I AM THE HUMAN.',
    title: 'Let us actually talk',
    body: `<p>Hey {firstname},</p>
<p>The chat widget handles the easy questions. Your actual situation, your schedule, your budget, whether your old logbook hours still count, that is a five minute phone call with a person.</p>
<p>I am the person. <a href="tel:+18438006498" style="color:#E63027;">843.800.6498</a>, I pick up.</p>
<p>Prefer typing? Reply to this with three things:</p>
<p style="color:rgba(255,255,255,0.85);">What you are after (first license, a rating, just curious)<br>Any timeline you care about<br>Whatever the bot could not answer</p>
<p>Same-day reply during business hours. That is not a slogan, it is just my inbox.</p>`,
    ctaLabel: 'Book a Discovery Flight',
    ctaUrl: SITE + '/discovery-flight'
  },

  careers_welcome: {
    subject: 'APPLICATION RECEIVED',
    title: 'Barry will be in touch',
    body: `<p>{firstname},</p>
<p>Got your application, thanks for sending it. Barry reviews every application personally and will reach out within the week.</p>
<p>If we move forward, the process looks like this:</p>
<p style="color:rgba(255,255,255,0.85);">1. Phone screen, about 30 minutes<br>2. In-person at KCHS plus a facility tour<br>3. Sim eval in the Redbird AATD<br>4. References and offer</p>
<p>Want to add anything in the meantime, new ratings, updated hours, references? Just reply to this email.</p>`,
    ctaLabel: null,
    ctaUrl: null
  },

  // ===== T+1 universal nudge =====
  day1_universal: {
    subject: 'ONE QUESTION',
    title: 'One question',
    body: `<p>{firstname},</p>
<p>Quick one. Yesterday I sent you the rundown. Today I just want to know one thing:</p>
<p><strong style="color:#E63027;">What is the actual goal?</strong></p>
<p>First license. A rating you have been putting off. The airlines. Or just finally scratching the itch. One line back is plenty. I will point you at the right thing and skip everything that does not apply to you.</p>`,
    ctaLabel: null,
    ctaUrl: null
  },

  // ===== T+3 form-specific =====
  day3_homepage: {
    subject: 'STILL THINKING ABOUT FLYING?',
    title: 'Three days. Still here.',
    body: `<p>{firstname},</p>
<p>Three days since you reached out. No reply needed, life happens. But here is the thing about thinking it over: no amount of reading settles it. One hour at the controls does.</p>
<p>$325, Diamond DA40 NG, CFI next to you, you fly the airplane. You will walk away knowing, one way or the other.</p>
<p>Questions first? Text or call <a href="tel:+18438006498" style="color:#E63027;">843.800.6498</a>.</p>`,
    ctaLabel: 'Book a Discovery Flight',
    ctaUrl: SITE + '/discovery-flight'
  },

  day3_accelerated: {
    subject: 'CALENDAR REALITY CHECK',
    title: 'Dates go fast',
    body: `<p>{firstname},</p>
<p>Following up on your accelerated inquiry with the part nobody tells you: the bottleneck is never the instruction, it is the calendar. Our slots book 2 to 4 weeks out, and we lock a DPE before every course, which means dates disappear in pairs.</p>
<p>If you want to train in the next 60 days, now is the moment to claim dates. If your window is further out, reply with the month and I will watch availability for you. Zero pressure, just physics.</p>
<p><a href="tel:+18438006498" style="color:#E63027;">843.800.6498</a> if a call is faster.</p>`,
    ctaLabel: 'See the Programs',
    ctaUrl: SITE + '/accelerated'
  },

  day3_flight_school: {
    subject: 'FLY FIRST. DECIDE AFTER.',
    title: 'The $325 answer',
    body: `<p>{firstname},</p>
<p>One piece of advice before you commit to any flight school, ours included: fly first.</p>
<p>Some people get up there and it rewires them. Some realize it is not for them. Both answers are worth $325, because the second one saves you twenty grand and the first one starts your logbook. The Discovery hour counts toward your 40 if you continue.</p>
<p>One hour, DA40 NG, you do most of the flying.</p>`,
    ctaLabel: 'Book a Discovery Flight',
    ctaUrl: SITE + '/discovery-flight'
  },

  day3_cost_calc: {
    subject: 'HOW TO COMPARE FLIGHT SCHOOLS',
    title: 'What the sticker hides',
    body: `<p>{firstname},</p>
<p>If you are comparing schools this week, compare these four things, not the hourly rate on the homepage:</p>
<p><strong style="color:#E63027;">Hours to checkride.</strong> Padding is where budgets die. Our students average about 58 hours. Ask every school you call for their average, and watch a few of them change the subject.</p>
<p><strong style="color:#E63027;">First-time pass rate.</strong> Ours is 96%, documented. A failed checkride costs you a retest fee and weeks of momentum.</p>
<p><strong style="color:#E63027;">The aircraft.</strong> DA40 NG with G1000 NXi glass. Hours on a modern panel transfer to everything you fly afterward. Hours on a 1970s panel mostly do not.</p>
<p><strong style="color:#E63027;">The airspace.</strong> KCHS is Class C. Real ATC from lesson one, not a quiet strip where the radio is optional.</p>
<p>Worth a five minute call before you commit anywhere: <a href="tel:+18438006498" style="color:#E63027;">843.800.6498</a>.</p>`,
    ctaLabel: 'Book a Discovery Flight',
    ctaUrl: SITE + '/discovery-flight'
  },

  day3_chatbot: {
    subject: 'STOP RESEARCHING. GO FLY.',
    title: 'Research mode has a cure',
    body: `<p>{firstname},</p>
<p>Most people who hit our chat widget are deep in research mode. Tabs open, YouTube comparisons, cost spreadsheets. I have watched it for years, so believe me when I say there is no spreadsheet exit from research mode.</p>
<p>There is one cure: an hour at the controls. $325, one DA40 NG, one CFI, one answer.</p>`,
    ctaLabel: 'Book a Discovery Flight',
    ctaUrl: SITE + '/discovery-flight'
  },

  // ===== T+7 universal =====
  day7_reality: {
    subject: 'THE HONEST MATH ON WAITING',
    title: 'Waiting costs more than training',
    body: `<p>{firstname},</p>
<p>A week since you reached out, so here is the honest math, then I will ease off.</p>
<p>Training prices do not go down. DPE calendars do not open up. And the FAA minimum is the same number whether you start this month or in two years. The only thing waiting buys is a later version of the same decision, usually at a higher rate.</p>
<p>If the holdup is <strong style="color:#E63027;">timing</strong>, reply with the month and I will plan around it. If it is <strong style="color:#E63027;">budget</strong>, ask me about financing, we have options. If you <strong style="color:#E63027;">picked another school</strong>, reply and tell me, no hard feelings, and I will stop emailing you about it.</p>`,
    ctaLabel: 'See Financing Options',
    ctaUrl: SITE + '/financing'
  },

  // ===== T+14 last call =====
  day14_lastcall: {
    subject: 'LAST CALL FROM ME',
    title: 'Last push, promise',
    body: `<p>{firstname},</p>
<p>This is the last frequent email you will get from me. After today I check in rarely, and only to see if timing changed.</p>
<p>So while it is in front of you: if there is one question keeping you from starting, cost, schedule, the medical, whether you are too old (you are not, we have started students in their 60s), reply with it right now. One question, one honest answer.</p>
<p>And if the answer is just "not now," that is allowed. Reply "later" and I will leave you alone until you say otherwise.</p>`,
    ctaLabel: null,
    ctaUrl: null
  },

  // ===== T+30 cooldown =====
  day30_cooldown: {
    subject: '30 DAYS LATER. STILL INTERESTED?',
    title: 'Quick pulse check',
    body: `<p>{firstname},</p>
<p>It has been a month since you asked about {program}. One-line reply, any of these:</p>
<p style="color:rgba(255,255,255,0.85);">"Still interested" and I will pick up where we left off<br>"Wrong timing" with a month and I will circle back then<br>"Went elsewhere" and I will wish you blue skies<br>"Stop" and the emails stop</p>
<p>Ten seconds of your time, and either way you stop getting guessed at.</p>`,
    ctaLabel: null,
    ctaUrl: null
  },

  // ===== T+60 winback (sent by /api/drip-cron) =====
  day60_winback: {
    subject: 'THE SEAT IS STILL OPEN',
    title: 'Two months later',
    body: `<p>{firstname},</p>
<p>Two months since you first asked about flight training. I am not going to pretend something dramatic changed, the fleet is the same five DA40s and the twin, the pass rate is still 96%, Charleston weather is still better than where most people train.</p>
<p>What might have changed is your situation. If the itch is still there, the shortest path back is one word: reply "dates" and I will send the current calendar. Or book the Discovery hour and let the airplane argue my case.</p>`,
    ctaLabel: 'Book a Discovery Flight',
    ctaUrl: SITE + '/discovery-flight'
  },

  // ===== T+120 quarterly (sent by /api/drip-cron) =====
  day120_quarterly: {
    subject: 'STILL HERE WHEN YOU ARE READY',
    title: 'No pitch. Just a beacon.',
    body: `<p>{firstname},</p>
<p>No pitch in this one. People start training six months, a year, three years after their first inquiry. It is the most normal thing in aviation.</p>
<p>So keep this email. When the time is right, reply to it. It lands in my actual inbox, not a queue, and we will pick up exactly where you left off.</p>
<p>Blue skies and tailwinds.</p>`,
    ctaLabel: null,
    ctaUrl: null
  },

  // ===== Internal alert to owner =====
  internal_alert: {
    subject: '{temp} LEAD: {firstname} {lastname} ({source})',
    title: '{temp} lead in',
    body: `<p>New {temp} lead off the {source} form.</p>
<table role="presentation" cellpadding="6" cellspacing="0" border="0" style="font-family:'Courier New',monospace;font-size:14px;color:#ffffff;background:#1C2129;border-radius:8px;border:1px solid rgba(230,48,39,0.3);">
<tr><td style="color:rgba(255,255,255,0.55);">NAME</td><td style="color:#ffffff;font-weight:bold;">{firstname} {lastname}</td></tr>
<tr><td style="color:rgba(255,255,255,0.55);">EMAIL</td><td><a href="mailto:{email}" style="color:#E63027;">{email}</a></td></tr>
<tr><td style="color:rgba(255,255,255,0.55);">PHONE</td><td><a href="tel:{phone}" style="color:#E63027;">{phone}</a></td></tr>
<tr><td style="color:rgba(255,255,255,0.55);">INTEREST</td><td>{program}</td></tr>
<tr><td style="color:rgba(255,255,255,0.55);">SOURCE</td><td>{source}</td></tr>
</table>
<p style="margin-top:18px;">Speed-to-lead: HOT inside 5 minutes, WARM inside the hour, COLD same day. The welcome email already went out, the drip is queued, your job is the phone call.</p>`,
    ctaLabel: 'Call Now',
    ctaUrl: 'tel:{phone}'
  }
};

const FORM_MAP = {
  '870b2177-3a5b-4bbb-961e-43923f1d3b84': { welcome: 'homepage_welcome', day3: 'day3_homepage', src: 'homepage_contact', source: 'Homepage Contact', temp: 'WARM' },
  'abc1c335-31db-4e46-8b57-b364118570c7': { welcome: 'accelerated_welcome', day3: 'day3_accelerated', src: 'accelerated', source: 'Accelerated', temp: 'HOT' },
  '4b1ded9e-709f-4292-885a-52a243ddada2': { welcome: 'careers_welcome', day3: null, src: 'careers', source: 'Careers', temp: 'WARM' },
  '01e019b1-e27a-4df1-a310-56cc88f2a7d2': { welcome: 'flight_school_welcome', day3: 'day3_flight_school', src: 'flight_school', source: 'Flight School', temp: 'WARM' },
  '910de1fd-7ca7-4f62-88d4-e9cad413831f': { welcome: 'cost_calc_welcome', day3: 'day3_cost_calc', src: 'cost_calculator', source: 'Cost Calculator', temp: 'HOT' },
  'a22614d5-4579-4ad1-95d1-d497805dae61': { welcome: 'chatbot_welcome', day3: 'day3_chatbot', src: 'chatbot', source: 'Chatbot Gate', temp: 'COLD' }
};

// ---------- Resend plumbing ----------
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Resend caps at 5 requests/second. One lead fires 8+ requests, so retry 429s.
async function resend(path, method, payload, attempt = 0) {
  const res = await fetch('https://api.resend.com' + path, {
    method,
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined
  });
  if (res.status === 429 && attempt < 3) {
    await sleep(700 * (attempt + 1));
    return resend(path, method, payload, attempt + 1);
  }
  let data = {};
  try { data = await res.json(); } catch (e) { /* empty body is fine */ }
  return { ok: res.ok, status: res.status, data };
}

async function isUnsubscribed(email) {
  const r1 = await resend(`/audiences/${AUDIENCE_ID}/contacts/${encodeURIComponent(email)}`, 'GET');
  return !!(r1.ok && r1.data && r1.data.unsubscribed === true);
}

async function addToAudience(email, firstname, lastname) {
  // 409/422 if the contact already exists: fine, ignore.
  await resend(`/audiences/${AUDIENCE_ID}/contacts`, 'POST', {
    email, first_name: firstname || '', last_name: lastname || '', unsubscribed: false
  });
}

async function sendEmail({ to, subject, html, text, scheduled_at, replyTo, headers }) {
  const payload = {
    from: FROM,
    to: Array.isArray(to) ? to : [to],
    subject, html, text,
    reply_to: replyTo || REPLY_TO
  };
  if (scheduled_at) payload.scheduled_at = scheduled_at;
  if (headers) payload.headers = headers;
  const r1 = await resend('/emails', 'POST', payload);
  if (!r1.ok) throw new Error(`Resend ${r1.status}: ${JSON.stringify(r1.data)}`);
  return r1.data;
}

function buildEmail(templateKey, vars, { withUnsub = true } = {}) {
  const t = T[templateKey];
  if (!t) throw new Error('Unknown template: ' + templateKey);
  const subject = r(t.subject, vars);
  const title = r(t.title, vars);
  const body = r(t.body, vars);
  const ctaUrl = t.ctaUrl ? r(t.ctaUrl, vars) : null;
  const unsub = withUnsub && vars.email ? unsubUrl(vars.email) : null;
  const html = wrap({ title, body, ctaLabel: t.ctaLabel, ctaUrl, unsub });
  const text = toText(body, unsub);
  const headers = unsub ? {
    'List-Unsubscribe': `<${unsub}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
  } : undefined;
  return { subject, html, text, headers };
}

function isoFromNow(days) {
  return new Date(Date.now() + days * 86400 * 1000).toISOString();
}

// Drip scheduled at submit time. Resend caps scheduled_at at 30 days;
// day60_winback and day120_quarterly are handled by /api/drip-cron.
function dripPlan(cfg) {
  if (cfg.source === 'Careers') return [];
  return [
    ['day1_universal', 1],
    [cfg.day3, 3],
    ['day7_reality', 7],
    ['day14_lastcall', 14],
    ['day30_cooldown', 30]
  ].filter(d => d[0]);
}


// ---------- HubSpot sync + Slack alert ----------
const HS_PORTAL = '50822208';
const PIPELINE_ID = '908741278';
const STAGE_NEW_LEAD = '1378445218';
const OWNERS = { deanna: '164470445', amber: '86327753', parker: '164470446', max: '164470444' };
const OWNER_NAMES = { '164470445': 'Deanna', '86327753': 'Amber', '164470446': 'Parker', '164470444': 'Max' };

// Routing: Deanna owns accelerated + cost calculator (HOT money leads),
// Amber owns careers, everything else round-robins Parker / Max by email hash.
function routeOwner(src, email) {
  if (src === 'accelerated' || src === 'cost_calculator') return OWNERS.deanna;
  if (src === 'careers') return OWNERS.amber;
  let h = 0;
  for (const ch of String(email).toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 2 === 0 ? OWNERS.parker : OWNERS.max;
}

async function hubspot(path, method, payload) {
  const res = await fetch('https://api.hubapi.com' + path, {
    method,
    headers: { 'Authorization': `Bearer ${process.env.HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined
  });
  let data = {};
  try { data = await res.json(); } catch (e) { /* fine */ }
  return { ok: res.ok, status: res.status, data };
}

// Create-or-update the contact with temperature, source, owner. The HubSpot
// form submit from the browser may create the bare contact first or after us;
// both orders are handled (409 -> patch existing).
async function upsertContact(vars, cfg, ownerId) {
  const properties = {
    email: vars.email, firstname: vars.firstname, lastname: vars.lastname, phone: vars.phone,
    lead_temperature: cfg.temp.toLowerCase(),
    lead_source_detail: cfg.src,
    last_form_submitted: Date.now(),
    hubspot_owner_id: ownerId
  };
  const create = await hubspot('/crm/v3/objects/contacts', 'POST', { properties });
  if (create.ok) return create.data.id;
  if (create.status === 409) {
    const m = String(create.data.message || '').match(/(\d+)\s*$/);
    if (m) {
      const patch = await hubspot(`/crm/v3/objects/contacts/${m[1]}`, 'PATCH', { properties });
      if (patch.ok) return m[1];
    }
  }
  throw new Error(`HubSpot contact ${create.status}: ${JSON.stringify(create.data)}`);
}

// One open deal card per person in the Flight Training Funnel.
async function ensureDeal(contactId, vars, cfg, ownerId) {
  const assoc = await hubspot(`/crm/v4/objects/contacts/${contactId}/associations/deals`, 'GET');
  if (assoc.ok && assoc.data.results && assoc.data.results.length > 0) return { existing: true };
  const deal = await hubspot('/crm/v3/objects/deals', 'POST', {
    properties: {
      dealname: `${vars.firstname} ${vars.lastname} - ${cfg.source}`.trim(),
      pipeline: PIPELINE_ID,
      dealstage: STAGE_NEW_LEAD,
      hubspot_owner_id: ownerId
    },
    associations: [{
      to: { id: contactId },
      types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }]
    }]
  });
  if (!deal.ok) throw new Error(`HubSpot deal ${deal.status}: ${JSON.stringify(deal.data)}`);
  return { id: deal.data.id };
}

// Create a call task for the owner, associated to the contact (and deal).
async function createCallTask(contactId, dealId, vars, cfg, ownerId) {
  const due = Date.now() + (cfg.temp === 'HOT' ? 1 : 4) * 3600 * 1000;
  const associations = [{ to: { id: contactId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 204 }] }];
  if (dealId) associations.push({ to: { id: dealId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 216 }] });
  const r1 = await hubspot('/crm/v3/objects/tasks', 'POST', {
    properties: {
      hs_task_subject: `CALL ${vars.firstname} ${vars.lastname} - new ${cfg.source} lead`.trim(),
      hs_task_body: `${vars.phone || 'no phone'} | ${vars.email} | interest: ${vars.program}. ${cfg.temp} lead: ${cfg.temp === 'HOT' ? 'call inside the hour' : 'call today'}.`,
      hs_timestamp: due,
      hs_task_status: 'NOT_STARTED',
      hs_task_type: 'CALL',
      hs_task_priority: cfg.temp === 'HOT' ? 'HIGH' : 'MEDIUM',
      hubspot_owner_id: ownerId
    },
    associations
  });
  if (!r1.ok) throw new Error(`HubSpot task ${r1.status}: ${JSON.stringify(r1.data)}`);
  return r1.data.id;
}

// Slack alert. Returns false when SLACK_WEBHOOK_URL is not configured,
// in which case the caller falls back to the email alert.
async function slackAlert(vars, cfg, contactId, ownerId) {
  const hook = process.env.SLACK_WEBHOOK_URL;
  if (!hook) return false;
  const link = contactId ? `\n<https://app.hubspot.com/contacts/${HS_PORTAL}/record/0-1/${contactId}|Open in HubSpot>` : '';
  const text = `New lead: *${vars.firstname} ${vars.lastname}*\n` +
    `Form: ${cfg.source}\n` +
    `${vars.phone || 'no phone'} | ${vars.email}${link}`;
  const res = await fetch(hook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error(`Slack webhook ${res.status}`);
  return true;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  try {
    const { formId, firstname = '', lastname = '', email = '', phone = '', program_interest = '' } = req.body || {};
    if (!email || !firstname) { res.status(400).json({ error: 'firstname + email required' }); return; }

    const cfg = FORM_MAP[formId] || FORM_MAP['870b2177-3a5b-4bbb-961e-43923f1d3b84'];
    const vars = {
      firstname, lastname, email, phone,
      program: (program_interest || '').replace(/_/g, ' ') || 'flight training',
      source: cfg.source, temp: cfg.temp
    };
    const ownerEmail = process.env.OWNER_EMAIL || 'parkerhughes@flycraftchs.com';
    const out = { sent: [], errors: [], skipped: [] };

    // 1. HubSpot: contact with temperature/source/owner + deal card in New Lead.
    let contactId = null;
    const ownerId = routeOwner(cfg.src, email);
    try {
      contactId = await upsertContact(vars, cfg, ownerId);
      out.hubspot = { contactId, owner: OWNER_NAMES[ownerId] };
    } catch (e) { out.errors.push({ type: 'hubspot_contact', err: String(e) }); }
    let dealId = null;
    // Deal cards are for the accelerated money funnel only.
    if (contactId && (cfg.src === 'accelerated' || cfg.src === 'cost_calculator')) {
      try {
        const d = await ensureDeal(contactId, vars, cfg, ownerId);
        out.hubspot.deal = d;
        dealId = d.id || null;
      } catch (e) { out.errors.push({ type: 'hubspot_deal', err: String(e) }); }
    }
    // Every lead gets a call task for its owner (except careers, Barry handles).
    if (contactId && cfg.src !== 'careers') {
      try { out.hubspot.task = await createCallTask(contactId, dealId, vars, cfg, ownerId); }
      catch (e) { out.errors.push({ type: 'hubspot_task', err: String(e) }); }
    }

    // 2. Alert: Slack when configured, email alert as fallback so we are never blind.
    let alerted = false;
    try { alerted = await slackAlert(vars, cfg, contactId, ownerId); if (alerted) out.sent.push({ type: 'slack_alert' }); }
    catch (e) { out.errors.push({ type: 'slack_alert', err: String(e) }); }
    if (!alerted) {
      try {
        const e = buildEmail('internal_alert', vars, { withUnsub: false });
        const r1 = await sendEmail({ to: ownerEmail, subject: e.subject, html: e.html, text: e.text, replyTo: email });
        out.sent.push({ type: 'internal_alert', id: r1.id });
      } catch (e) { out.errors.push({ type: 'internal_alert', err: String(e) }); }
    }

    // 2. Respect prior unsubscribes: alert still fires, lead emails do not.
    if (await isUnsubscribed(email)) {
      out.skipped.push('lead previously unsubscribed, no emails sent to lead');
      res.status(200).json({ ok: true, ...out });
      return;
    }

    // 3. Track the lead in the Resend audience (future broadcasts).
    try { await addToAudience(email, firstname, lastname); } catch (e) { /* non-fatal */ }

    // 4. Welcome, instant.
    try {
      const e = buildEmail(cfg.welcome, vars);
      const r1 = await sendEmail({ to: email, subject: e.subject, html: e.html, text: e.text, headers: e.headers });
      out.sent.push({ type: cfg.welcome, id: r1.id });
    } catch (e) { out.errors.push({ type: cfg.welcome, err: String(e) }); }

    // 5. Drip, scheduled.
    for (const [key, days] of dripPlan(cfg)) {
      try {
        await sleep(250); // stay under Resend's 5 req/s
        const e = buildEmail(key, vars);
        const r1 = await sendEmail({ to: email, subject: e.subject, html: e.html, text: e.text, headers: e.headers, scheduled_at: isoFromNow(days) });
        out.sent.push({ type: key, id: r1.id, in_days: days });
      } catch (e) { out.errors.push({ type: key, err: String(e) }); }
    }

    res.status(200).json({ ok: true, ...out });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};

// Shared internals for /api/drip-cron.js and /api/unsubscribe.js
module.exports._internal = { T, FORM_MAP, wrap, toText, r, buildEmail, sendEmail, resend, isUnsubscribed, unsubSig, unsubUrl, AUDIENCE_ID };
