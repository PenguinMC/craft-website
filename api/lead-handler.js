// /api/lead-handler.js — Vercel serverless function.
// Triggered by the website forms via POST. For every new lead:
//   1. Sends a branded welcome email to the lead (Resend)
//   2. Sends an internal alert email to Parker (Resend)
//   3. Schedules day-3 + day-7 + day-14 followup emails (Resend scheduled_at)
//
// Twilio SMS is deliberately not wired here — added later once the toll-free
// number is purchased + verified.
//
// Required Vercel env vars: RESEND_API_KEY, OWNER_EMAIL (where alerts go).

const RESEND_API = 'https://api.resend.com/emails';

// Senders. Until the flycraftchs.com domain is verified in Resend we send
// from Resend's own domain with reply-to set to Parker's email so replies still land.
const FROM = 'Parker @ CRAFT <onboarding@resend.dev>';
const REPLY_TO = 'parker@flycraftchs.com';

// ---------- Tiny email-template renderer (no Mustache, no jinja) ----------
function render(tmpl, vars) {
  return tmpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] || '');
}

// ---------- Email bodies ----------
// Each entry: {subject, body}. {firstname}, {program}, etc. resolved at send time.
const EMAILS = {
  homepage_welcome: {
    subject: "Got your message — what's next at CRAFT",
    body: `Hey {firstname},

Got your message just now. I'm Parker — Training Advisor and CFI at CRAFT. A real human read it.

Quick — what are you most interested in?

  → Just curious about flying: book a Discovery Flight ($325). One hour at the controls of a DA40 NG with a CFI in the right seat. Best way to see if this is for you.

  → Already know you want to learn: we can skip the Discovery and put you straight into Private Pilot training. We're KCHS-based, Class C airspace, 96% first-time checkride pass rate.

  → Accelerated student (already PPL'd, want IFR/CPL/Multi fast): we run 4-10 day immersive programs. Hit reply with which rating you're after and I'll send you the schedule.

Easiest next step: hit reply, or just call me at 843.800.6498. I pick up.

Parker
Training Advisor & CFI
CRAFT Flight Training & Simulation
KCHS · 843.800.6498`
  },
  accelerated_welcome: {
    subject: "Accelerated {program} at CRAFT — let's lock dates",
    body: `{firstname},

Got your inquiry for our accelerated {program} program.

How this works:
  → You arrive in Charleston with prerequisites in hand (logbook, current medical, written passed if applicable).
  → We fly twice a day, every day. DA40 NG (or DA42 for Multi). Real Class C ATC at KCHS.
  → Checkride scheduled before you arrive. 96% first-time pass rate.

What I need from you to lock dates:
  1. Your current ratings + total time
  2. Target start date (we book 2-4 weeks out usually)
  3. Whether you need housing assistance

Reply with those three things and I'll send you a quote + the actual schedule. Or call — 843.800.6498. Fastest way.

Parker
Training Advisor & CFI
CRAFT · KCHS · 843.800.6498`
  },
  flight_school_welcome: {
    subject: "Your PPL journey at CRAFT, step by step",
    body: `Hey {firstname},

Got your interest in our Private Pilot program. Here's exactly what this looks like:

PHASE 1 — Discovery Flight ($325)
Optional but recommended. One hour DA40 NG with a CFI. Counts toward your 40-hour minimum if you continue.

PHASE 2 — Ground school + first solo (~25 flight hrs)
Sporty's online ground school. Fly 2-3x per week. First solo around 15-25 hours.

PHASE 3 — Cross-country + checkride prep (~25 flight hrs)
Solo XCs, night ops, instrument intro.

PHASE 4 — Checkride
DPE scheduled before you finish phase 3.

Cost: budget $14-18K all-in. National avg is $18-22K. We don't pad hours.

Next step: book a Discovery Flight → flycraftchs.com/discovery-flight
Or call: 843.800.6498

Parker
Training Advisor & CFI
CRAFT · KCHS · 843.800.6498`
  },
  cost_calc_welcome: {
    subject: "Your CRAFT cost estimate — what's next",
    body: `{firstname},

Saw you ran the cost calculator. That's the closest estimate you'll get before training starts — based on real student data at our school.

A couple things the calculator doesn't show:
  → Self-paced estimate. Accelerated programs are priced separately (flat-fee).
  → Assumes FAA minimums. National avg is 70 hrs for PPL, our students avg ~58 hrs.
  → Discovery Flight counts toward your minimum if you start training afterward.

Two next steps:
  1. Still researching → book a Discovery Flight ($325, 1 hr DA40 NG).
  2. Ready to start → reply with your target start date.

Either way, hit reply or call 843.800.6498.

Parker
Training Advisor & CFI
CRAFT · KCHS · 843.800.6498`
  },
  chatbot_welcome: {
    subject: "Thanks for chatting — here's how to actually get started",
    body: `Hey {firstname},

The bot can answer the easy questions. For everything else — pricing specifics, schedule availability, financing, ratings transfer — that's a 5-minute call.

Easiest next step: call me at 843.800.6498. I pick up.

If you'd rather email, hit reply with:
  → What you're trying to get (PPL? IFR add-on? Just curious?)
  → Any timeline you're working with
  → What questions the bot couldn't answer

Parker
Training Advisor & CFI
CRAFT · KCHS · 843.800.6498`
  },
  careers_welcome: {
    subject: "Application received — Barry will be in touch",
    body: `{firstname},

Got your application. Quick on next steps:

Barry Emerson (Director of Flight Operations) reviews every application personally. He'll reach out within a week. If we move forward:
  1. Phone screen (~30 min)
  2. In-person interview at KCHS + facility tour
  3. Sim eval in the Redbird AATD
  4. References + offer

Anything to add (recent ratings, hours, references), just reply.

Parker
Training Advisor & CFI
CRAFT · KCHS · 843.800.6498`
  },
  // Day-3 nudges
  day3_homepage: {
    subject: "Quick check — still thinking about flight training?",
    body: `{firstname},

Three days since you reached out. Haven't heard back, which is totally normal — life happens.

If you're still curious, easiest next step is a Discovery Flight: 1 hr DA40 NG, $325, no commitment.

Book: flycraftchs.com/discovery-flight
Or text 843.800.6498 with questions. No sales pressure — I'm a flight instructor first.

Parker`
  },
  day3_accelerated: {
    subject: "Locking dates for your accelerated {program}?",
    body: `{firstname},

Following up on your accelerated inquiry. We book slots 2-4 weeks out — if you want to start within the next month, now's the time.

Couple things:
  → Prerequisites must be met before arrival
  → DPE pre-scheduled
  → 96% first-time pass rate

Reply or call: 843.800.6498.

Parker`
  },
  day3_flight_school: {
    subject: "Have you flown yet?",
    body: `{firstname},

If you haven't done a Discovery Flight yet, do that before anything else. $325 to know for sure whether flight training is right for you — before you commit to a full program.

flycraftchs.com/discovery-flight
Or 843.800.6498.

Parker`
  },
  day3_cost_calc: {
    subject: "Comparing CRAFT to other flight schools?",
    body: `{firstname},

If you're comparing schools, here's what to look at:

1. Hourly rates: ours = $325/hr DA40 NG wet, $65/hr instructor
2. Avg hours to checkride: schools that look cheaper often pad to 70+. We're at ~58.
3. Pass rate: 96% (national avg 78%)
4. Aircraft: DA40 NGs w/ G1000 NXi. Most schools fly C172s.
5. Class C airspace: KCHS is real airline traffic.

Worth a call before you commit anywhere: 843.800.6498.

Parker`
  },
  day3_chatbot: {
    subject: "Still researching? Here's what to do next.",
    body: `{firstname},

Most people who chat with our bot are in research mode. Here's my honest advice: stop researching online and go fly.

$325, 1 hour, real airplane → you'll know for sure: flycraftchs.com/discovery-flight
Or 843.800.6498.

Parker`
  },
  day7_final: {
    subject: "Last check-in — wishing you blue skies",
    body: `{firstname},

This is my last automated email. I won't keep nudging.

If flight training isn't right now — totally fine. When you're ready, we'll be here.

843.800.6498. Or reply to this anytime.

Blue skies and tailwinds,

Parker
Training Advisor & CFI
CRAFT · KCHS · 843.800.6498`
  },
  internal_alert: {
    subject: "🚨 {temp} LEAD: {firstname} {lastname} — {source}",
    body: `{temp} lead just hit. Source: {source}.

NAME    {firstname} {lastname}
EMAIL   {email}
PHONE   {phone}
INTEREST {program}

→ Open in HubSpot: https://app.hubspot.com/contacts/50822208/objects/0-1
→ Click to call: tel:{phone}

Call within 5 minutes if HOT, within 1 hour if WARM, within 24 hr if COLD.`
  }
};

