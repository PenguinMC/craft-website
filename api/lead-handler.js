// /api/lead-handler.js
// Vercel serverless function. Fires alongside HubSpot form submit.
// Sends 4 brand-styled HTML emails via Resend per new lead.

const RESEND_API = 'https://api.resend.com/emails';
const FROM = 'Parker at CRAFT <onboarding@resend.dev>';
const REPLY_TO = 'parker@flycraftchs.com';

// Render {var} placeholders. No em dashes anywhere in templates.
function r(tmpl, vars) {
  return String(tmpl).replace(/\{(\w+)\}/g, (_, k) => vars[k] || '');
}

// ---------- Brand-styled HTML wrapper ----------
// Keeps inline styles only (best for Gmail/Outlook/Apple Mail).
// Dark surface, beacon-red accents, large display headline, CTA button.
function wrap({ title, body, ctaLabel, ctaUrl, footerNote }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
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
<div style="font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:28px;letter-spacing:0.06em;color:#ffffff;">
CRAFT<span style="color:#E63027;">.</span>
</div>
<div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.22em;color:#E63027;text-transform:uppercase;margin-top:4px;">
Flight Training and Simulation
</div>
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
<a href="mailto:parker@flycraftchs.com" style="color:#E63027;text-decoration:none;">parker@flycraftchs.com</a>
</div>
${footerNote ? `<div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:14px;line-height:1.5;">${footerNote}</div>` : ''}
</td>
</tr>
<tr>
<td style="padding:18px 40px;background-color:#0A0D12;border-top:1px solid rgba(255,255,255,0.05);border-radius:0 0 10px 10px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.22em;color:rgba(255,255,255,0.35);text-transform:uppercase;">
CRAFT &middot; KCHS &middot; 6060 S Aviation Ave, North Charleston SC
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// Plain-text version (auto-generated from HTML body). Strips HTML.
function toText(html, signoff) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&middot;/g, '·')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n\n' + (signoff || 'Parker Hughes\nTraining Advisor and CFI\nCRAFT Flight Training and Simulation\n843.800.6498');
}

