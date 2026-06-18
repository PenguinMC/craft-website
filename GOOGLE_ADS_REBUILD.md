# CRAFT Google Ads Rebuild

**Account:** 729-288-7264 CRAFT Flight Training & Simulation
**Login:** parkerhughes@flycraftchs.com
**Strategy date:** 2026-06-18
**Budget:** $2,000/mo across three campaigns
**Goal:** Restart paid lead flow with proper conversion tracking, focused on the three offerings CRAFT actually wants to sell right now.

---

## Why we're rebuilding (not rescuing)

The account has 31 paused campaigns spanning years of experiments (Discovery Flight Promo - Dec 2021, Jobs - CFI Feb 2022, craft_summerville, craft_rusty_pilot, etc.). Half of them point at offerings CRAFT doesn't push anymore. The bid strategies, negatives, and ad copy were never aligned to the current site (parkerh.com / flycraftchs.com).

Cleaner to start fresh with three tight campaigns mapped to the three pages we already polished:

- `parkerh.com/ifr` — Accelerated IFR (7-day)
- `parkerh.com/multi-engine` — Accelerated Multi-Engine (4-day)
- `parkerh.com/discovery-flight` — Discovery Flight ($325 / 90 min, KCHS-local)

Old 31 stay paused for now. After two weeks of new-campaign data, we'll archive (set to Removed) the ones we'll never restart.

---

## Step 1 — Conversion tracking (do this FIRST)

Without conversion tracking, Google's bid algorithms are guessing and we can't compute CPA. The whole rebuild depends on this.

### Three conversion actions to create

| # | Name | Category | Source | Value | Counting | Window |
|---|---|---|---|---|---|---|
| 1 | Form Submit | Submit lead form | Website | $250 | One per click | 30d click / 1d view |
| 2 | Phone Call from Ad | Phone call lead | Calls from ads | $250 | One per click | 30d click |
| 3 | Phone Call from Website | Phone call lead | Calls from website (Google forwarding number) | $250 | One per click | 30d click |

**$250 value rationale:** rough estimated *lead value*, not deal value. Form fill / qualified call → ~10–15% close rate → ~$2,500 average ticket (accel IFR is $7K-ish, discovery is $325, blended). 12% × $2,200 ≈ $250. We can refine after 60 days of real close data.

### What we'll get from Google

After creating each, Google gives us:

- A **Conversion ID** (looks like `AW-1234567890`) — same for all actions in the account
- A **Conversion Label** per action (looks like `abCdEfGhIj`)

We paste those into the site code (next step).

---

## Step 2 — Wire the tag into the site

### Add the global Google tag to every page with a form

Inside the `<head>` of `index.html`, `accelerated.html`, `ifr.html`, `multi-engine.html`, `discovery-flight.html`, `contact.html`, `cost-calculator.html`, `careers.html`:

```html
<!-- Google tag (gtag.js) — Google Ads conversion tracking -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-XXXXXXXXXX');
</script>
```

Replace `AW-XXXXXXXXXX` with the real Conversion ID from Step 1.

### Capture `gclid` from URL into a 90-day cookie

In a shared script (e.g. `assets/gclid.js` included site-wide):

```javascript
(function(){
  const params = new URLSearchParams(window.location.search);
  const gclid = params.get('gclid');
  if (gclid) {
    const expires = new Date(Date.now() + 90*24*60*60*1000).toUTCString();
    document.cookie = `_gclid=${gclid};expires=${expires};path=/;SameSite=Lax`;
  }
})();
```

### Read the gclid cookie on form submit

In every form's submit handler (homepage contact form, /api/lead client, HubSpot embeds where possible):

```javascript
function getCookie(name){
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : '';
}
const gclid = getCookie('_gclid');
// include gclid in the POST body to /api/lead
```

### Fire the conversion event after form success

In each form's success path:

```javascript
gtag('event', 'conversion', {
  'send_to': 'AW-XXXXXXXXXX/FORM_SUBMIT_LABEL',
  'value': 250.00,
  'currency': 'USD'
});
```

### /api/lead update