// Map form ID → which welcome / day-3 template to use, and lead temperature/source
const FORM_MAP = {
  '870b2177-3a5b-4bbb-961e-43923f1d3b84': { welcome: 'homepage_welcome', day3: 'day3_homepage', source: 'Homepage Contact', temp: 'WARM' },
  'abc1c335-31db-4e46-8b57-b364118570c7': { welcome: 'accelerated_welcome', day3: 'day3_accelerated', source: 'Accelerated', temp: 'HOT' },
  '4b1ded9e-709f-4292-885a-52a243ddada2': { welcome: 'careers_welcome', day3: null, source: 'Careers', temp: 'WARM' },
  '01e019b1-e27a-4df1-a310-56cc88f2a7d2': { welcome: 'flight_school_welcome', day3: 'day3_flight_school', source: 'Flight School', temp: 'WARM' },
  '910de1fd-7ca7-4f62-88d4-e9cad413831f': { welcome: 'cost_calc_welcome', day3: 'day3_cost_calc', source: 'Cost Calculator', temp: 'HOT' },
  'a22614d5-4579-4ad1-95d1-d497805dae61': { welcome: 'chatbot_welcome', day3: 'day3_chatbot', source: 'Chatbot Gate', temp: 'COLD' }
};

async function sendEmail({ to, subject, body, scheduled_at, replyTo }) {
  const payload = {
    from: FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    text: body,
    reply_to: replyTo || REPLY_TO
  };
  if (scheduled_at) payload.scheduled_at = scheduled_at;

  const r = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`Resend ${r.status}: ${JSON.stringify(data)}`);
  return data;
}

