/* craft-forms.js — submit handler for .craft-form elements.
   Posts to HubSpot Forms Submissions API. Inline success/error UI. */
(function () {
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  document.querySelectorAll('.craft-form').forEach(function (form) {
    if (form.dataset.bound) return;
    form.dataset.bound = '1';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var portal = form.dataset.hsPortal;
      var formId = form.dataset.hsForm;
      var successMsg = form.dataset.success || 'Got it. A CFI will reach out shortly.';
      var btn = form.querySelector('.craft-form-btn');
      var status = form.querySelector('.craft-form-status');
      var origBtnText = btn ? btn.textContent : '';
      var wrap = form.closest('.craft-form-wrap') || form.parentElement;

      function setBusy(busy) {
        if (!btn) return;
        btn.disabled = busy;
        btn.textContent = busy ? 'Sending…' : origBtnText;
      }
      function showSuccess() {
        var card = el('<div class="craft-form-success">' +
          '<div class="craft-form-success-icon">' +
            '<svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' +
          '</div>' +
          '<div class="craft-form-success-h">Message Sent</div>' +
          '<div class="craft-form-success-p">' + successMsg + '</div>' +
        '</div>');
        form.style.display = 'none';
        wrap.appendChild(card);
      }
      function showError(msg) {
        if (status) {
          status.className = 'craft-form-status err';
          status.textContent = msg || "Couldn't send — try again or email craft@flycraftchs.com";
        }
        setBusy(false);
      }

      var fd = new FormData(form);
      var fields = [];
      fd.forEach(function (v, k) {
        var val = String(v).trim();
        if (val) fields.push({ name: k, value: val });
      });

      if (status) { status.className = 'craft-form-status'; status.textContent = ''; }
      setBusy(true);

      // Safety: if fetch hangs longer than 15s, fail fast.
      var didFinish = false;
      var killer = setTimeout(function () {
        if (didFinish) return;
        didFinish = true;
        showError("Submission timed out. Please try again or call 843.800.6498.");
      }, 15000);

      fetch('https://api.hsforms.com/submissions/v3/integration/submit/' + portal + '/' + formId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: fields,
          context: { pageUri: location.href, pageName: document.title }
        })
      }).then(function (r) {
        if (didFinish) return;
        didFinish = true;
        clearTimeout(killer);
        if (r.ok) { showSuccess(); return; }
        // HubSpot returns 4xx with JSON body explaining what's wrong
        return r.json().then(function (j) {
          var msg = (j && j.message) ? j.message : "Couldn't send — please try again.";
          showError(msg);
        }).catch(function () { showError(); });
      }).catch(function () {
        if (didFinish) return;
        didFinish = true;
        clearTimeout(killer);
        showError();
      });
    });
  });
})();
