/* craft-forms.js — handles submission of .craft-form elements,
   posting to HubSpot Forms Submissions API. Inline-styled so we don't
   need to fight HubSpot's embed CSS. */
(function () {
  function setStatus(el, kind, msg) {
    el.className = 'craft-form-status ' + kind;
    el.textContent = msg;
  }
  document.querySelectorAll('.craft-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var portal = form.dataset.hsPortal;
      var formId = form.dataset.hsForm;
      var success = form.dataset.success || 'Got it.';
      var btn = form.querySelector('.craft-form-btn');
      var status = form.querySelector('.craft-form-status');
      var origBtnText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending…';
      setStatus(status, '', '');
      var fd = new FormData(form);
      var fields = [];
      fd.forEach(function (v, k) { if (String(v).trim()) fields.push({ name: k, value: String(v) }); });
      fetch('https://api.hsforms.com/submissions/v3/integration/submit/' + portal + '/' + formId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: fields,
          context: { pageUri: location.href, pageName: document.title }
        })
      })
      .then(function (r) { if (!r.ok) throw new Error('Submit failed'); return r; })
      .then(function () {
        var wrap = form.closest('.craft-form-wrap');
        if (wrap) {
          wrap.setAttribute('data-success', success);
          wrap.classList.add('craft-form-done');
        } else {
          setStatus(status, 'ok', success);
          form.reset();
        }
      })
      .catch(function () {
        setStatus(status, 'err', "Couldn't send — try again or email craft@flycraftchs.com");
        btn.disabled = false;
        btn.textContent = origBtnText;
      });
    });
  });
})();
