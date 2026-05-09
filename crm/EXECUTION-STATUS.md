# HubSpot Build — Execution Status (May 9, 2026)

> Status report after running the buildout against the live HubSpot account (portal 246141088, Standard tier) using a Private App token.

---

## ✅ COMPLETED VIA API (no human action required)

### Custom Contact Properties (12 of 12)

All 12 custom fields created and live, organized into two groups in the HubSpot UI:

**CRAFT Flight Training group:**
- `craft_program_interest` — dropdown with 13 options (Discovery, PPL, IFR, Commercial, Multi, MEI, ATP, CFI, CFI-I, Sim, Tour, Other)
- `craft_total_flight_hours` — number
- `craft_current_certificates` — multi-checkbox (Student, PPL, IFR, CPL, Multi, CFI, CFII, MEI, ATP, None)
- `craft_target_start_window` — dropdown (ASAP, 60-90 days, 6 months, Researching)
- `craft_discovery_booked` — date
- `craft_discovery_completed` — date
- `craft_lead_source_detail` — text
- `craft_byoa` — boolean (Bring Your Own Aircraft)
- `craft_financing_interest` — boolean

**CRAFT Careers group:**
- `craft_resume_url` — text
- `craft_role_applied_for` — dropdown (CFI, CFII, MEI, Office, Other)
- `craft_application_status` — dropdown (New, Reviewed, Phone Screen, In-Person, Offer, Hired, Declined)

### Deal Pipeline — "Flight Training Funnel"

Default pipeline renamed and all 7 stages relabeled:

| Order | Stage | Probability | Closed |
|---|---|---|---|
| 1 | Inquiry Received | 10% | No |
| 2 | Discovery Booked | 30% | No |
| 3 | Discovery Completed | 50% | No |
| 4 | Quote Sent | 60% | No |
| 5 | Verbal Commit | 80% | No |
| 6 | Enrolled | 100% | Yes (won) |
| 7 | Closed Lost | 0% | Yes (lost) |

### Smart Lists (5 of 6)

- Active Discovery Funnel — `craft_program_interest = discovery`
- IFR Hot Leads — `craft_program_interest = ifr`
- Pre-PPL Researchers — `craft_total_flight_hours < 5`
- Career Pilots 200+ hrs — `craft_total_flight_hours > 200`
- BYOA Candidates — `craft_byoa = true`

(Newsletter Subscribers list deferred — free tier caps at 10 dynamic lists, default HubSpot lists fill the rest. Archive a default list to add this one.)

### Email Drafts (6 of 6)

All 6 emails created as drafts in HubSpot with proper:
- Subject lines
- From name: "CRAFT Flight Training"
- Reply-to: craft@flycraftchs.com
- Email IDs:
  - 342901229254 — Discovery Confirmation
  - 342901229257 — Quote Request Reply
  - 342902834895 — 24hr Nudge
  - 342901229260 — Welcome Aboard (Post-Discovery)
  - 342902834898 — Application Received
  - 342901229263 — Newsletter Welcome

**HTML content paste needed:** Each draft is a stub. Open each in HubSpot → switch to "Custom HTML" / source mode → paste the corresponding file from `crm/email-templates/`. ~3 minutes per email.

---

## ⚠️ DEFERRED TO UI (API limitations, not blockers)

### Forms (0 of 5)

**Why deferred:** HubSpot's Forms v3 API requires auto-populated `createdAt` timestamps and field-level digit constraints that rejected the create requests. Forms are easiest to build in the UI's drag-and-drop builder anyway.

**Action:** Marketing → Lead Capture → Forms → Create. Use the playbook in `crm/hubspot-build-plan.md` §4 for field lists. The 12 custom properties already exist as dropdown options. **~5 min per form, ~25 min total.**

Forms to create:
1. CRAFT — Contact General
2. CRAFT — Discovery Flight Interest
3. CRAFT — Careers Application
4. CRAFT — Cost Calculator Gate
5. CRAFT — Newsletter

### Workflows (0 of 5)

**Why deferred:** Workflow creation API requires `automation.workflows.read/write` granular sub-scopes which are paywalled behind Marketing Hub Pro ($890/mo). The parent `automation` scope on free tier is read-only.

**Two paths forward:**

**Path A — Build in UI on free tier:**
HubSpot's free tier DOES allow creating simple workflows via the UI (just not via API). Click-by-click specs in `crm/workflows/`. ~10 min per workflow, ~50 min total. Limit: 10 active workflows on free.

**Path B — Upgrade to Marketing Hub Pro later:**
Once you have lead volume justifying $800+/mo, upgrade unlocks API workflow creation + advanced sequence features.

Workflows to build:
1. Discovery Booked Confirmation (`crm/workflows/01-discovery-booked.md`)
2. General Inquiry Nurture (`crm/workflows/02-general-inquiry.md`)
3. Post-Discovery Nurture (`crm/workflows/03-post-discovery.md`)
4. Careers Auto-Reply + Hiring Notify (`crm/workflows/04-careers.md`)
5. Newsletter Welcome (`crm/workflows/05-newsletter.md`)

---

## 🔒 SECURITY ACTION

**The `pat-na2-•••••REDACTED•••••` token is now in chat history.** Rotate it after this session is done:

1. HubSpot Settings → Integrations → Legacy Apps
2. Open the CRAFT private app
3. Generate a new access token (or revoke + recreate)
4. Update wherever you've stored it locally

---

## 📋 IMMEDIATE NEXT STEPS FOR PARKER

In rough effort order (lowest to highest):

1. **Paste HTML into 6 email drafts** (15 min) — Marketing → Email → open each `[CRAFT]` draft → switch to Custom HTML → paste from `crm/email-templates/`
2. **Build 5 forms in UI** (25 min) — Marketing → Lead Capture → Forms
3. **Build 5 workflows in UI** (50 min) — Automation → Workflows → use specs in `crm/workflows/`
4. **Wire forms onto the static site** (5 min) — once forms exist, get embed codes, replace Formspree action URLs with HubSpot embed snippets. I can do this in 30 sec when form IDs are ready.
5. **Connect Calendly to HubSpot** — HubSpot's native Calendly integration in Marketplace
6. **Verify domain for sending** — Settings → Marketing → Email → Sending → Domain Setup. SPF/DKIM/DMARC records added to your DNS for `flycraftchs.com` once domain points to Vercel

---

## API LIMITS HIT (good to know)

- 1 deal pipeline max on free tier (used the default)
- 10 dynamic lists max on free tier (5 created, default HubSpot lists use rest)
- Forms v3 API is finicky — UI builder is the practical route
- Workflows API is paywalled — UI builder is free-tier path
- Custom properties: no hard limit observed (all 12 created without issue)