Pass `gclid` through to HubSpot as a custom contact property (we already have `source_detail` and similar; add `gclid` as a new property). This gives us an audit trail and the ability to do offline conversion imports later if we want to close the loop on actual sales (not just leads).

### Phone call from website

When we create the Phone Call from Website conversion action, Google issues a **forwarding number** that swaps in only for visitors who came from an ad (with gclid). Non-ad visitors still see the real number. The swap happens via a small additional snippet Google generates for us — we paste it the same way.

---

## Step 3 — Campaign builds

### Campaign #1: Accelerated IFR (7-Day)

| Setting | Value |
|---|---|
| Type | Search |
| Geo | All US (exclude AK, HI — fly-in is impractical) |
| Daily budget | $30 |
| Bid strategy | Maximize Clicks (first 14d), switch to Maximize Conversions once 30 conv accumulated |
| Ad rotation | Optimize |
| Networks | Search only — NOT Display partners |
| Landing | https://parkerh.com/ifr |
| Conversion goals | Form Submit, Phone Call from Ad, Phone Call from Website |

**Ad Group: `ifr_accelerated_exact_phrase`**

Keywords (start tight; expand only by adding from the Search Terms report):

Exact:
- `[accelerated ifr training]`
- `[accelerated instrument rating]`
- `[7 day ifr training]`
- `[accelerated instrument course]`
- `[fast ifr rating]`
- `[finish ifr fast]`

Phrase:
- `"accelerated ifr"`
- `"accelerated instrument"`
- `"instrument rating in a week"`
- `"ifr in 7 days"`
- `"finish my instrument rating"`

**Responsive Search Ad #1 — DPE-Locked angle**

Headlines (15, max 30 chars each):
- Get Your IFR in 7 Days
- DPE Locked Day 7
- Accelerated Instrument
- DA40 NG + Redbird Sim
- Charleston, SC (KCHS)
- 96% First-Time Pass
- No Checkride Wait List
- Real Twin-Engine Add-On
- Train Six, Test On Day 7
- Brainsky Review on Site
- Flat-Fee All-In Pricing
- Reply for Exact Quote
- Tailored to Your Plane
- We Quote Your Aircraft
- See the 7-Day Plan

Descriptions (4, max 90 chars each):
- The DPE is booked the day you book your course. Your day-7 checkride is locked.
- DA40 NG glass cockpit paired with Redbird AATD. Real procedure repetition.
- Tell us what you fly and we quote the exact number. Flat-fee, all-in pricing.
- Six days of instruction, day seven your checkride. KCHS. Reply for available dates.

Final URL: `https://parkerh.com/ifr`
Display URL path: `/ifr` / `7-day`

**Responsive Search Ad #2 — Speed-of-completion angle**

Headlines:
- 7 Days to IFR Rated
- Skip the 6-Month Slog
- Done in One Week
- Instrument Rating Fast
- KCHS Accelerated IFR
- DPE Pre-Booked
- DA40 + Sim Combo
- Save Months of Training
- One Week. Done.
- $24-Equivalent CPA Proof
- Real Charleston Program
- See Day-by-Day Plan
- Built for Working Pilots
- Take A Week Off, Get IFR
- Tail-Number DA40 Fleet

Descriptions:
- Stop dragging your IFR over six months. Seven days, DPE locked, you're done.
- See the day-by-day breakdown of the 7-day plan. Brainsky student review on site.
- Real DA40 NG fleet, not rental scramble. Redbird AATD time counts toward minimums.
- Tell us what you fly, what avionics, target start window. We quote and lock dates.

**Sitelinks (campaign-level):**
- "See 7-Day Plan" → /ifr#timeline
- "$325 Discovery Flight" → /discovery-flight
- "Student Review" → /ifr#testimonial (Brainsky)
- "Accelerated Pricing" → /accelerated
- "Our DA40 Fleet" → /fleet
- "Contact Us" → /contact

**Callouts:**
- 7 Days · DPE Locked Day 7 · DA40 NG · Redbird AATD · KCHS · Flat-Fee Pricing · 96% Pass Rate · Tailored Quote

