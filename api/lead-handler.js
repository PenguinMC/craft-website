// /api/lead-handler.js — Vercel serverless function.
// Sends 4 brand-styled HTML emails via Resend per new lead.

const RESEND_API = 'https://api.resend.com/emails';
const FROM = 'Parker at CRAFT <onboarding@resend.dev>';
const REPLY_TO = 'parker@flycraftchs.com';

function r(tmpl, vars) {
  return String(tmpl).replace(/\{(\w+)\}/g, function(_, k) { return vars[k] || ''; });
}

function wrap(o) {
  var html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + o.title + '</title></head>';
  html += '<body style="margin:0;padding:0;background-color:#0A0D12;color:#ffffff;font-family:\'Helvetica Neue\',Arial,sans-serif;line-height:1.55;">';
  html += '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0A0D12;padding:24px 0;"><tr><td align="center">';
  html += '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color:#14181F;border:1px solid rgba(230,48,39,0.25);border-radius:10px;max-width:600px;width:100%;">';
  html += '<tr><td style="background-color:#E63027;height:4px;border-radius:10px 10px 0 0;"></td></tr>';
  html += '<tr><td style="padding:32px 40px 20px;">';
  html += '<div style="font-family:\'Arial Black\',\'Helvetica Neue\',Arial,sans-serif;font-weight:900;font-size:28px;letter-spacing:0.06em;color:#ffffff;">CRAFT<span style="color:#E63027;">.</span></div>';
  html += '<div style="font-family:\'Courier New\',monospace;font-size:10px;letter-spacing:0.22em;color:#E63027;text-transform:uppercase;margin-top:4px;">Flight Training and Simulation</div>';
  html += '</td></tr>';
  html += '<tr><td style="padding:0 40px 12px;"><h1 style="font-family:\'Arial Black\',\'Helvetica Neue\',Arial,sans-serif;font-weight:900;font-size:30px;line-height:1.1;letter-spacing:-0.01em;color:#ffffff;margin:0 0 8px;text-transform:uppercase;">' + o.title + '</h1></td></tr>';
  html += '<tr><td style="padding:0 40px 24px;color:#ffffff;font-size:15px;line-height:1.65;">' + o.body + '</td></tr>';
  if (o.ctaLabel) {
    html += '<tr><td style="padding:0 40px 28px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#E63027;border-radius:6px;"><a href="' + o.ctaUrl + '" style="display:inline-block;padding:14px 28px;color:#ffffff;font-family:\'Arial Black\',\'Helvetica Neue\',Arial,sans-serif;font-weight:900;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;">' + o.ctaLabel + ' &rarr;</a></td></tr></table></td></tr>';
  }
  html += '<tr><td style="padding:24px 40px 28px;border-top:1px solid rgba(255,255,255,0.08);">';
  html += '<div style="font-size:14px;color:#ffffff;line-height:1.6;">Parker Hughes<br><span style="color:rgba(255,255,255,0.6);">Training Advisor and CFI</span><br>';
  html += '<a href="tel:+18438006498" style="color:#E63027;text-decoration:none;">843.800.6498</a> &middot; <a href="mailto:parker@flycraftchs.com" style="color:#E63027;text-decoration:none;">parker@flycraftchs.com</a></div></td></tr>';
  html += '<tr><td style="padding:18px 40px;background-color:#0A0D12;border-top:1px solid rgba(255,255,255,0.05);border-radius:0 0 10px 10px;font-family:\'Courier New\',monospace;font-size:10px;letter-spacing:0.22em;color:rgba(255,255,255,0.35);text-transform:uppercase;">CRAFT &middot; KCHS &middot; 6060 S Aviation Ave, North Charleston SC</td></tr>';
  html += '</table></td></tr></table></body></html>';
  return html;
}

function toText(html, signoff) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&middot;/g, '\u00b7')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n\n' + (signoff || 'Parker Hughes\nTraining Advisor and CFI\nCRAFT Flight Training and Simulation\n843.800.6498');
}

