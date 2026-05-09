# HubSpot Build — Execution Status (May 9, 2026)

> Status report after running the full buildout against the live HubSpot account (portal 246141088, **14-day trial** of paid Hub features) using a Private App token. Trial unlocks workflow API + form API access.

---

## ✅ COMPLETED VIA API (live in HubSpot now)

### Custom Contact Properties — 12 of 12 ✓

Two property groups created:

**CRAFT Flight Training:**
- `craft_program_interest` — dropdown, 13 program options
- `craft_total_flight_hours` — number
- `craft_current_certificates` — multi-checkbox, 10 cert options
- `craft_target_start_window` — dropdown, 4 windows
- `craft_discovery_booked` — date
- `craft_discovery_completed` — date
- `craft_lead_source_detail` — text
- `craft_byoa` — boolean (Bring Your Own Aircraft)
- `craft_financing_interest` — boolean

**CRAFT Careers:**
- `craft_resume_url` — text
- `craft_role_applied_for` — dropdown (CFI / CFII / MEI / Office / Other)
- `craft_application_status` — dropdown (New → Reviewed → Phone Screen → In-Person → Offer → Hired/Declined)

### Deal Pipeline — Flight Training Funnel ✓

Default pipeline relabeled. All 7 stages renamed with proper probabilities:

| # | Stage | Prob | Closed |
|---|---|---|---|
| 1 | Inquiry Received | 10% | No |
| 2 | Discovery Booked | 30% | No |
| 3 | Discovery Completed | 50% | No |
| 4 | Quote Sent | 60% | No |
| 5 | Verbal Commit | 80% | No |
| 6 | Enrolled | 100% | Yes (won) |
| 7 | Closed Lost | 0% | Yes (lost) |

### Smart Lists — 5 of 6 ✓

- Active Discovery Funnel — `craft_program_interest = discovery`
- IFR Hot Leads — `craft_program_interest = ifr`
- Pre-PPL Researchers — `craft_total_flight_hours < 5`
- Career Pilots 200+ hrs — `craft_total_flight_hours > 200`
- BYOA Candidates — `craft_byoa = true`

(Newsletter Subscribers list deferred — 10-list cap on this tier; default HubSpot lists fill the rest.)

### Email Drafts — 6 of 6 ✓

| Subject | Email Name | ID | HTML loaded |
|---|---|---|---|
| Your Discovery Flight is Confirmed - CRAFT | [CRAFT] Discovery Confirmation | **342902835931** | ✅ |
| Quick reply from CRAFT | [CRAFT] Quote Request Reply | 342901229257 | ✅ |
| Still thinking it over? | [CRAFT] 24hr Nudge | 342902834895 | ✅ |
| Welcome aboard - the next steps | [CRAFT] Welcome Aboard (Post-Discovery) | 342901229260 | ✅ |
| We received your application - CRAFT | [CRAFT] Application Received | 342902834898 | ✅ |
| Welcome to the CRAFT hangar | [CRAFT] Newsletter Welcome | 342901229263 | ✅ |

All 6 emails fully loaded with HTML body via API (no manual paste needed). Discovery Confirmation got a new ID (342902835931) because the original was published from your test send and HubSpot locks published BATCH_EMAIL types from API edits — we deleted + recreated and updated the workflow reference.

**State:** all DRAFT. From name "CRAFT Flight Training", reply-to craft@flycraftchs.com. Subject lines set. HubL personalization tokens (`{{ contact.firstname|default(...) }}` etc.) embedded with safe defaults.

**Before sending:**
- Add physical address in HubSpot Settings → Marketing → Email → Configuration → Office locations (clears the CAN-SPAM "edit your footer address" warning)
- Verify domain for sending (Settings → Marketing → Email → Sending → Domain Setup)

### Forms — 5 of 5 ✓ (TRIAL UNLOCKED)