**Structured snippets (Service):**
- Instrument Procedures, Holds, Approaches, Cross-Country, Partial Panel, GPS Navigation

---

### Campaign #2: Accelerated Multi-Engine (4-Day)

| Setting | Value |
|---|---|
| Type | Search |
| Geo | All US (exclude AK, HI) |
| Daily budget | $25 |
| Bid strategy | Maximize Clicks → Maximize Conversions |
| Landing | https://parkerh.com/multi-engine |

**Ad Group: `me_accelerated_exact_phrase`**

Exact:
- `[accelerated multi engine]`
- `[multi engine rating]`
- `[me rating in 4 days]`
- `[multi engine add on]`
- `[me add on training]`
- `[twin engine rating]`

Phrase:
- `"multi engine rating"`
- `"4 day multi engine"`
- `"twin engine add on"`
- `"me rating fast"`
- `"diamond da42 training"`

**RSA #1 — Speed + airframe angle**

Headlines:
- ME Add-On in 4 Days
- DA42-VI NG Twin Diamond
- Accelerated Multi
- Real Twin, Not Just Sim
- KCHS Multi Course
- BYOP Options Available
- Flat-Fee Pricing
- CFI-MEI On Staff
- Done in Four Days
- Multi Engine Rating Fast
- Charleston, SC
- DPE Locked at Booking
- See 4-Day Schedule
- Reply for Exact Quote
- Add Multi to Your Ticket

Descriptions:
- Four days in a Diamond DA42-VI NG. Real twin time, not a glorified sim session.
- Bring your own plane and we'll quote the BYOP version too. CFI-MEI on staff.
- DPE booked before your course. Four-day schedule, checkride locked.
- Tell us your total time and target dates. Flat-fee pricing, all-in.

Final URL: `https://parkerh.com/multi-engine`

**RSA #2 — Add-on framing**

Headlines:
- Multi-Engine Add-On
- Twin Rating in 4 Days
- Add Multi to Commercial
- Add Multi to ATP
- DA42 NG Glass
- Charleston Multi Course
- 4 Days. Done.
- Real Diamond Twin
- BYOP Friendly
- KCHS Accelerated ME
- Stop Renting Twins
- See Day-by-Day Plan
- Quote in 24 Hours
- Take 4 Days Off, Get ME
- DPE Pre-Booked

Descriptions:
- Four days, Diamond DA42-VI NG, DPE pre-booked. Add multi without the wait.
- Bring your own aircraft? Quote the BYOP path. Or train in our DA42.
- Commercial holders adding multi: tight, focused course built around you.
- See the full schedule and reply with target dates. Quotes back within a day.

**Sitelinks:**
- "See 4-Day Plan" → /multi-engine#timeline
- "BYOP Options" → /multi-engine
- "Our Fleet" → /fleet
- "Pricing" → /accelerated
- "Discovery Flight" → /discovery-flight

**Callouts:**
- 4 Days · DA42-VI NG · Twin Diamond · BYOP Options · CFI-MEI On Staff · KCHS · Flat-Fee Pricing

**Structured snippets (Service):**
- Multi-Engine Maneuvers, VMC Demo, Engine-Out Procedures, Twin Crosswind

---

### Campaign #3: Discovery Flight (Local)

| Setting | Value |
|---|---|
| Type | Search |
| Geo | Charleston SC + 50 mile radius (use radius targeting around KCHS lat/long) |
| Daily budget | $15 |
| Bid strategy | Maximize Conversions (this one will get clicks from local intent — heavier Calendly conversions) |
| Landing | https://parkerh.com/discovery-flight |

**Ad Group: `discovery_local_kchs`**

Exact:
- `[discovery flight charleston]`
- `[discovery flight near me]`
- `[learn to fly charleston]`
- `[intro flight charleston]`
- `[flight lesson charleston sc]`
- `[take a flying lesson]`

Phrase:
- `"discovery flight"`
- `"intro flight charleston"`
- `"first flying lesson"`
- `"learn to fly near me"`
- `"flight school charleston"`

**RSA #1 — Price-led**

