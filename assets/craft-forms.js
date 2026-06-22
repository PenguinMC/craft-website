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
      // Fire Google Ads conversion (form submit). No-op if label not yet set
      // in /assets/gtag.js. See CRAFT_GTAG_LABELS there.
      try {
        if (typeof window.craftFireConversion === 'function') {
          window.craftFireConversion('form_submit', { value: 250.0 });
        }
      } catch (e) { log('conversion fire threw:', e && e.message); }
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

    // Collect fields. File inputs are handled separately (read as base64
    // and posted to /api/lead-handler — not to HubSpot's JSON Forms API,
    // which doesn't accept files).
    var fd = new FormData(form);
    var fields = [];
    fd.forEach(function (v, k) {
      // Skip File values — these are read via FileReader below
      if (v && typeof v === 'object' && 'name' in v && 'size' in v && 'type' in v) return;
      var val = String(v).trim();
      if (val) fields.push({ name: k, value: val });
    });

    // Append gclid (Google Ads click id) so HubSpot stores it on the contact
    // and we can run offline conversion imports later if we want sale-level
    // attribution. Captured into the _gclid cookie by /assets/gtag.js.
    try {
      var click = (typeof window.craftGetClickId === 'function')
        ? window.craftGetClickId() : { type: '', value: '' };
      if (click && click.value) {
        fields.push({ name: 'gclid', value: click.value });
        if (click.type !== 'gclid') {
          fields.push({ name: 'click_id_type', value: click.type });
        }
      }
    } catch (e) { log('gclid append threw:', e && e.message); }

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

    // Read any attached files (e.g. careers resume) into base64 so we can ship
    // them to /api/lead-handler as JSON. ~4 MB hard cap per file (after base64
    // expansion, ~5.4 MB on the wire — under Vercel's 4.5 MB default body limit
    // would be exceeded, so we keep it tight). Empty input is fine — array stays empty.
    function readFileBase64(file){
      return new Promise(function(res, rej){
        var r = new FileReader();
        r.onload = function(){ res(String(r.result || '').split(',')[1] || ''); };
        r.onerror = function(){ rej(r.error || new Error('FileReader failed')); };
        r.readAsDataURL(file);
      });
    }
    var MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB raw cap
    var fileInputs = form.querySelectorAll('input[type="file"]');
    var filePromises = [];
    var fileErrEl = form.querySelector('.cr-file-err');
    if (fileErrEl) { fileErrEl.style.display = 'none'; fileErrEl.textContent = ''; }
    for (var i = 0; i < fileInputs.length; i++) {
      var fi = fileInputs[i];
      var f = fi.files && fi.files[0];
      if (!f) continue;
      if (f.size > MAX_FILE_BYTES) {
        var msg = 'That file is ' + (f.size/1024/1024).toFixed(1) + ' MB. Max is 4 MB. Compress the PDF or email it to craft@flycraftchs.com.';
        if (fileErrEl) { fileErrEl.style.display = 'block'; fileErrEl.textContent = msg; }
        showError(msg);
        return;
      }
      filePromises.push(readFileBase64(f).then((function(input, file){
        return function(b64){
          return { name: input.name || 'file', filename: file.name, mimeType: file.type || 'application/octet-stream', base64: b64 };
        };
      })(fi, f)));
    }

    // Also fire our own lead-handler in parallel (Resend emails). Don't await
    // success — best-effort, we still treat HubSpot's response as authoritative.
    try {
      Promise.all(filePromises).then(function (uploadedFiles) {
        var leadPayload = { formId: formId };
        fields.forEach(function (f) { leadPayload[f.name] = f.value; });
        if (uploadedFiles && uploadedFiles.length) {
          leadPayload.files = uploadedFiles;
        }
        fetch('/api/lead-handler', {
          method: 'POST',
          mode: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadPayload)
        }).then(function (r) { log('lead-handler', r.status); })
          .catch(function (err) { log('lead-handler error', err && err.message); });
      }).catch(function (err) { log('file read failed:', err && err.message); });
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