| Form Name | ID |
|---|---|
| CRAFT - Contact General | 8ac3741a-2170-4085-b446-74f3a856d809 |
| CRAFT - Discovery Flight Interest | d9df7028-f679-4fe0-af61-a297037b864f |
| CRAFT - Careers Application | 5be0263b-23f8-4f92-bb6b-694ef5e42717 |
| CRAFT - Cost Calculator Gate | dcb6fd0f-3539-4965-96f4-f0658003f9b7 |
| CRAFT - Newsletter | f81e1e4b-92f8-4978-a740-6b74a6039e27 |

All 5 forms are themed to default_style, recaptcha enabled where appropriate, with proper field mappings to the new custom properties.

### Workflows — 5 of 5 ✓ (TRIAL UNLOCKED)

All workflows created in **disabled** state — review and enable in the UI after pasting email HTML and any final tuning.

| Workflow | ID | Trigger | Actions |
|---|---|---|---|
| 01 - Discovery Booked Confirmation | **35185956** | `craft_discovery_booked` is set | Set lifecycle = MQL → send Discovery Confirmation (refs new email 342902835931) |
| 02 - General Inquiry Nurture | 35184308 | `craft_program_interest` is set | Send Quote Reply → 48hr delay → send 24hr Nudge |
| 03 - Post-Discovery Nurture | 35184309 | `craft_discovery_completed` is set | Set lifecycle = SQL → 4hr delay → send Welcome Aboard |
| 04 - Careers Auto-Reply | 35184305 | `craft_role_applied_for` is set | Send Application Received → 7d delay → internal task |
| 05 - Newsletter Welcome | 35184291 | `lifecyclestage = subscriber` | Send Newsletter Welcome |

These are simplified linear workflows. The detailed branching logic in the original specs (`crm/workflows/*.md`) can be added in the UI by editing each workflow.

---

## 📋 IMMEDIATE NEXT STEPS FOR PARKER

### Quick wins (15 min total)

1. **Paste HTML into 6 email drafts** (~3 min each) — Marketing → Email → open each `[CRAFT]` draft → switch to Custom HTML editor → paste from `crm/email-templates/` files.
2. **Verify domain for sending** — Settings → Marketing → Email → Sending → Domain Setup. Add SPF/DKIM/DMARC records to your `flycraftchs.com` DNS. HubSpot provides exact records.
3. **Test enabling 1 workflow end-to-end:**
   - Open `[CRAFT] 05 - Newsletter Welcome` → check trigger and action
   - Toggle to "On"
   - Submit a test through the Newsletter form
   - Confirm welcome email lands in your inbox

### Wire forms onto the static site

Each form has an HTML embed code accessible via:
HubSpot Marketing → Forms → click form → Share → Copy embed code

I can do a one-line `action=` swap across the static site once you grab the embed snippets — it's a 30-second job. Or you can just replace the form `<form>` tags with the HubSpot embed div+script.

### Trial-aware actions

You're on a **14-day trial**. The features unlocked by the trial:
- Workflow creation via API ✓ (used)
- Forms API ✓ (used)
- Multiple workflow execution

After the trial expires, **the workflows stay** but their **execution may be limited** (free tier allows simpler workflows but caps active workflows at 10 — you're using 5 so you're under the cap).

If you decide to keep the paid features after the trial:
- Marketing Hub Starter ($20/mo) — keeps workflows, email sends, basic features
- Marketing Hub Professional ($890/mo) — full automation, A/B, advanced analytics, more lists

For a flight school pre-launch, Starter is the right call. Upgrade to Pro only when you have the lead volume to justify it.

---

## 🔒 SECURITY ACTION

The Private App token is in chat history. Rotate it now:

1. HubSpot Settings → Integrations → Legacy Apps
2. Open "CRAFT Setup" → Auth → Rotate access token
3. Old token immediately invalid

---

## API limits hit (good to know)

- 1 deal pipeline max (used the default)
- 10 dynamic lists max (5 created; default HubSpot lists use rest)
- Forms v3 API requires `createdAt` at form-level + per-field digit constraints for number/phone
- Workflows v3 API uses `IS_NOT_EMPTY` not `HAS_PROPERTY` for "field is set" triggers
- Custom contact properties: no observed limit
- Email templates: no API to inject HTML body in initial create — must PATCH or use UI