const T = {
  "homepage_welcome": {
    "subject": "Got your message at CRAFT",
    "title": "What is next for you",
    "body": "<p>Hey {firstname},</p><p>Got your message. I am Parker, Training Advisor at CRAFT.</p><p>Three ways this usually goes.</p><p><strong style=\"color:#E63027;\">Curious about flying.</strong> Book a Discovery Flight. $325 for one hour at the controls of a DA40 NG with a CFI in the right seat. You will know if this is for you.</p><p><strong style=\"color:#E63027;\">Ready to get your PPL.</strong> We can skip the Discovery and put you straight into Private Pilot training. KCHS Class C, 96 percent first-time pass rate.</p><p><strong style=\"color:#E63027;\">Already a pilot, want a rating fast.</strong> Reply with which rating (IFR, CPL, Multi, CFI) and I will send the schedule.</p><p>Easiest next step is to reply to this email or call <a href=\"tel:+18438006498\" style=\"color:#E63027;\">843.800.6498</a>. I pick up.</p>",
    "ctaLabel": "Book Discovery Flight",
    "ctaUrl": "https://parkerh.com/discovery-flight"
  },
  "accelerated_welcome": {
    "subject": "Accelerated {program} at CRAFT",
    "title": "Let us lock dates",
    "body": "<p>{firstname},</p><p>Got your inquiry for accelerated {program}. Quick rundown.</p><p>You arrive in Charleston with prerequisites done. We fly twice a day. DA40 NG or DA42 for Multi. Real Class C ATC at KCHS. Checkride pre-scheduled. 96 percent first-time pass.</p><p><strong style=\"color:#E63027;\">Typical timelines</strong></p><p style=\"color:rgba(255,255,255,0.85);\">IFR 7 days &middot; Commercial 6 days &middot; Multi 4 days<br>CFI 10 to 12 days &middot; CFI-I 3 days &middot; MEI 3 days</p><p>To lock dates, reply with three things.</p><p style=\"color:rgba(255,255,255,0.85);\">1. Current ratings plus total time<br>2. Target start window<br>3. Whether you need housing help (we have a list)</p><p>I will come back with a quote and the actual schedule. Or call <a href=\"tel:+18438006498\" style=\"color:#E63027;\">843.800.6498</a> for the fastest path.</p>",
    "ctaLabel": "See Accelerated Programs",
    "ctaUrl": "https://parkerh.com/accelerated"
  },
  "flight_school_welcome": {
    "subject": "Your PPL journey at CRAFT",
    "title": "Step by step",
    "body": "<p>Hey {firstname},</p><p>Here is exactly what the Private Pilot path looks like at CRAFT.</p><p><strong style=\"color:#E63027;\">Phase 1.</strong> Discovery Flight, $325. One hour DA40 NG. Counts toward your 40 hour minimum if you continue.</p><p><strong style=\"color:#E63027;\">Phase 2.</strong> Ground school plus first solo. Sporty's online ground school. Fly two or three times a week. First solo around 15 to 25 hours.</p><p><strong style=\"color:#E63027;\">Phase 3.</strong> Cross country plus checkride prep. Solo XCs, night ops, instrument intro. Final stage check with our chief.</p><p><strong style=\"color:#E63027;\">Phase 4.</strong> Checkride. DPE pre-scheduled.</p><p>Budget 14 to 18 thousand all in. National average is 18 to 22. We are lower because we do not pad hours. Our students average 58 hours to checkride. National average is 70.</p><p>Next step is to book a Discovery so you feel it for yourself. Or call <a href=\"tel:+18438006498\" style=\"color:#E63027;\">843.800.6498</a>.</p>",
    "ctaLabel": "Book Discovery Flight",
    "ctaUrl": "https://parkerh.com/discovery-flight"
  },
  "cost_calc_welcome": {
    "subject": "Your CRAFT cost estimate",
    "title": "What is next",
    "body": "<p>{firstname},</p><p>Saw you ran the cost calculator. Those numbers come from real student data at our school, not industry averages.</p><p>A couple things the calculator does not show.</p><p>The estimate is for self-paced training. Accelerated programs are priced as flat fees and include everything.</p><p>It assumes you will meet FAA minimums. National average is 70 hours for PPL. Our students average 58.</p><p>Discovery Flight counts toward your minimum if you start training after.</p><p>Two next steps.</p><p><strong style=\"color:#E63027;\">Still researching.</strong> Book a Discovery Flight, $325, one hour DA40 NG. Best $325 you spend before committing anywhere.</p><p><strong style=\"color:#E63027;\">Ready to start.</strong> Reply with your target start date and I will get you on the schedule.</p><p>Either way, reply here or call <a href=\"tel:+18438006498\" style=\"color:#E63027;\">843.800.6498</a>.</p>",
    "ctaLabel": "Book Discovery Flight",
    "ctaUrl": "https://parkerh.com/discovery-flight"
  },
  "chatbot_welcome": {
    "subject": "Thanks for chatting with CRAFT",
    "title": "Let us actually talk",
    "body": "<p>Hey {firstname},</p><p>The bot answers the easy questions. For the specifics about your situation, schedule, financing, transferring ratings, that is a five minute phone call.</p><p>Easiest next step, call <a href=\"tel:+18438006498\" style=\"color:#E63027;\">843.800.6498</a>. I pick up.</p><p>If you would rather type, reply to this email with three things.</p><p style=\"color:rgba(255,255,255,0.85);\">1. What you are trying to get (PPL? IFR add on? Just curious?)<br>2. Any timeline you are working with<br>3. What questions the bot could not answer</p><p>Same day reply during business hours.</p>",
    "ctaLabel": "Book Discovery Flight",
    "ctaUrl": "https://parkerh.com/discovery-flight"
  },
  "careers_welcome": {
    "subject": "Application received at CRAFT",
    "title": "Barry will be in touch",
    "body": "<p>{firstname},</p><p>Got your application. Quick on next steps.</p><p>Barry Emerson, our Director of Flight Operations, reviews every application personally. He will reach out within a week for an initial chat.</p><p>If we move forward, the process is:</p><p style=\"color:rgba(255,255,255,0.85);\">1. Phone screen with Barry, around 30 minutes<br>2. In-person interview at KCHS plus facility tour<br>3. Sim eval in the Redbird AATD<br>4. Reference checks plus offer</p><p>In the meantime if you want to add anything (recent ratings, hours, references), just reply.</p>",
    "ctaLabel": null,
    "ctaUrl": null
  },
  "day3_homepage": {
    "subject": "Still thinking about flying?",
    "title": "Quick check in",
    "body": "<p>{firstname},</p><p>Three days since you reached out. No reply yet, which is normal. Life happens.</p><p>If you are still curious, easiest next step is a Discovery Flight. One hour, $325, no commitment. Fastest way to know if flight training is something you actually want.</p><p>Or text <a href=\"tel:+18438006498\" style=\"color:#E63027;\">843.800.6498</a> with questions.</p>",
    "ctaLabel": "Book Discovery Flight",
    "ctaUrl": "https://parkerh.com/discovery-flight"
  },
  "day3_accelerated": {
    "subject": "Locking accelerated dates?",
    "title": "Still want to fly soon?",
    "body": "<p>{firstname},</p><p>Following up on your accelerated inquiry. We book slots two to four weeks out. If you want to start within the next month, now is the time to lock dates.</p><p>If you are not ready yet, just reply with your target window and I will keep an eye on availability.</p><p>Reply here or call <a href=\"tel:+18438006498\" style=\"color:#E63027;\">843.800.6498</a>.</p>",
    "ctaLabel": "See Accelerated Programs",
    "ctaUrl": "https://parkerh.com/accelerated"
  },
  "day3_flight_school": {
    "subject": "Have you flown yet?",
    "title": "Discovery Flight first",
    "body": "<p>{firstname},</p><p>Quick check in. If you have not done a Discovery Flight yet, do that before anything else.</p><p>$325 to know for sure whether flight training is right for you, before you commit to a full program. Some people get up there and love it. Others realize it is not for them. Either answer saves you money.</p><p>One hour, DA40 NG, you do most of the flying. Counts toward your PPL hours if you continue.</p>",
    "ctaLabel": "Book Discovery Flight",
    "ctaUrl": "https://parkerh.com/discovery-flight"
  },
  "day3_cost_calc": {
    "subject": "Comparing CRAFT to other schools?",
    "title": "What to actually look at",
    "body": "<p>{firstname},</p><p>If you are comparing flight schools, here is what matters more than sticker price.</p><p><strong style=\"color:#E63027;\">Hourly rates.</strong> Easy to compare. Ours, $325 per hour DA40 NG wet, $65 per hour instructor.</p><p><strong style=\"color:#E63027;\">Average hours to checkride.</strong> Schools that look cheaper often pad to 70 plus hours. We average 58.</p><p><strong style=\"color:#E63027;\">Pass rate.</strong> Ours is 96 percent first time. National is 78. Failing your checkride costs another $500 plus in re-test fees.</p><p><strong style=\"color:#E63027;\">Aircraft.</strong> DA40 NGs with G1000 NXi avionics. Most schools fly C172s from the 80s.</p><p><strong style=\"color:#E63027;\">Class C airspace.</strong> KCHS is real airline traffic. Schools at uncontrolled fields do not prep you for the real world.</p><p>Worth a call before you commit anywhere. <a href=\"tel:+18438006498\" style=\"color:#E63027;\">843.800.6498</a>.</p>",
    "ctaLabel": "Book Discovery Flight",
    "ctaUrl": "https://parkerh.com/discovery-flight"
  },
  "day3_chatbot": {
    "subject": "Still researching flight training?",
    "title": "Stop researching and go fly",
    "body": "<p>{firstname},</p><p>Most people who chat with our bot are in research mode, figuring out if flying is something they actually want to do.</p><p>If that is you, here is the honest take. Stop researching online and go fly.</p><p>You can spend three weeks reading school comparisons, watching YouTube pilots, calculating costs. Or you can spend $325 and one hour at the controls of a real airplane and know for sure.</p>",
    "ctaLabel": "Book Discovery Flight",
    "ctaUrl": "https://parkerh.com/discovery-flight"
  },
  "day7_final": {
    "subject": "Blue skies",
    "title": "Last automated email",
    "body": "<p>{firstname},</p><p>This is my last automated email. I will not keep nudging.</p><p>If flight training is not the right move right now, that is fine. Save this email. When you are ready we will be here. Charleston is not going anywhere.</p><p>If you want to chat anytime in the future, <a href=\"tel:+18438006498\" style=\"color:#E63027;\">843.800.6498</a>. Or reply to this and it comes to my inbox.</p><p>Blue skies and tailwinds.</p>",
    "ctaLabel": null,
    "ctaUrl": null
  },
  "internal_alert": {
    "subject": "{temp} LEAD: {firstname} {lastname} ({source})",
    "title": "{temp} lead",
    "body": "<p>{temp} lead just hit.</p><table role=\"presentation\" cellpadding=\"6\" cellspacing=\"0\" border=\"0\" style=\"font-family:'Courier New',monospace;font-size:14px;color:#ffffff;background:#1C2129;border-radius:8px;border:1px solid rgba(230,48,39,0.3);\"><tr><td style=\"color:rgba(255,255,255,0.55);\">NAME</td><td style=\"color:#ffffff;font-weight:bold;\">{firstname} {lastname}</td></tr><tr><td style=\"color:rgba(255,255,255,0.55);\">EMAIL</td><td><a href=\"mailto:{email}\" style=\"color:#E63027;\">{email}</a></td></tr><tr><td style=\"color:rgba(255,255,255,0.55);\">PHONE</td><td><a href=\"tel:{phone}\" style=\"color:#E63027;\">{phone}</a></td></tr><tr><td style=\"color:rgba(255,255,255,0.55);\">INTEREST</td><td>{program}</td></tr><tr><td style=\"color:rgba(255,255,255,0.55);\">SOURCE</td><td>{source}</td></tr></table><p style=\"margin-top:18px;\">Call within 5 minutes if HOT, within 1 hour if WARM, within 24 hr if COLD.</p>",
    "ctaLabel": "Call now",
    "ctaUrl": "tel:{phone}"
  }
};

