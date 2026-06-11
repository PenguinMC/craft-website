// price-sync.js — fetch /data/prices.json on page load and update any element
// with a data-price="<key>" attribute. The HTML always ships with a sensible
// fallback value so the page renders correctly even if the fetch fails.
//
// Usage in HTML:
//   <span data-price="ppl_aircraft_hourly">255</span>        -> raw integer
//   <span data-price="accel_ifr" data-fmt="comma">9,800</span> -> with commas
(function () {
  if (!('querySelectorAll' in document)) return;
  fetch('/data/prices.json?t=' + Date.now(), { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (prices) {
      if (!prices) return;
      document.querySelectorAll('[data-price]').forEach(function (el) {
        var key = el.dataset.price;
        var val = prices[key];
        if (val === undefined || val === null) return;
        var fmt = el.dataset.fmt;
        if (fmt === 'comma') {
          el.textContent = Number(val).toLocaleString();
        } else {
          el.textContent = String(val);
        }
      });
    })
    .catch(function () { /* silent */ });
})();
