/* hs-form-restyler.js
   Forces dark tactical styling onto HubSpot embedded forms by applying
   inline styles directly to elements as they're added to the DOM.
   Inline styles beat HubSpot's <style> block regardless of CSS specificity.
*/
(function () {
  var BEACON = '#E63027';
  var BEACON_DARK = '#B81E16';
  var APPROACH = '#14181F';
  var INK = '#0A0D12';

  function styleInput(el) {
    el.style.cssText = [
      'width: 100%',
      'background: ' + APPROACH,
      'border: 1px solid rgba(255,255,255,0.14)',
      'border-radius: 6px',
      'padding: 12px 14px',
      'color: #ffffff',
      'font-size: 14px',
      'font-family: Inter, system-ui, sans-serif',
      'outline: none',
      'box-shadow: none',
      '-webkit-appearance: none',
      '-moz-appearance: none',
      'appearance: none',
      'margin-bottom: 0'
    ].join(';');
    el.addEventListener('focus', function () {
      el.style.borderColor = BEACON;
      el.style.background = 'rgba(230,48,39,0.04)';
    });
    el.addEventListener('blur', function () {
      el.style.borderColor = 'rgba(255,255,255,0.14)';
      el.style.background = APPROACH;
    });
  }

  function styleLabel(el) {
    el.style.cssText = [
      'display: block',
      'font-size: 11px',
      'font-weight: 600',
      'letter-spacing: 0.16em',
      'text-transform: uppercase',
      'color: rgba(255,255,255,0.65)',
      'margin-bottom: 8px',
      'font-family: "JetBrains Mono", monospace'
    ].join(';');
  }

  function styleRequired(el) {
    el.style.color = BEACON;
    el.style.marginLeft = '4px';
  }

  function styleButton(el) {
    el.style.cssText = [
      'display: inline-block',
      'width: 100%',
      'background: ' + BEACON,
      'color: #ffffff',
      'border: none',
      'padding: 16px 24px',
      'border-radius: 6px',
      'font-size: 14px',
      'font-weight: 700',
      'text-transform: uppercase',
      'letter-spacing: 0.08em',
      'font-family: Inter, system-ui, sans-serif',
      'cursor: pointer',
      'margin-top: 12px',
      'box-shadow: 0 10px 24px rgba(230,48,39,0.35)',
      'text-shadow: none'
    ].join(';');
    el.addEventListener('mouseenter', function () { el.style.background = BEACON_DARK; });
    el.addEventListener('mouseleave', function () { el.style.background = BEACON; });
  }

  function styleSelect(sel) {
    styleInput(sel);
    sel.style.backgroundImage = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%23E63027' d='M6 8L0 0h12z'/></svg>\")";
    sel.style.backgroundRepeat = 'no-repeat';
    sel.style.backgroundPosition = 'right 14px center';
    sel.style.paddingRight = '36px';
    // Style each option for dark backgrounds (limited support but tries)
    for (var i = 0; i < sel.options.length; i++) {
      sel.options[i].style.background = APPROACH;
      sel.options[i].style.color = '#fff';
    }
  }

  function styleTextarea(t) {
    styleInput(t);
    t.style.minHeight = '110px';
    t.style.resize = 'vertical';
  }

  function styleForm(root) {
    root.style.fontFamily = 'Inter, system-ui, sans-serif';
    root.style.color = 'rgba(255,255,255,0.85)';
    // Each field wrapper
    root.querySelectorAll('.hs-form-field').forEach(function (f) {
      f.style.marginBottom = '18px';
      f.style.display = 'block';
    });
    // Labels (the field labels, not the error labels which are <label> too)
    root.querySelectorAll('.hs-form-field > label').forEach(styleLabel);
    // Required asterisks
    root.querySelectorAll('.hs-form-required').forEach(styleRequired);
    // Text-like inputs
    root.querySelectorAll('input[type=text], input[type=email], input[type=tel], input[type=number], input.hs-input').forEach(function (el) {
      if (el.tagName === 'SELECT') return;
      styleInput(el);
    });
    root.querySelectorAll('select').forEach(styleSelect);
    root.querySelectorAll('textarea').forEach(styleTextarea);
    // Submit button(s)
    root.querySelectorAll('.hs-button, input[type=submit]').forEach(styleButton);
    // Error messages
    root.querySelectorAll('.hs-error-msg, .hs-error-msgs label').forEach(function (e) {
      e.style.fontSize = '12px';
      e.style.color = BEACON;
      e.style.fontFamily = '"JetBrains Mono", monospace';
      e.style.textTransform = 'none';
    });
    // Success message
    root.querySelectorAll('.submitted-message').forEach(function (e) {
      e.style.background = 'rgba(46,204,113,0.08)';
      e.style.border = '1px solid rgba(46,204,113,0.3)';
      e.style.borderRadius = '6px';
      e.style.padding = '16px 18px';
      e.style.color = '#b8efc7';
      e.style.fontSize = '14px';
    });
  }

  function styleAllForms() {
    document.querySelectorAll('.craft-hs-form, .hbspt-form, .hs-form-private').forEach(styleForm);
  }

  // Run now (in case forms are already mounted) and on mutations
  var run = function () { setTimeout(styleAllForms, 0); };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  // Observe for new forms (HubSpot embed mounts async)
  if ('MutationObserver' in window) {
    var obs = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n.nodeType !== 1) continue;
          if (n.matches && (n.matches('.hbspt-form, .craft-hs-form, .hs-form-private, form.hs-form') ||
              n.querySelector && n.querySelector('.hs-input, .hs-button'))) {
            run();
            return;
          }
        }
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  // Re-run every 800ms for 5s as a safety belt (HubSpot sometimes restyles after mount)
  var ticks = 0;
  var safety = setInterval(function () {
    styleAllForms();
    if (++ticks >= 6) clearInterval(safety);
  }, 800);
})();