Headlines:
- Discovery Flight $325
- 90 Minutes in a DA40
- Take the Controls
- Charleston Discovery Flight
- No Experience Needed
- Real Pilot Experience
- KCHS Discovery Flight
- Book Online Today
- Glass Cockpit DA40
- No Commitment
- See If Flying Is For You
- Charleston SC Flight School
- Gift a Flying Lesson
- 1.5 Hours Flying
- Reserve Online Now

Descriptions:
- $325 for 90 minutes in our Diamond DA40 NG glass cockpit. You take the controls.
- Pre-flight, take off, fly Charleston coastline with a CFI, land. Book online.
- No experience required. Most discovery flight pilots have never touched a yoke.
- See if flying is for you before committing to any course. KCHS, online booking.

Final URL: `https://parkerh.com/discovery-flight`

**Sitelinks:**
- "Book Online" → /discovery-flight#book
- "What to Expect" → /discovery-flight
- "Our DA40 Fleet" → /fleet
- "Charleston Location" → /contact

**Callouts:**
- $325 · 90 Minutes · DA40 NG · Take The Controls · KCHS · Online Booking · No Experience Needed · Gift-Worthy

---

## Master Negative Keyword List (apply to all 3 campaigns)

### Job-seeker noise
free, jobs, careers, hiring, salary, cfi job, instructor job, employment, job opening

### License lookups (people checking other pilots' licenses)
license check, airman registry, faa lookup, certificate lookup

### Drone / RC pilot
drone, rc plane, fpv, quadcopter, drone pilot

### Video game / sim-only
microsoft flight sim, msfs, x-plane, fs2020, dcs, sim only, home cockpit

### Job-adjacent / not-our-buyer
aviation degree, embry riddle, atp flight school (competitor brand), purdue aviation

### Generic info-seeker
what is a private pilot, what is ifr, how to become a pilot wiki, faa requirements

### Cheap / DIY
cheap flight school, free flight training, free private pilot, cheapest

### Geo (for IFR & Multi only — let local campaign serve those areas)
*(none for now — keep accelerated national, since people fly in)*

---

## Step 4 — Pause/archive plan for 31 existing campaigns

**Don't touch yet.** Wait 14 days. Once new 3 are converting, archive only:
- Campaigns with `paused` status AND zero spend in last 90 days AND no historical lessons we want to preserve

Keep paused (don't archive) any campaign whose ad group + keyword + ad-copy combination might teach us something later.

Status flags to look for during archival:
- `craft_summerville`, `craft_rusty_pilot`, `craft_multi_engine_courses`, `craft_main` — review individually, may overlap with new structure
- `Jobs - CFI (Feb 2022)` — likely archive, hiring is HubSpot Careers form now
- `Discovery Flight Promo - Dec 2021` — superseded by new Discovery campaign, archive

---

## Day-by-day rollout

| Day | Action |
|---|---|
| 0 (today) | Create 3 conversion actions, get IDs. Add gtag to all form pages. Push to Vercel. |
| 0 | Submit a test form. Confirm conversion shows "Recording conversions" within an hour. |
| 1 | Build 3 campaigns in Google Ads (enable IFR + ME at $30 / $25; leave Discovery as Draft to QA Calendly handoff first). |
| 2 | Enable Discovery campaign. Submit test phone call from ad → confirm call conversion fires. |
| 3-7 | Daily: check Search Terms report on IFR campaign for cheap wasted impressions, add to negatives. |
| 14 | Switch IFR + ME from Max Clicks → Max Conversions (assuming ≥30 conv each). |
| 14 | Begin archival of dead legacy campaigns. |
| 30 | First real performance review. CPA per campaign vs. $250 target value. Adjust budgets toward winners. |

---

## What I'll check before declaring this live

1. Test form submit on parkerh.com → Google Ads "All Conversions" column shows 1 within 60 min.
2. Call the displayed phone number from an ad-click session → call conversion shows.
3. Pull the Auction Insights report after 7 days to see which competitors we're showing alongside.
4. Search Terms report has < 10% wasted matches after first 14 days.