const FORM_MAP = {
  "870b2177-3a5b-4bbb-961e-43923f1d3b84": {
    "welcome": "homepage_welcome",
    "day3": "day3_homepage",
    "source": "Homepage Contact",
    "temp": "WARM"
  },
  "abc1c335-31db-4e46-8b57-b364118570c7": {
    "welcome": "accelerated_welcome",
    "day3": "day3_accelerated",
    "source": "Accelerated",
    "temp": "HOT"
  },
  "4b1ded9e-709f-4292-885a-52a243ddada2": {
    "welcome": "careers_welcome",
    "day3": null,
    "source": "Careers",
    "temp": "WARM"
  },
  "01e019b1-e27a-4df1-a310-56cc88f2a7d2": {
    "welcome": "flight_school_welcome",
    "day3": "day3_flight_school",
    "source": "Flight School",
    "temp": "WARM"
  },
  "910de1fd-7ca7-4f62-88d4-e9cad413831f": {
    "welcome": "cost_calc_welcome",
    "day3": "day3_cost_calc",
    "source": "Cost Calculator",
    "temp": "HOT"
  },
  "a22614d5-4579-4ad1-95d1-d497805dae61": {
    "welcome": "chatbot_welcome",
    "day3": "day3_chatbot",
    "source": "Chatbot Gate",
    "temp": "COLD"
  }
};