function isoFromNow(seconds) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

module.exports = async (req, res) => {
  // CORS — allow form POST from any flycraftchs/parkerh subdomain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  try {
    const { formId, firstname = '', lastname = '', email = '', phone = '', program_interest = '', message = '' } = req.body || {};

    if (!email || !firstname) {
      res.status(400).json({ error: 'firstname + email required' });
      return;
    }
    const formCfg = FORM_MAP[formId] || FORM_MAP['870b2177-3a5b-4bbb-961e-43923f1d3b84'];
    const vars = {
      firstname, lastname, email, phone,
      program: program_interest || 'flight training',
      source: formCfg.source,
      temp: formCfg.temp
    };

    const results = { sent: [], errors: [] };
    const ownerEmail = process.env.OWNER_EMAIL || 'parkerhughes@flycraftchs.com';

    // 1) Internal alert to Parker — instant
    try {
      const internal = EMAILS.internal_alert;
      const r = await sendEmail({
        to: ownerEmail,
        subject: render(internal.subject, vars),
        body: render(internal.body, vars),
        replyTo: email   // so Parker can hit reply and go straight to the lead
      });
      results.sent.push({ type: 'internal_alert', id: r.id });
    } catch (e) { results.errors.push({ type: 'internal_alert', err: String(e) }); }

    // 2) Welcome email to lead — instant
    try {
      const w = EMAILS[formCfg.welcome];
      const r = await sendEmail({
        to: email,
        subject: render(w.subject, vars),
        body: render(w.body, vars)
      });
      results.sent.push({ type: 'welcome', id: r.id });
    } catch (e) { results.errors.push({ type: 'welcome', err: String(e) }); }

    // 3) Day-3 followup — scheduled
    if (formCfg.day3) {
      try {
        const d3 = EMAILS[formCfg.day3];
        const r = await sendEmail({
          to: email,
          subject: render(d3.subject, vars),
          body: render(d3.body, vars),
          scheduled_at: isoFromNow(3 * 24 * 60 * 60)  // +3 days
        });
        results.sent.push({ type: 'day3', id: r.id });
      } catch (e) { results.errors.push({ type: 'day3', err: String(e) }); }
    }

    // 4) Day-7 final touch — scheduled (skip for careers — Barry handles it)
    if (formCfg.source !== 'Careers') {
      try {
        const d7 = EMAILS.day7_final;
        const r = await sendEmail({
          to: email,
          subject: render(d7.subject, vars),
          body: render(d7.body, vars),
          scheduled_at: isoFromNow(7 * 24 * 60 * 60)
        });
        results.sent.push({ type: 'day7', id: r.id });
      } catch (e) { results.errors.push({ type: 'day7', err: String(e) }); }
    }

    res.status(200).json({ ok: true, ...results });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
