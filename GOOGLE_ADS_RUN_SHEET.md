# Google Ads Run Sheet — Parker's 30-minute build

You drive the UI; I'll handle the website code in parallel. Open https://ads.google.com in another window and follow this top to bottom. Stop and ping me if anything looks different from the screenshots described.

---

## Block A — Conversion tracking (you: 5 min, me: 15 min)

### A1. Grab the Conversion ID (this unlocks the website code)

1. Top-left hamburger → **Tools** → **Setup** → **Google tag**.
2. You'll see a tag ID that looks like `AW-XXXXXXXXXX`. Copy it.
3. **Drop the ID in chat and I'll paste it into the website code immediately.**

While you're on the Google tag page, click **"Install the tag yourself"** or **"Use a website builder"** — if it says the tag is already installed somewhere, screenshot that and send it. We need to know if there's a stale tag we'll be replacing.

### A2. Triage existing conversion actions

Back to **Goals → Summary**. You'll see these groups. Do this exactly:

| Goal | Action |
|---|---|
| Phone call lead (30/30, 2 actions) | **Leave alone.** It's wired correctly. |
| Contact (0/30, 3 actions) | Click **Edit goal** → expand the 3 actions inside. We'll wire these to the new campaigns later (Block C). Confirm one of them is a **"Submit lead form"** type action. If yes, screenshot the name + open the action to copy the **Conversion Label** (looks like `abcDEFgh1234`). Send me the label. If no submit-form action exists, click **+ New conversion action** → Website → enter `https://parkerh.com` → tag manually → category: **Submit lead form** → name: `Form Submit` → value: `Use the same value for each conversion = $250 USD` → count: **One** → click-through window: **30 days** → view-through: **1 day** → attribution: **Data-driven** (or Last click if data-driven isn't offered). Save. Then copy the **Conversion Label** and send to me. |
| Get directions (0/30, 2 actions) | **Demote to Secondary.** Edit goal → switch from Primary to Secondary. (Useful signal, not a real conversion.) |
| Download (30/30, 1 action) | **Demote to Secondary.** It shouldn't be a primary conversion — it's probably the chatbot transcript or a PDF download counting as a "conversion" which is why the algorithm has bad signal. |
| Engagement (0/30, 1 action) | Leave it alone. Already not influencing anything. |
| Page view (30/30, 3 actions) | **CRITICAL — Demote to Secondary.** This is the smoking gun. Page views are not conversions. Counting them as primary tells Smart Bidding "every visit is a win" which means it has no real optimization signal. Edit goal → switch from Primary to Secondary. |

When you're done: Phone call lead = Primary, Contact = Primary (we'll add it to new campaigns in C), everything else = Secondary.

### A3. Create the "Phone Call from Website" conversion action

Still under Goals → Summary, click **+ New conversion action** → **Phone calls** → **Calls from a number on your website (using a Google forwarding number)**. Plug in:

- Name: `Phone Call from Website`
- Phone number to forward to: `843-800-6498` (your CRAFT line)
- Category: `Phone call lead`
- Value: `$250 USD, same for every conversion`
- Count: `One`
- Call length: `30 seconds`
- Window: `30 days`

After creation, you'll get a **JavaScript snippet** to add to your site. Copy that whole snippet and paste it in chat. I'll wire it into shared.css/shared.js so it shows up on every page.

---

## Block B — Pause everything (1 min)

1. Top-left → **Campaigns → Campaigns**.
2. Header checkbox to select all 31. **Edit → Pause**. (Almost all already are; this just makes sure nothing accidentally serves while we set up.)

We're not deleting them — we want the history. We'll archive the dead ones in 2 weeks once new campaigns are converting.

---

## Block C — Build Campaign #1: Accelerated IFR (10 min)

### C1. New campaign

