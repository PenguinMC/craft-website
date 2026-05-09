/* CRAFT lead form — wires every <form data-craft-lead> to /api/lead.
   Add data-craft-lead="LEAD_TRACK" to the <form>. Inputs need name="..." matching
   the property keys in /api/lead.js (firstname, lastname, email, phone, message,
   program_interest, total_flight_hours, target_start, financing, role_applied_for,
   checkride_failures, dual_given_hours, resume_url). */
(function () {
  document.querySelectorAll('form[data-craft-lead]').forEach((form) => {
    const track = form.dataset.craftLead || 'general';
    const successMsg = form.dataset.craftSuccess || "Got it. We'll be in touch within 1 business day.";
    const submitBtn = form.querySelector('button[type=submit], input[type=submit]');
    const origLabel = submitBtn ? submitBtn.textContent : '';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      const fd = new FormData(form);
      const payload = { lead_track: track, page_uri: location.href, page_name: document.title };
      fd.forEach((v, k) => {
        // Convert checkboxes
        const el = form.querySelector(`[name="${k}"]`);
        if (el && el.type === 'checkbox') payload[k] = el.checked ? 'true' : 'false';
        else if (typeof v === 'string') payload[k] = v;
      });

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

      try {
        const r = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const ok = r.ok;
        if (ok) {
          form.innerHTML = `<div class="craft-form-success">
            <div class="craft-form-success-icon">✓</div>
            <div class="craft-form-success-msg">${successMsg}</div>
          </div>`;
        } else {
          throw new Error('bad status ' + r.status);
        }
      } catch (err) {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = origLabel; }
        const errMsg = form.querySelector('.craft-form-err') || (() => {
          const d = document.createElement('div');
          d.className = 'craft-form-err';
          form.appendChild(d);
          return d;
        })();
        errMsg.textContent = "Something went wrong. Try again or call 843.800.6498.";
        errMsg.style.cssText = "color:#ff6b5b;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:0.04em;margin-top:12px;text-align:center";
      }
    });
  });
})();