// ---------- Templates ----------
// All templates use {firstname}, {program}, {phone}, {email}, etc.
// Copy is direct. No em dashes. No "I am not a salesperson" defensiveness.
const T = {
  homepage_welcome: {
    subject: "Got your message at CRAFT",
    title: "What is next for you?",
    body: `<p>Hey {firstname},</p>
<p>Got your message. I am Parker, Training Advisor at CRAFT.</p>
<p>Three ways this usually goes:</p>
<p><strong style="color:#E63027;">Curious about flying.</strong> Book a Discovery Flight. $325 for one hour at the controls of a DA40 NG with a CFI in the right seat. You will know if this is for you.</p>
<p><strong style="color:#E63027;">Ready to get your PPL.</strong> We can skip the Discovery and put you straight into Private Pilot training. KCHS Class C, 96 percent first-time pass rate.</p>
<p><strong style="color:#E63027;">Already a pilot, want a rating fast.</strong> Reply with which rating (IFR, CPL, Multi, CFI) and I will send you the schedule.</p>
<p>Easiest next step: reply to this email or call <a href="tel:+18438006498" style="color:#E63027;">843.800.6498</a>. I pick up.</p>`,
    ctaLabel: "Book Discovery Flight",
    ctaUrl: "https://parkerh.com/discovery-flight"
  },
  accelerated_welcome: {
    subject: "Accelerated {program} at CRAFT",
    title: "Let us lock dates",
    body: `<p>{firstname},</p>
<p>Got your inquiry for our accelerated {program} program. Quick rundown.</p>
<p>You arrive in Charleston with prerequisites done. We fly twice a day. DA40 NG or DA42 for Multi. Real Class C ATC at KCHS. Checkride pre-scheduled. 96 percent first-time pass.</p>
<p><strong style="color:#E63027;">Typical timelines:</strong></p>
<p style="color:rgba(255,255,255,0.85);">IFR 7 days &middot; Commercial 6 days &middot; Multi 4 days<br>CFI 10 to 12 days &middot; CFI-I 3 days &middot; MEI 3 days</p>
<p>To lock dates, reply with:</p>
<p style="color:rgba(255,255,255,0.85);">1. Current ratings plus total time<br>2. Target start window<br>3. Whether you need housing help (we have a list)</p>
<p>I will come back with a quote and the actual schedule. Or call <a href="tel:+18438006498" style="color:#E63027;">843.800.6498</a> for the fastest path.</p>`,
    ctaLabel: "See Accelerated Programs",
    ctaUrl: "https://parkerh.com/accelerated"
  },
  flight_school_welcome: {
    subject: "Your PPL journey at CRAFT",
    title: "Step by step",
    body: `<p>Hey {firstname},</p>
<p>Here is exactly what the Private Pilot path looks like at CRAFT.</p>
<p><strong style="color:#E63027;">Phase 1.</strong> Discovery Flight, $325. One hour DA40 NG. Counts toward your 40 hour minimum if you continue.</p>
<p><strong style="color:#E63027;">Phase 2.</strong> Ground school plus first solo. Sporty's online ground school. Fly two or three times a week. First solo around 15 to 25 hours.</p>
<p><strong style="color:#E63027;">Phase 3.</strong> Cross country plus checkride prep. Solo XCs, night ops, instrument intro. Final stage check with our chief.</p>
<p><strong style="color:#E63027;">Phase 4.</strong> Checkride. DPE pre-scheduled. We do not run programs without one locked.</p>
<p>Budget 14 to 18 thousand all in. National average is 18 to 22. We are lower because we do not pad hours. Our students average 58 hours to checkride. National average is 70.</p>
<p>Next step: book a Discovery so you feel it for yourself. Or call <a href="tel:+18438006498" style="color:#E63027;">843.800.6498</a>.</p>`,
    ctaLabel: "Book Discovery Flight",
    ctaUrl: "https://parkerh.com/discovery-flight"
  },
  cost_calc_welcome: {
    subject: "Your CRAFT cost estimate",
    title: "What is next",
    body: `<p>{firstname},</p>
<p>Saw you ran the cost calculator. Those numbers come from real student data at our school, not industry averages.</p>
<p>A couple things the calculator does not show.</p>
<p>The estimate is for self-paced training. Accelerated programs are priced as flat fees and include everything.</p>
<p>It assumes you will meet FAA minimums. National average is 70 hours for PPL. Our students average 58. We do not pad hours.</p>
<p>Discovery Flight counts toward your minimum if you start training after.</p>
<p>Two next steps depending on where you are.</p>
<p><strong style="color:#E63027;">Still researching:</strong> book a Discovery Flight, $325, one hour DA40 NG. Best $325 you spend before committing anywhere.</p>
<p><strong style="color:#E63027;">Ready to start:</strong> reply with your target start date and I will get you on the schedule.</p>
<p>Either way, reply here or call <a href="tel:+18438006498" style="color:#E63027;">843.800.6498</a>.</p>`,
    ctaLabel: "Book Discovery Flight",
    ctaUrl: "https://parkerh.com/discovery-flight"
  },
  chatbot_welcome: {
    subject: "Thanks for chatting with CRAFT",
    title: "Let us actually talk",
    body: `<p>Hey {firstname},</p>
<p>The bot can answer the easy questions. For everything else, the specifics about your situation, schedule, financing, transferring ratings, that is a five minute phone call.</p>
<p>Easiest next step: call <a href="tel:+18438006498" style="color:#E63027;">843.800.6498</a>. I pick up.</p>
<p>If you would rather type, reply to this email with:</p>
<p style="color:rgba(255,255,255,0.85);">What you are trying to get (PPL? IFR add on? Just curious?)<br>Any timeline you are working with<br>What questions the bot could not answer</p>
<p>I will get back same day during business hours.</p>`,
    ctaLabel: "Book Discovery Flight",
    ctaUrl: "https://parkerh.com/discovery-flight"
  },
  careers_welcome: {
    subject: "Application received at CRAFT",
    title: "Barry will be in touch",
    body: `<p>{firstname},</p>
<p>Got your application. Quick on next steps.</p>
<p>Barry Emerson, our Director of Flight Operations, reviews every application personally. He will reach out within a week for an initial chat.</p>
<p>If we move forward, the process is:</p>
<p style="color:rgba(255,255,255,0.85);">1. Phone screen with Barry, around 30 minutes<br>2. In-person interview at KCHS plus facility tour<br>3. Sim eval in the Redbird AATD<br>4. Reference checks plus offer</p>
<p>In the meantime if you want to add anything to your application (recent ratings, hours updates, references), just reply.</p>`,
    ctaLabel: null,
    ctaUrl: null
  },
  // Day-3 nudges
  day3_homepage: {
    subject: "Still thinking about flying?",
    title: "Quick check in",
    body: `<p>{firstname},</p>
<p>Three days since you reached out. No reply yet, which is normal. Life happens.</p>
<p>If you are still curious, easiest next step is a Discovery Flight. One hour, $325, no commitment. Fastest way to know if flight training is something you actually want.</p>
<p>Or text <a href="tel:+18438006498" style="color:#E63027;">843.800.6498</a> with questions.</p>`,
    ctaLabel: "Book Discovery Flight",
    ctaUrl: "https://parkerh.com/discovery-flight"
  },
  day3_accelerated: {
    subject: "Locking accelerated dates?",
    title: "Still want to fly soon?",
    body: `<p>{firstname},</p>
<p>Following up on your accelerated inquiry. We book slots two to four weeks out. If you want to start within the next month, now is the time to lock dates.</p>
<p>If you are not ready yet, just reply with your target window and I will keep an eye on availability.</p>
<p>Reply here or call <a href="tel:+18438006498" style="color:#E63027;">843.800.6498</a>.</p>`,
    ctaLabel: "See Accelerated Programs",
    ctaUrl: "https://parkerh.com/accelerated"
  },
  day3_flight_school: {
    subject: "Have you flown yet?",
    title: "Discovery Flight first",
    body: `<p>{firstname},</p>
<p>Quick check in. If you have not done a Discovery Flight yet, do that before anything else.</p>
<p>$325 to know for sure whether flight training is right for you, before you commit to a full program. Some people get up there and love it. Others realize it is not for them. Either answer saves you a lot of money.</p>
<p>One hour, DA40 NG, you do most of the flying. Counts toward your PPL hours if you continue.</p>`,
    ctaLabel: "Book Discovery Flight",
    ctaUrl: "https://parkerh.com/discovery-flight"
  },
  day3_cost_calc: {
    subject: "Comparing CRAFT to other schools?",
    title: "What to actually look at",
    body: `<p>{firstname},</p>
<p>If you are comparing flight schools, here is what matters more than sticker price.</p>
<p><strong style="color:#E63027;">Hourly rates.</strong> Easy to compare. Ours: $325 per hour DA40 NG wet, $65 per hour instructor.</p>
<p><strong style="color:#E63027;">Average hours to checkride.</strong> Schools that look cheaper often pad to 70 plus hours. We average 58.</p>
<p><strong style="color:#E63027;">Pass rate.</strong> Ours is 96 percent first time. National is 78. Failing your checkride costs another $500 plus in re-test fees.</p>
<p><strong style="color:#E63027;">Aircraft.</strong> DA40 NGs with G1000 NXi avionics. Most schools fly C172s from the 80s.</p>
<p><strong style="color:#E63027;">Class C airspace.</strong> KCHS is real airline traffic. Schools at uncontrolled fields do not prep you for the real world.</p>
<p>Worth a ca