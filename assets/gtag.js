/* gtag.js — Google Ads conversion tracking for CRAFT
   - Inits gtag with AW-724209907
   - Captures gclid from URL into a 90-day cookie so HubSpot/Resend land it on the contact
   - Exposes window.craftGetGclid() and window.craftFireConversion(type) for craft-forms.js

   IMPORTANT: when you create the Conversion Actions in Google Ads, copy their
   Conversion Labels into the CRAFT_GTAG_LABELS object below. Until those are
   set, conversion events are a no-op (gclid capture still works). */
(function () {
  var TAG_ID = 'AW-724209907';

  /* ---- Load googletagmanager.com asynchronously --------------------------- */
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + TAG_ID;
  (document.head || document.documentElement).appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', TAG_ID);

  /* ---- gclid capture ------------------------------------------------------ */
  try {
    var params = new URLSearchParams(location.search);
    var gclid = params.get('gclid');
    if (gclid) {
      var expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = '_gclid=' + encodeURIComponent(gclid) +
                        ';expires=' + expires +
                        ';path=/;SameSite=Lax';
    }
    // gbraid / wbraid (iOS 14+, when gclid isn't available)
    var gbraid = params.get('gbraid');
    if (gbraid) {
      document.cookie = '_gbraid=' + encodeURIComponent(gbraid) +
                        ';expires=' + expires + ';path=/;SameSite=Lax';
    }
    var wbraid = params.get('wbraid');
    if (wbraid) {
      document.cookie = '_wbraid=' + encodeURIComponent(wbraid) +
                        ';expires=' + expires + ';path=/;SameSite=Lax';
    }
  } catch (e) { /* swallow — never break the page over analytics */ }

  /* ---- Public helpers ----------------------------------------------------- */
  window.craftGetGclid = function () {
    var m = document.cookie.match(/(?:^|; )_gclid=([^;]*)/);
    return m ? decodeURIComponent(m[1]) : '';
  };
  window.craftGetClickId = function () {
    // Returns whichever of gclid/gbraid/wbraid is present (gclid wins)
    var keys = ['_gclid', '_gbraid', '_wbraid'];
    for (var i = 0; i < keys.length; i++) {
      var m = document.cookie.match(new RegExp('(?:^|; )' + keys[i] + '=([^;]*)'));
      if (m) return { type: keys[i].slice(1), value: decodeURIComponent(m[1]) };
    }
    return { type: '', value: '' };
  };

  /* ---- Conversion labels (PASTE FROM GOOGLE ADS WHEN YOU HAVE THEM) ------- */
  window.CRAFT_GTAG_LABELS = {
    /* From Block A2 in the run sheet: "Form Submit" conversion action */
    form_submit:   'PASTE_FORM_SUBMIT_LABEL_HERE',
    /* From Block A3: "Phone Call from Website" conversion action — the
       JavaScript snippet Google gives you will include a label in send_to */
    call_website:  'PASTE_CALL_WEBSITE_LABEL_HERE',
    /* Optional: if you ever add separate Cost Calc / Disco Form conversions */
    cost_calc:     '',
    disco_book:    ''
  };

  window.craftFireConversion = function (type, opts) {
    opts = opts || {};
    var label = (window.CRAFT_GTAG_LABELS || {})[type];
    if (!label || label.indexOf('PASTE_') === 0) {
      if (window.console) console.log('[gtag] no label for', type, '— skipping (paste it into gtag.js)');
      return;
    }
    try {
      gtag('event', 'conversion', {
        'send_to':       TAG_ID + '/' + label,
        'value':         opts.value || 250.0,
        'currency':      'USD',
        'transaction_id': type + '_' + Date.now()
      });
      if (window.console) console.log('[gtag] fired conversion:', type);
    } catch (e) {
      if (window.console) console.log('[gtag] fire failed:', e && e.message);
    }
  };
})();