async function sendEmail(o) {
  const payload = {
    from: FROM,
    to: Array.isArray(o.to) ? o.to : [o.to],
    subject: o.subject,
    html: o.html,
    text: o.text,
    reply_to: o.replyTo || REPLY_TO
  };
  if (o.scheduled_at) payload.scheduled_at = o.scheduled_at;
  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Resend ' + res.status + ': ' + JSON.stringify(data));
  return data;
}

function buildEmail(templateKey, vars) {
  const t = T[templateKey];
  if (!t) throw new Error('Unknown template: ' + templateKey);
  const subject = r(t.subject, vars);
  const title = r(t.title, vars);
  const body = r(t.body, vars);
  const ctaUrl = t.ctaUrl ? r(t.ctaUrl, vars) : null;
  const html = wrap({ title: title, body: body, ctaLabel: t.ctaLabel, ctaUrl: ctaUrl });
  const text = toText(body);
  return { subject: subject, html: html, text: text };
}

function isoFromNow(seconds) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  try {
    const body = req.body || {};
    const firstname = body.firstname || '';
    const lastname = body.lastname || '';
    const email = body.email || '';
    const phone = body.phone || '';
    const program_interest = body.program_interest || '';
    const formId = body.formId || '';

    if (!email || !firstname) { res.status(400).json({ error: 'firstname + email required' }); return; }

    const cfg = FORM_MAP[formId] || FORM_MAP['870b2177-3a5b-4bbb-961e-43923f1d3b84'];
    const vars = {
      firstname: firstname, lastname: lastname, email: email, phone: phone,
      program: program_interest || 'flight training',
      source: cfg.source, temp: cfg.temp
    };
    const ownerEmail = process.env.OWNER_EMAIL || 'parkerhughes@flycraftchs.com';
    const out = { sent: [], errors: [] };

    try {
      const e = buildEmail('internal_alert', vars);
      const r1 = await sendEmail({ to: ownerEmail, subject: e.subject, html: e.html, text: e.text, replyTo: email });
      out.sent.push({ type: 'internal_alert', id: r1.id });
    } catch (e) { out.errors.push({ type: 'internal_alert', err: String(e) }); }

    try {
      const e = buildEmail(cfg.welcome, vars);
      const r1 = await sendEmail({ to: email, subject: e.subject, html: e.html, text: e.text });
      out.sent.push({ type: 'welcome', id: r1.id });
    } catch (e) { out.errors.push({ type: 'welcome', err: String(e) }); }

    if (cfg.day3) {
      try {
        const e = buildEmail(cfg.day3, vars);
        const r1 = await sendEmail({ to: email, subject: e.subject, html: e.html, text: e.text, scheduled_at: isoFromNow(3 * 86400) });
        out.sent.push({ type: 'day3', id: r1.id });
      } catch (e) { out.errors.push({ type: 'day3', err: String(e) }); }
    }

    if (cfg.source !== 'Careers') {
      try {
        const e = buildEmail('day7_final', vars);
        const r1 = await sendEmail({ to: email, subject: e.subject, html: e.html, text: e.text, scheduled_at: isoFromNow(7 * 86400) });
        out.sent.push({ type: 'day7', id: r1.id });
      } catch (e) { out.errors.push({ type: 'day7', err: String(e) }); }
    }

    res.status(200).json({ ok: true, sent: out.sent, errors: out.errors });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
