# HubSpot Build — Final Execution Status

> **Updated:** May 9, 2026 — Post-rebuild on Marketing Hub Pro trial

Portal: 246141088 (NA2). Trial active on Marketing Hub Pro. After trial expires, Marketing Hub Starter ($20/mo) keeps everything running.

---

## ✅ Built via API (zero clicks needed)

### 12 Custom Contact Properties

In two groups:

**CRAFT Flight Training:**
`craft_program_interest` (dropdown, 13 options) · `craft_total_flight_hours` (number) · `craft_current_certificates` (multi-checkbox, 10 options) · `craft_target_start_window` (dropdown, 4 options) · `craft_discovery_booked` (date, default "your scheduled date") · `craft_discovery_completed` (date) · `craft_lead_source_detail` (text) · `craft_byoa` (boolean) · `craft_financing_interest` (boolean)

Plus `firstname` default = "there" and `craft_program_interest` default = "your training" set.

**CRAFT Careers:**
`craft_resume_url` (text) · `craft_role_applied_for` (dropdown, 5 options, default "the role you applied for") · `craft_application_status` (dropdown, 7 options)

### Deal Pipeline — Flight Training Funnel

7 stages with proper probabilities:
1. Inquiry Received (10%)
2. Discovery Booked (30%)
3. Discovery Completed (50%)
4. Quote Sent (60%)
5. Verbal Commit (80%)
6. Enrolled (100% — closed won)
7. Closed Lost (0% — closed lost)

### 6 Smart Lists

`Active Discovery Funnel` · `IFR Hot Leads` · `Pre-PPL Researchers` · `Career Pilots 200+ hrs` · `BYOA Candidates` · `Newsletter Subscribers` (id 57, added with Pro trial)

### 5 Forms (with all field mappings)

| Form Name | ID |
|---|---|
| CRAFT - Contact General | 8ac3741a-2170-4085-b446-74f3a856d809 |
| CRAFT - Discovery Flight Interest | d9df7028-f679-4fe0-af61-a297037b864f |
| CRAFT - Careers Application | 5be0263b-23f8-4f92-bb6b-694ef5e42717 |
| CRAFT - Cost Calculator Gate | dcb6fd0f-3539-4965-96f4-f0658003f9b7 |
| CRAFT - Newsletter | f81e1e4b-92f8-4978-a740-6b74a6039e27 |

### 6 Marketing Emails — REBUILT FRESH

All have: full HTML body loaded, footer module, From "CRAFT Flight Training" / parkerhughes@flycraftchs.com, replyTo craft@flycraftchs.com, correct subject lines.

| Subject | Email Name | ID | Type |
|---|---|---|---|
| Your Discovery Flight is Confirmed - CRAFT | [CRAFT] Discovery Confirmation | **342927175359** | BATCH (needs convert) |
| Quick reply from CRAFT | [CRAFT] Quote Request Reply | **342942915313** | BATCH (needs convert) |
| Still thinking it over? | [CRAFT] 24hr Nudge | **342942915317** | BATCH (needs convert) |
| Welcome aboard - the next steps | [CRAFT] Welcome Aboard (Post-Discovery) | **342927175363** | BATCH (needs convert) |
| We received your application - CRAFT | [CRAFT] Application Received | **342927175367** | BATCH (needs convert) |
| Welcome to the CRAFT hangar | [CRAFT] Newsletter Welcome | **342942915321** | BATCH (needs convert) |

### 5 Workflows — REBUILT FRESH

All disabled by default. Trigger conditions, branch logic, action sequences, email refs all set.

| Workflow | ID | Triggers on | Email refs |
|---|---|---|---|
| 01 - Discovery Booked Confirmation | **35188118** | `craft_discovery_booked` is set | 342927175359 |
| 02 - General Inquiry Nurture | **35188119** | `craft_program_interest` is set | 342942915313, 342942915317 |
| 03 - Post-Discovery Nurture | **35188122** | `craft_discovery_completed` is set | 342927175363 |
| 04 - Careers Auto-Reply | **35188123** | `craft_role_applied_for` is set | 342927175367 |
| 05 - Newsletter Welcome | **35188124** | `lifecyclestage = subscriber` | 342942915321 |

---

## ⚠️ The ONE thing left for you (5 button clicks, 3 minutes)

HubSpot's API does not expose the BATCH_EMAIL → AUTOMATED_EMAIL conversion. We tried 7 different endpoints. The "Save for automation" UI button is the only path. Pro tier did not unlock this.

### Step-by-step:

For **each** of the 5 emails (Newsletter is auto-correct since it has the simplest workflow):

1. Marketing → Email → click into the email
2. Look in the **left icon column** for the **Settings (gear) icon**
3. In the right-side Settings panel, find **"Email type"** → change from `Regular email` to `Automated email`
4. Click Save (the email is now AUTOMATED_DRAFT, ready for workflow use)

If "Email type" isn't visible in Settings, alternative:
1. **Automation → Workflows** → open `[CRAFT] 02 - General Inquiry Nurture`
2. Click on the email step → it should prompt you to "Save email for automation" or similar
3. Click yes → email converts in place
4. Repeat for each workflow

### After conversion is done:

For each workflow:
1. Open it
2. Click the email step → confirm the email is referenced
3. Toggle workflow to **ON** (top right)
4. Submit a test through the matching form on the live site to confirm it fires

---

## What's running on what tier

| Feature | Free tier | Starter $20/mo | Pro $890/mo (trial) |
|---|---|---|---|
| Custom properties | ✅ | ✅ | ✅ |
| Pipelines | 1 | 2 | unlimited |
| Lists | 10 | unlimited | unlimited |
| Forms | ✅ basic | ✅ | ✅ branded |
| Marketing emails | limited sends | 5x contact tier | 10x contact tier |
| **Workflows** | UI only, no auto sends | ✅ full automation | ✅ + advanced branching |
| AI bot | basic | basic | Breeze AI |

**Recommendation:** after trial expires, downgrade to **Starter ($20/mo)**. Everything we built works on Starter. Don't pay for Pro unless lead volume justifies it.

---

## After domain switch

Once `flycraftchs.com` DNS points at Vercel:

1. Update form `action=` URLs across the static site (I'll do this in 30 sec when you say go)
2. Verify domain in HubSpot for sending: Settings → Marketing → Email → Sending → Domain Setup. Add SPF/DKIM/DMARC.
3. Switch From email from `parkerhughes@flycraftchs.com` to `craft@flycraftchs.com` once that's verified.

---

## Token rotation reminder

The Private App token used for this build is in chat history. Rotate it when you're done:
Settings → Integrations → Legacy Apps → CRAFT Setup → revoke + regenerate.