1. Campaigns → **+ New campaign**.
2. Objective: **Leads**.
3. Conversion goals: confirm **Phone call lead** and **Contact** (Form Submit) are checked. Uncheck Page view, Download, Get directions if they sneak in.
4. Campaign type: **Search**.
5. Results you want: **Phone calls + Website form submissions** (check both).
6. Phone number for call-tracking: `843-800-6498`.
7. Website: `https://parkerh.com/ifr`.
8. Continue.

### C2. Settings

- Campaign name: `CRAFT_Accelerated_IFR_7Day`
- Networks: **Search only**. **Uncheck "Include Google search partners"** and **"Include Google Display Network"**. (Display partners is where waste goes to die for a small advertiser.)
- Locations: **United States, target by people in or regularly in this location**. **Exclude Alaska and Hawaii** (use the Exclusions section).
- Languages: English.
- Audience segments: leave blank for now.
- Budget: **$30/day**.
- Bidding: **Manual CPC** for first 14 days. (Don't let Google switch you to Maximize Conversions until we have ≥ 30 conversions in the account post-pause.) Default max CPC: **$4.50**.
- Ad schedule: 24/7, all days.
- Ad rotation: **Optimize** (preferred ads).
- Continue.

### C3. Ad group + keywords

- Ad group name: `ifr_accelerated_exact_phrase`
- Default bid: leave default.
- Paste these keywords (one per line):

```
[accelerated ifr training]
[accelerated instrument rating]
[7 day ifr training]
[accelerated instrument course]
[fast ifr rating]
[finish ifr fast]
"accelerated ifr"
"accelerated instrument"
"instrument rating in a week"
"ifr in 7 days"
"finish my instrument rating"
```

### C4. Responsive Search Ad #1 — DPE-Locked angle

Final URL: `https://parkerh.com/ifr`
Display path 1: `ifr` / Display path 2: `7-day`

**Headlines** (paste, one per line — Google requires 15):

```
Get Your IFR in 7 Days
DPE Locked Day 7
Accelerated Instrument
DA40 NG + Redbird Sim
Charleston, SC (KCHS)
96% First-Time Pass
No Checkride Wait List
Real Twin-Engine Add-On
Train Six, Test On Day 7
Brainsky Review on Site
Flat-Fee All-In Pricing
Reply for Exact Quote
Tailored to Your Plane
We Quote Your Aircraft
See the 7-Day Plan
```

**Descriptions** (4):

```
The DPE is booked the day you book your course. Your day-7 checkride is locked.
DA40 NG glass cockpit paired with Redbird AATD. Real procedure repetition.
Tell us what you fly and we quote the exact number. Flat-fee, all-in pricing.
Six days of instruction, day seven your checkride. KCHS. Reply for available dates.
```

### C5. Responsive Search Ad #2 — Speed angle

Final URL: `https://parkerh.com/ifr`

**Headlines:**

```
7 Days to IFR Rated
Skip the 6-Month Slog
Done in One Week
Instrument Rating Fast
KCHS Accelerated IFR
DPE Pre-Booked
DA40 + Sim Combo
Save Months of Training
One Week. Done.
Real Charleston Program
See Day-by-Day Plan
Built for Working Pilots
Take A Week Off, Get IFR
Tail-Number DA40 Fleet
Brainsky Student Review
```

**Descriptions:**

```
Stop dragging your IFR over six months. Seven days, DPE locked, you're done.
See the day-by-day breakdown of the 7-day plan. Brainsky student review on site.
Real DA40 NG fleet, not rental scramble. Redbird AATD time counts toward minimums.
Tell us what you fly, what avionics, target start window. We quote and lock dates.
```

### C6. Sitelinks (campaign-level)

Add these 6:

| Sitelink | Final URL |
|---|---|
| See 7-Day Plan | https://parkerh.com/ifr#timeline |
| $325 Discovery Flight | https://parkerh.com/discovery-flight |
| Student Review | https://parkerh.com/ifr#testimonial |
| Accelerated Pricing | https://parkerh.com/accelerated |
| Our DA40 Fleet | https://parkerh.com/fleet |
| Contact Us | https://parkerh.com/contact |

### C7. Callouts

Paste 8 callouts (one per line in the dialog):

```
7 Days to IFR Rated
DPE Locked Day 7
DA40 NG Glass Cockpit
Redbird AATD Time
Charleston SC (KCHS)
Flat-Fee Pricing
96% First-Time Pass
Tailored Course Quote
```

### C8. Structured snippets

Header: **Service**. Values:

```
Instrument Procedures
Holds
Approaches
Cross-Country
Partial Panel
GPS Navigation
```

### C9. Negative keywords (apply at campaign level)

Paste:

```
free
jobs
careers
hiring
salary
cfi job
instructor job
employment
job opening
license check
airman registry
faa lookup
certificate lookup
drone
rc plane
fpv
quadcopter
drone pilot
microsoft flight sim
msfs
x-plane
fs2020
dcs
sim only
home cockpit
aviation degree
embry riddle
atp flight school
purdue aviation
what is ifr
how to become a pilot wiki
cheap flight school
free flight training
cheapest
```

### C10. Save as Draft, do NOT enable yet

Save the campaign but leave it **Paused**. We'll enable all 3 together once Block A is finished and the gtag is firing real conversions.

---

## Block D — Build Campaign #2: Accelerated Multi-Engine (5 min)

Repeat Block C with these differences:

- Campaign name: `CRAFT_Accelerated_ME_4Day`
- Budget: **$25/day**
- Final URL everywhere: `https://parkerh.com/multi-engine`
- Display path: `multi-engine` / `4-day`

Keywords:

```
[accelerated multi engine]
[multi engine rating]
[me rating in 4 days]
[multi engine add on]
[me add on training]
[twin engine rating]
"multi engine rating"
"4 day multi engine"
"twin engine add on"
"me rating fast"
"diamond da42 training"
```

RSA #1 headlines:

```
ME Add-On in 4 Days
DA42-VI NG Twin Diamond
Accelerated Multi
Real Twin, Not Just Sim
KCHS Multi Course
BYOP Options Available
Flat-Fee Pricing
CFI-MEI On Staff
Done in Four Days
Multi Engine Rating Fast
Charleston, SC
DPE Locked at Booking
See 4-Day Schedule
Reply for Exact Quote
Add Multi to Your Ticket
```

RSA #1 descriptions:

```
Four days in a Diamond DA42-VI NG. Real twin time, not a glorified sim session.
Bring your own plane and we'll quote the BYOP version too. CFI-MEI on staff.
DPE booked before your course. Four-day schedule, checkride locked.
Tell us your total time and target dates. Flat-fee pricing, all-in.
```

RSA #2 headlines:

```
Multi-Engine Add-On
Twin Rating in 4 Days
Add Multi to Commercial
Add Multi to ATP
DA42 NG Glass
Charleston Multi Course
4 Days. Done.
Real Diamond Twin
BYOP Friendly
KCHS Accelerated ME
Stop Renting Twins
See Day-by-Day Plan
Quote in 24 Hours
Take 4 Days Off, Get ME
DPE Pre-Booked
```

RSA #2 descriptions:

```
Four days, Diamond DA42-VI NG, DPE pre-booked. Add multi without the wait.
Bring your own aircraft? Quote the BYOP path. Or train in our DA42.
Commercial holders adding multi: tight, focused course built around you.
See the full schedule and reply with target dates. Quotes back within a day.
```

Sitelinks:

| Sitelink | URL |
|---|---|
| See 4-Day Plan | https://parkerh.com/multi-engine#timeline |
| BYOP Options | https://parkerh.com/multi-engine |
| Our Fleet | https://parkerh.com/fleet |
| Accelerated Pricing | https://parkerh.com/accelerated |
| Discovery Flight | https://parkerh.com/discovery-flight |

Callouts:

```
4-Day Multi Course
DA42-VI NG Twin Diamond
BYOP Options
CFI-MEI On Staff
KCHS Charleston
Flat-Fee All-In Pricing
DPE Pre-Booked
Real Twin Time
```

Structured snippets (Service):

```
Multi-Engine Maneuvers
VMC Demo
Engine-Out Procedures
Twin Crosswind
```

Negatives: same master list as IFR.

Save Paused.

---

## Block E — Build Campaign #3: Discovery Flight (5 min)

- Campaign name: `CRAFT_Discovery_Flight_Local`
- Budget: **$15/day**
- Final URL: `https://parkerh.com/discovery-flight`
- Display path: `discovery-flight`
- **Locations: Charleston SC + 50 mile radius.** Use Advanced search → enter `Charleston, SC` → Radius → 50 mi.
- Bidding: **Manual CPC, $3.00 max.**

Keywords:

```
[discovery flight charleston]
[discovery flight near me]
[learn to fly charleston]
[intro flight charleston]
[flight lesson charleston sc]
[take a flying lesson]
"discovery flight"
"intro flight charleston"
"first flying lesson"
"learn to fly near me"
"flight school charleston"
```

RSA #1 headlines:

```
Discovery Flight $325
90 Minutes in a DA40
Take the Controls
Charleston Discovery Flight
No Experience Needed
Real Pilot Experience
KCHS Discovery Flight
Book Online Today
Glass Cockpit DA40
No Commitment
See If Flying Is For You
Charleston SC Flight School
Gift a Flying Lesson
1.5 Hours Flying
Reserve Online Now
```

RSA #1 descriptions:

```
$325 for 90 minutes in our Diamond DA40 NG glass cockpit. You take the controls.
Pre-flight, take off, fly Charleston coastline with a CFI, land. Book online.
No experience required. Most discovery flight pilots have never touched a yoke.
See if flying is for you before committing to any course. KCHS, online booking.
```

Sitelinks:

| Sitelink | URL |
|---|---|
| Book Online | https://parkerh.com/discovery-flight#book |
| What to Expect | https://parkerh.com/discovery-flight |
| Our DA40 Fleet | https://parkerh.com/fleet |
| Charleston Location | https://parkerh.com/contact |

Callouts:

```
$325 Discovery Flight
90 Minutes Flying
DA40 NG Glass Cockpit
Take The Controls
KCHS Charleston
Online Booking
No Experience Needed
Gift-Worthy
```

Same master negatives.

Save Paused.

---

## Block F — Flip everything ON together (1 min)

Once Block A is complete and you've sent me the snippet from A3 and the Conversion ID from A1:

1. Confirm I've deployed the website code (I'll tell you in chat — you should see a new git commit on craft-website main).
2. Submit a test form on parkerh.com/contact. Make a test phone call to the displayed number (which may be a forwarding number for you too if you're cookied as an ad clicker — just call the real `843-800-6498` from a different phone).
3. Within 60 minutes, check Goals → Summary. You should see 1 in the Contact group and 1 in the Phone call lead group.
4. If both fire: go to Campaigns, select all 3 new campaigns, **Enable**.

---

## Block G — Two-week watch (no action today)

- Day 3, 5, 7: check **Insights → Search Terms** report under each campaign. Add anything wasteful to negatives.
- Day 14: if any campaign hit 30+ conversions, switch its bidding from Manual CPC to **Maximize Conversions**. If not, keep Manual CPC and let it accumulate.
- Day 14: archive the 31 dead legacy campaigns I confirmed via screenshot.

---

## Stop-and-ask points

- **A1**: Send me the Conversion ID (`AW-XXXXXXXXXX`).
- **A2**: Send me the Conversion Label for the Form Submit action (looks like `abcDEFgh12-34`).
- **A3**: Send me the JavaScript snippet for the website-call forwarding number.
- **End of C/D/E**: Send screenshot of each campaign's Overview tab — I'll verify nothing's misconfigured before we enable.

I'll be working the website code in parallel. As soon as you send the IDs from A1-A3, I push the code to Vercel and we're 80% done.
