/* ===========================================================
   CRAFT site-wide chatbot widget
   Self-contained: injects DOM, styles, and Q&A logic.
   Drop in via <script src="/assets/chatbot.js" defer></script>
   =========================================================== */
(function () {
  if (window.__CRAFT_CHATBOT_LOADED__) return;
  window.__CRAFT_CHATBOT_LOADED__ = true;

  // --- Knowledge base (CRAFT-specific FAQ) ---
  const KB = [
    { q: ['discovery', 'tour', 'first time', 'try', 'test'], a: "Discovery Flight is <strong>$325</strong> · ~1h 45min: 30 min in our Redbird simulator + 1 hour flying a Diamond DA40 NG over Charleston + 15 min debrief. Min age 14. Bring as many friends as you want — 2 people total can fly. <a href='/discovery-flight'>See the page →</a>" },
    { q: ['ppl', 'private pilot', 'license', 'how long ppl', 'become a pilot'], a: "Private Pilot License at CRAFT averages ~50 flight hours over ~3 months. Range is $16K–$19K depending on hours flown. We use the DA40 NG (modern glass cockpit, Jet-A). It's Part 61 — first-time fliers learn at their own pace. <a href='/accelerated'>Pricing →</a>" },
    { q: ['ifr', 'instrument', 'instrument rating'], a: "Accelerated IFR is <strong>7 days</strong> (6 days training + 7th-day checkride): $9,800 in our DA40 NG, $5,850 BYOP. Up to 30 hrs flight + Redbird sim, dedicated CFII. <a href='/ifr'>Full IFR page →</a>" },
    { q: ['commercial', 'cpl'], a: "Accelerated Commercial is <strong>6 days</strong> at $8,600 in the DA40 NG. Need 240+ total hours to enroll. <a href='/commercial'>Full CPL page →</a>" },
    { q: ['multi', 'me', 'multi-engine'], a: "Multi-Engine Add-On is <strong>4 days</strong>, $9,000 in the DA42-VI twin turbodiesel. +DPE fee $1,500 cash. No FAA knowledge test required. <a href='/multi-engine'>Full multi page →</a>" },
    { q: ['cfi', 'instructor'], a: "CFI Initial: <strong>10–12 days</strong>, $12,000 in our DA40 NG. 18 hrs flight + 53 hrs ground + 4 sim hrs. +DPE $1,500–$1,700. Bundle with CFI-I and save. <a href='/cfi'>Full CFI page →</a>" },
    { q: ['cfii', 'cfi-i', 'instrument instructor'], a: "CFII Add-On: <strong>4 days</strong>, $5,600 in the DA40 NG, $3,200 BYOP, +DPE ~$800. Active CFI required. <a href='/cfii'>Full CFI-I page →</a>" },
    { q: ['fleet', 'aircraft', 'plane', 'tail number', 'da40', 'da42'], a: "5 × Diamond DA40 NG (single-engine, glass cockpit, Jet-A) — N650LA, N406BL, N162AT, N216DA, N970DA. 1 × Diamond DA42-VI (twin turbodiesel) — N42MV. <a href='/fleet'>See the fleet →</a>" },
    { q: ['sim', 'simulator', 'redbird', 'aatd'], a: "Two Redbird AATD simulators in-house. <strong>$70/hr</strong> with instructor included. FAA-approved for IFR training credit (50% of required time can be in the sim). <a href='/sim-membership'>Sim membership →</a>" },
    { q: ['rate', 'rental', 'wet', 'hourly', 'rent', 'aircraft rental'], a: "All hourly rates are wet (fuel + oil included): DA40 NG $255/hr · DA42-VI $600/hr · Redbird AATD $70/hr (instructor included) · CFI rate $55/hr." },
    { q: ['cost', 'price', 'pricing', 'how much'], a: "Costs vary by program. Quick reference: Discovery Flight $325 · PPL $16K–$19K · Accel. IFR $9,800 · Accel. CPL $8,600 · Multi $9,000 · CFI $12,000 · CFII $5,600. <a href='/cost-calculator'>Use the calculator →</a>" },
    { q: ['airline', 'pay', 'salary', 'how much do pilots make', 'paycheck'], a: "Year 1 regional FO ~$89K. By year 12 at a major: $300K+. Senior wide-body captain: $400K+. Senior captains can bid down to 1 trip per month and still earn the full monthly guarantee. <a href='/discovery-flight#pay'>See the pay slider →</a>" },
    { q: ['where', 'location', 'address', 'fbo', 'kchs'], a: "Charleston International Airport (KCHS). 6060 S. Aviation Ave, Suite 109, North Charleston, SC 29406. We use Signature Flight Support and Atlantic Aviation. Mon–Sat 9am–4pm." },
    { q: ['contact', 'phone', 'email', 'call'], a: "📞 <a href='tel:+18438006498'>843.800.6498</a> · ✉ <a href='mailto:craft@flycraftchs.com'>craft@flycraftchs.com</a> · Mon–Sat 9am–4pm. Or use the <a href='/contact'>contact form</a>." },
    { q: ['team', 'staff', 'instructor', 'cfi list', 'who teaches', 'barry'], a: "Director of Flight Operations: Barry Emerson (CFI/CFII/MEI, 2,000+ hrs). 4 advisors: Amber Cobb, Parker Hughes, Max Mariner, Deanna Crowder. 9 CFIs on the bench. <a href='/team'>Meet the team →</a>" },
    { q: ['job', 'career', 'hiring', 'apply', 'resume'], a: "Yes — we hire CFI / CFII / MEI / office support. <a href='/careers'>Upload your resume on the careers page →</a>" },
    { q: ['financing', 'loan', 'pay', 'payment plan'], a: "We don't do in-house financing, but Stratus and Meritize offer $0 down options up to 84 months. <a href='/financing'>Financing details →</a>" },
    { q: ['dpe', 'examiner', 'checkride', 'checkride wait'], a: "DPE means the FAA examiner who gives your final practical test. Most schools have 4–6 month waits. CRAFT's DPE pipeline runs in weeks, not months." },
    { q: ['hello', 'hi', 'hey', 'help', 'sup'], a: "Hey! I'm the CRAFT assistant. Ask me about Discovery Flights, ratings & pricing, the fleet, the sim, our team, or anything else. Or use the quick buttons below." }
  ];

  function findAnswer(text) {
    const low = (text || '').toLowerCase();
    let best = null, bestScore = 0;
    for (const item of KB) {
      let score = 0;
      for (const kw of item.q) if (low.includes(kw)) score += kw.length;
      if (score > bestScore) { bestScore = score; best = item; }
    }
    return best ? best.a : "I don't have that one yet — but you can <a href='/contact'>reach a real CFI here</a> or call <a href='tel:+18438006498'>843.800.6498</a>. Or try a different question.";
  }

  // --- Inject styles ---
  const css = `
.cb-fab { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, var(--beacon, #E63027), var(--beacon-dark, #B81E16)); border: none; cursor: pointer; box-shadow: 0 12px 32px rgba(230,48,39,0.45), 0 0 0 1px rgba(230,48,39,0.5); z-index: 9999; display: grid; place-items: center; transition: transform .25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow .25s; }
.cb-fab:hover { transform: translateY(-3px) scale(1.05); box-shadow: 0 20px 40px rgba(230,48,39,0.6), 0 0 0 1px var(--beacon, #E63027); }
.cb-fab::after { content: ""; position: absolute; inset: -4px; border-radius: 50%; border: 2px solid var(--beacon, #E63027); opacity: 0; animation: cbPulse 2.4s ease-out infinite; pointer-events: none; }
@keyframes cbPulse { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(1.5);opacity:0} }
.cb-fab svg { width: 28px; height: 28px; color: #fff; transition: transform .3s; }
.cb-fab.cb-open svg { transform: rotate(180deg); }
.cb-fab-dot { position: absolute; top: 8px; right: 10px; width: 12px; height: 12px; border-radius: 50%; background: #4ade80; border: 2px solid var(--ink, #0A0D12); box-shadow: 0 0 8px rgba(74,222,128,0.6); animation: cbDot 2s ease-in-out infinite; }
@keyframes cbDot { 0%,100%{opacity:1} 50%{opacity:0.5} }

.cb-panel { position: fixed; bottom: 96px; right: 20px; width: min(380px, calc(100vw - 40px)); height: min(560px, calc(100vh - 140px)); background: linear-gradient(180deg, #14181F 0%, #0A0D12 100%); border: 1px solid rgba(230,48,39,0.3); border-radius: 16px; box-shadow: 0 30px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(230,48,39,0.2); z-index: 9998; display: flex; flex-direction: column; overflow: hidden; opacity: 0; transform: translateY(20px) scale(0.96); pointer-events: none; transition: opacity .3s cubic-bezier(0.2, 0.8, 0.2, 1), transform .3s cubic-bezier(0.2, 0.8, 0.2, 1); font-family: 'Inter', system-ui, sans-serif; }
.cb-panel.cb-open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
.cb-panel::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--beacon, #E63027), transparent); z-index: 5; }
.cb-head { padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); background: linear-gradient(180deg, rgba(230,48,39,0.08) 0%, transparent 100%); display: flex; align-items: center; gap: 12px; }
.cb-head-avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--beacon, #E63027); border: 1.5px solid var(--beacon, #E63027); display: grid; place-items: center; flex-shrink: 0; box-shadow: 0 0 18px rgba(230,48,39,0.45); overflow: hidden; }
.cb-head-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cb-head-info { flex: 1; min-width: 0; }
.cb-head-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 16px; letter-spacing: 0.04em; text-transform: uppercase; color: #fff; line-height: 1; }
.cb-head-status { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.18em; color: #4ade80; text-transform: uppercase; margin-top: 4px; display: flex; align-items: center; gap: 6px; }
.cb-head-status::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 6px #4ade80; animation: cbDot 2s ease-in-out infinite; }
.cb-head-close { background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; padding: 6px; font-size: 22px; line-height: 1; transition: color .2s; }
.cb-head-close:hover { color: var(--beacon, #E63027); }

.cb-msgs { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; scroll-behavior: smooth; }
.cb-msg { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; animation: cbMsgIn .3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.cb-msg.bot { align-self: flex-start; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-bottom-left-radius: 4px; color: rgba(255,255,255,0.92); }
.cb-msg.user { align-self: flex-end; background: linear-gradient(135deg, var(--beacon, #E63027), var(--beacon-dark, #B81E16)); border-bottom-right-radius: 4px; color: #fff; }
.cb-msg a { color: var(--beacon, #E63027); font-weight: 600; text-decoration: underline; text-decoration-color: rgba(230,48,39,0.4); }
.cb-msg.user a { color: #fff; text-decoration-color: rgba(255,255,255,0.6); }
.cb-msg strong { color: #fff; }
.cb-msg.user strong { color: #fff; }
@keyframes cbMsgIn { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
.cb-typing { align-self: flex-start; padding: 12px 16px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; border-bottom-left-radius: 4px; display: inline-flex; gap: 4px; }
.cb-typing span { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.5); animation: cbTyping 1.4s ease-in-out infinite; }
.cb-typing span:nth-child(2) { animation-delay: 0.2s; }
.cb-typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes cbTyping { 0%,80%,100%{opacity:0.3;transform:scale(0.85)} 40%{opacity:1;transform:scale(1.1)} }

.cb-quick { padding: 10px 14px 4px; display: flex; gap: 6px; flex-wrap: wrap; border-top: 1px solid rgba(255,255,255,0.06); }
.cb-quick-btn { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; padding: 7px 11px; border-radius: 4px; background: rgba(230,48,39,0.08); border: 1px solid rgba(230,48,39,0.3); color: var(--beacon, #E63027); cursor: pointer; transition: all .15s; }
.cb-quick-btn:hover { background: rgba(230,48,39,0.15); border-color: var(--beacon, #E63027); color: #fff; }

.cb-input-row { padding: 12px 14px 16px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; gap: 8px; }
.cb-input { flex: 1; padding: 11px 14px; font-family: inherit; font-size: 14px; color: #fff; background: rgba(10,13,18,0.7); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; transition: border-color .2s, background .2s; }
.cb-input:focus { outline: none; border-color: var(--beacon, #E63027); background: rgba(10,13,18,0.95); box-shadow: 0 0 0 3px rgba(230,48,39,0.15); }
.cb-input::placeholder { color: rgba(255,255,255,0.35); }
.cb-send { padding: 0 16px; background: var(--beacon, #E63027); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; font-size: 13px; transition: background .15s, transform .15s; flex-shrink: 0; }
.cb-send:hover { background: var(--beacon-dark, #B81E16); transform: translateY(-1px); }
.cb-foot { padding: 0 16px 12px; font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 500; letter-spacing: 0.18em; color: rgba(255,255,255,0.3); text-transform: uppercase; text-align: center; }


.cb-gate { position: absolute; inset: 60px 0 0 0; z-index: 10; background: linear-gradient(180deg, #14181F 0%, #0A0D12 100%); padding: 24px 22px; display: flex; flex-direction: column; gap: 14px; transition: opacity .35s ease; }
.cb-gate.cb-gate-hidden { opacity: 0; pointer-events: none; }
.cb-gate-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.22em; color: var(--beacon, #E63027); text-transform: uppercase; }
.cb-gate-h { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 22px; line-height: 1; text-transform: uppercase; letter-spacing: 0.01em; color: #fff; margin: 0; }
.cb-gate-p { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.5; margin: -4px 0 6px; }
.cb-gate-field { display: grid; gap: 5px; }
.cb-gate-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.18em; color: rgba(255,255,255,0.55); text-transform: uppercase; }
.cb-gate-input { width: 100%; min-width: 0; box-sizing: border-box; padding: 11px 12px; font-family: inherit; font-size: 14px; color: #fff; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; transition: border-color .15s ease, background .15s ease; }
.cb-gate-input:focus { outline: none; border-color: var(--beacon, #E63027); background: rgba(255,255,255,0.06); box-shadow: 0 0 0 3px rgba(230,48,39,0.15); }
.cb-gate-input::placeholder { color: rgba(255,255,255,0.32); }
.cb-gate-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.cb-gate-row .cb-gate-field { min-width: 0; }
.cb-gate-field { min-width: 0; }
.cb-gate-btn { padding: 12px 16px; background: linear-gradient(135deg, var(--beacon, #E63027), var(--beacon-dark, #B81E16)); color: #fff; border: 1px solid var(--beacon, #E63027); border-radius: 6px; cursor: pointer; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase; transition: filter .15s, transform .15s; box-shadow: 0 6px 18px rgba(230,48,39,0.25); margin-top: 4px; }
.cb-gate-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
.cb-gate-btn:disabled { opacity: 0.6; cursor: wait; }
.cb-gate-fine { font-size: 10px; color: rgba(255,255,255,0.35); line-height: 1.5; text-align: center; margin-top: 4px; }

@media (max-width: 480px) {
  .cb-fab { bottom: 16px; right: 16px; width: 54px; height: 54px; }
  .cb-panel { bottom: 80px; right: 12px; left: 12px; width: auto; height: min(540px, calc(100vh - 100px)); }
}
`;

  const style = document.createElement('style');
  style.id = 'craft-chatbot-styles';
  style.textContent = css;
  document.head.appendChild(style);

  // --- Build DOM ---
  const fab = document.createElement('button');
  fab.className = 'cb-fab';
  fab.setAttribute('aria-label', 'Open chat');
  fab.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
    <span class="cb-fab-dot"></span>`;
  document.body.appendChild(fab);

  const panel = document.createElement('div');
  panel.className = 'cb-panel';
  panel.innerHTML = `
    <div class="cb-head">
      <div class="cb-head-avatar"><img src="/assets/favicon.svg" alt="CRAFT" onerror="this.onerror=null;this.src='/assets/favicon-32.png'" /></div>
      <div class="cb-head-info">
        <div class="cb-head-title">CRAFT Assistant</div>
        <div class="cb-head-status">Online · KCHS</div>
      </div>
      <button class="cb-head-close" aria-label="Close">×</button>
    </div>
    <div class="cb-gate" id="cb-gate">
      <div class="cb-gate-eyebrow">▸ Quick intro</div>
      <h3 class="cb-gate-h">Who am I talking to?</h3>
      <p class="cb-gate-p">Drop your contact so a CFI can follow up if you ask something the bot can't answer. We won't spam you.</p>
      <div class="cb-gate-row">
        <div class="cb-gate-field">
          <label class="cb-gate-label">First Name</label>
          <input class="cb-gate-input" type="text" id="cb-gate-fn" required autocomplete="given-name" placeholder="John" />
        </div>
        <div class="cb-gate-field">
          <label class="cb-gate-label">Last Name</label>
          <input class="cb-gate-input" type="text" id="cb-gate-ln" required autocomplete="family-name" placeholder="Doe" />
        </div>
      </div>
      <div class="cb-gate-field">
        <label class="cb-gate-label">Email</label>
        <input class="cb-gate-input" type="email" id="cb-gate-em" required autocomplete="email" placeholder="you@example.com" />
      </div>
      <div class="cb-gate-field">
        <label class="cb-gate-label">Phone</label>
        <input class="cb-gate-input" type="tel" id="cb-gate-ph" required autocomplete="tel" placeholder="+1 000 000 0000" />
      </div>
      <button class="cb-gate-btn" id="cb-gate-btn">Start Chat &nbsp;→</button>
      <div class="cb-gate-fine">No spam, no telemarketing. Mon–Sat 9am–4pm response time.</div>
    </div>
    <div class="cb-msgs" id="cb-msgs"></div>
    <div class="cb-quick" id="cb-quick">
      <button class="cb-quick-btn" data-q="Tell me about Discovery Flight">Discovery Flight</button>
      <button class="cb-quick-btn" data-q="What's the cost of PPL?">PPL Cost</button>
      <button class="cb-quick-btn" data-q="Tell me about the fleet">Fleet</button>
      <button class="cb-quick-btn" data-q="Where are you located?">Location</button>
      <button class="cb-quick-btn" data-q="Talk to a real person">Contact</button>
    </div>
    <div class="cb-input-row">
      <input class="cb-input" type="text" placeholder="Ask anything…" autocomplete="off" id="cb-input" />
      <button class="cb-send" id="cb-send">Send</button>
    </div>
    <div class="cb-foot">Auto-responder · For complex stuff <a href="/contact" style="color:var(--beacon,#E63027)">talk to a real CFI</a></div>`;
  document.body.appendChild(panel);

  const msgs = panel.querySelector('#cb-msgs');
  const input = panel.querySelector('#cb-input');
  const send  = panel.querySelector('#cb-send');
  const close = panel.querySelector('.cb-head-close');

  function addMsg(text, who) {
    const m = document.createElement('div');
    m.className = 'cb-msg ' + who;
    m.innerHTML = text;
    msgs.appendChild(m);
    msgs.scrollTop = msgs.scrollHeight;
    return m;
  }
  function showTyping() {
    const t = document.createElement('div');
    t.className = 'cb-typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(t);
    msgs.scrollTop = msgs.scrollHeight;
    return t;
  }
  function ask(question) {
    if (!question || !question.trim()) return;
    addMsg(question, 'user');
    input.value = '';
    const t = showTyping();
    setTimeout(() => {
      t.remove();
      addMsg(findAnswer(question), 'bot');
    }, 400 + Math.random() * 500);
  }

  // First-time greeting
  let greeted = false;
  function greet(force) {
    if (greeted && !force) return;
    greeted = true;
    const nm = localStorage.getItem('craft_chat_name');
    const hello = nm ? `Hey ${nm} 👋` : "Hey 👋";
    setTimeout(() => addMsg(hello + " I'm the CRAFT assistant. Ask me anything — Discovery Flight, ratings, pricing, the fleet, our team. Or tap a quick button below.", 'bot'), 250);
  }

  // --- Gate logic ---
  const gate = panel.querySelector('#cb-gate');
  const gateBtn = panel.querySelector('#cb-gate-btn');
  const gFn = panel.querySelector('#cb-gate-fn');
  const gLn = panel.querySelector('#cb-gate-ln');
  const gEm = panel.querySelector('#cb-gate-em');
  const gPh = panel.querySelector('#cb-gate-ph');
  const isUnlocked = () => localStorage.getItem('craft_chat_unlocked') === '1';
  function applyGateState() {
    if (isUnlocked()) {
      gate.classList.add('cb-gate-hidden');
      setTimeout(() => { gate.style.display = 'none'; }, 350);
    }
  }
  applyGateState();
  gateBtn.addEventListener('click', () => {
    if (!gFn.value || !gLn.value || !gEm.value || !gPh.value) {
      [gFn, gLn, gEm, gPh].forEach(i => { if (!i.value) i.style.borderColor = 'var(--beacon, #E63027)'; });
      return;
    }
    if (!gEm.checkValidity()) { gEm.reportValidity(); return; }
    gateBtn.disabled = true;
    gateBtn.textContent = 'Connecting…';
    const payload = {
      submittedAt: Date.now(),
      fields: [
        { objectTypeId: '0-1', name: 'firstname', value: gFn.value.trim() },
        { objectTypeId: '0-1', name: 'lastname',  value: gLn.value.trim() },
        { objectTypeId: '0-1', name: 'email',     value: gEm.value.trim() },
        { objectTypeId: '0-1', name: 'phone',     value: gPh.value.trim() }
      ],
      context: { pageUri: location.href, pageName: document.title }
    };
    fetch('https://api.hsforms.com/submissions/v3/integration/submit/246141088/1ec3a44f-6b63-4d94-8990-678b1d191a11', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {}).finally(() => {
      localStorage.setItem('craft_chat_unlocked', '1');
      localStorage.setItem('craft_chat_name', gFn.value.trim());
      gate.classList.add('cb-gate-hidden');
      setTimeout(() => { gate.style.display = 'none'; greet(true); input.focus(); }, 350);
    });
  });

  fab.addEventListener('click', () => {
    panel.classList.toggle('cb-open');
    fab.classList.toggle('cb-open');
    if (panel.classList.contains('cb-open')) {
      if (isUnlocked()) { greet(); setTimeout(()=>input.focus(), 350); }
    }
  });
  close.addEventListener('click', () => { panel.classList.remove('cb-open'); fab.classList.remove('cb-open'); });
  send.addEventListener('click', () => ask(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ask(input.value); } });
  panel.querySelectorAll('.cb-quick-btn').forEach(b => b.addEventListener('click', () => ask(b.dataset.q)));
})();
