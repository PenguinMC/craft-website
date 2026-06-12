/* craft-forms.js — bulletproof handler for .craft-form elements.
   Posts to HubSpot Forms Submissions API. 10s timeout. Click-to-retry. */
(function () {
  var ENDPOINT_BASE = 'https://api.hsforms.com/submissions/v3/integration/submit/';
  var TIMEOUT_MS = 10000;
  var DEBUG = true;
  function log(){ if(DEBUG && window.console) console.log.apply(console, ['[craft-forms]'].concat([].slice.call(arguments))); }

  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  function bindForm(form) {
    if (form.dataset.bound) return;
    form.dataset.bound = '1';
    log('binding form', form.dataset.hsForm);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitForm(form);
    });
  }

  function submitForm(form) {
    var portal = form.dataset.hsPortal;
    var formId = form.dataset.hsForm;
    var successMsg = form.dataset.success || 'Got it. A CFI will reach out shortly.';
    var btn = form.querySelector('.craft-form-btn');
    var status = form.querySelector('.craft-form-status');
    var origBtnText = btn ? (btn.dataset.origText || btn.textContent) : '';
    if (btn) btn.dataset.origText = origBtnText;
    var wrap = form.closest('.craft-form-wrap') || form.parentElement;

    function setBusy(busy) {
      if (!btn) return;
      btn.disabled = busy;
      btn.textContent = busy ? 'Sending…' : origBtnText;
    }
    function showSuccess() {
      log('success path');
      var card = el(
        '<div class="craft-form-success">' +
          '<div class="craft-form-success-icon">' +
            '<svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' +
          '</div>' +
          '<div class="craft-form-success-h">Message Sent</div>' +
          '<div class="craft-form-success-p">' + successMsg + '</div>' +
        '</div>'
      );
      form.style.display = 'none';
      wrap.appendChild(card);
    }
    function showError(msg) {
      log('error path:', msg);
      if (status) {
        status.className = 'craft-form-status err';
        status.textContent = msg || "Couldn't send — try again, or call 843.800.6498.";
      }
      setBusy(false);
    }

    // Collect fields
    var fd = new FormData(form);
    var fields = [];
    fd.forEach(function (v, k) {
      var val = String(v).trim();
      if (val) fields.push({ name: k, value: val });
    });
    log('submitting', fields.length, 'fields');

    if (status) { status.className = 'craft-form-status'; status.textContent = ''; }
    setBusy(true);

    var didFinish = false;
    var killer = setTimeout(function () {
      if (didFinish) return;
      didFinish = true;
      log('TIMEOUT after', TIMEOUT_MS, 'ms');
      showError("Network slow — please call 843.800.6498 or email craft@flycraftchs.com");
    }, TIMEOUT_MS);

    // Also fire our own lead-handler in parallel (Resend emails). Don't await
    // success — best-effort, we still treat HubSpot's response as authoritative.
    try {
      var leadPayload = { formId: formId };
      fields.forEach(function (f) { leadPayload[f.name] = f.value; });
      fetch('/api/lead-handler', {
        method: 'POST',
        mode: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadPayload)
      }).then(function (r) { log('lead-handler', r.status); })
        .catch(function (err) { log('lead-handler error', err && err.message); });
    } catch (e) { log('lead-handler kickoff threw:', e.message); }

    try {
      fetch(ENDPOINT_BASE + portal + '/' + formId, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: fields,
          context: { pageUri: location.href, pageName: document.title }
        })
      }).then(function (r) {
        if (didFinish) return;
        log('response status', r.status);
        clearTimeout(killer);
        didFinish = true;
        if (r.ok) { showSuccess(); return; }
        return r.json().then(function (j) {
          var msg = (j && j.message) ? j.message : "Couldn't send (HTTP " + r.status + "). Try again.";
          showError(msg);
        }).catch(function () { showError("HTTP " + r.status); });
      }).catch(function (err) {
        if (didFinish) return;
        log('fetch threw:', err && err.message);
        clearTimeout(killer);
        didFinish = true;
        showError("Network blocked — please call 843.800.6498 or email craft@flycraftchs.com");
      });
    } catch (e) {
      log('synchronous throw:', e.message);
      clearTimeout(killer);
      didFinish = true;
      showError("Something blocked the request. Please call 843.800.6498.");
    }
  }

  function init() {
    document.querySelectorAll('.craft-form').forEach(bindForm);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
