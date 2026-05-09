# CRAFT Flight Training — HubSpot CRM Build Plan

> Reference architecture for the HubSpot account that powers CRAFT's lead capture, pipeline, email marketing, and AI-driven follow-up. Written to be executed programmatically via HubSpot's API/MCP.

**Stack:** HubSpot Free + Marketing Hub Starter ($20/mo when needed)
**Account email:** craft@flycraftchs.com
**Timezone:** America/New_York

---

## 1. Custom Contact Properties

These get created on the Contact object so we can segment, route, and personalize automation.

| Property name | Internal name | Type | Group | Purpose |
|---|---|---|---|---|
| Program Interest | `program_interest` | Dropdown | CRAFT Flight Training | What rating/program the lead is asking about |
| Total Flight Hours | `total_flight_hours` | Number | CRAFT Flight Training | Self-reported pilot experience |
| Current Certificates | `current_certificates` | Multi-checkbox | CRAFT Flight Training | What they already hold (PPL, IFR, CPL, etc.) |
| Target Start Window | `target_start_window` | Dropdown | CRAFT Flight Training | When they want to begin |
| Discovery Flight Booked | `discovery_flight_booked` | Date | CRAFT Flight Training | Calendly date if booked |
| Discovery Flight Completed | `discovery_flight_completed` | Date | CRAFT Flight Training | Set after the flight, drives post-flight nurture |
| Lead Source Detail | `lead_source_detail` | Single-line text | CRAFT Flight Training | Form name, page slug, referrer |
| BYOA (Bring Your Own Aircraft) | `byoa` | Boolean | CRAFT Flight Training | For IFR/Multi students with own plane |
| Financing Interest | `financing_interest` | Boolean | CRAFT Flight Training | Did they tick the "needs financing" box |
| Resume URL | `resume_url` | Single-line text | CRAFT Careers | For Careers form submissions |
| Role Applied For | `role_applied_for` | Dropdown | CRAFT Careers | CFI / CFII / MEI / Office Support / Other |

**Dropdown values for Program Interest:**
- Discovery Flight
- Private Pilot (PPL)
- Accelerated IFR
- Accelerated Commercial
- Multi-Engine (Add-On)
- Commercial Multi Initial (CMEL)
- MEI
- ATP CTP Prep
- CFI Initial
- CFI-I Add-On
- Sim Membership
- Tour the School
- Other

**Dropdown values for Target Start Window:**
- ASAP / Next 30 days
- Next 60-90 days
- Within 6 months
- Just researching

---

## 2. Lifecycle Stages (default + custom mapping)

We use HubSpot's built-in lifecycle stages, mapped to flight school context:

| HubSpot Lifecycle | CRAFT meaning |
|---|---|
| Subscriber | Newsletter sign-up only |
| Lead | Form fill, no Discovery yet |
| Marketing Qualified Lead (MQL) | Booked Discovery Flight or expressed strong intent |
| Sales Qualified Lead (SQL) | Discovery Flight completed; ready to enroll |
| Opportunity | Verbal commitment to a course; enrollment paperwork in flight |
| Customer | Currently enrolled student |
| Evangelist | Rated alumnus (writes reviews, refers) |
| Other | Vendors, partners, applicants |

---

## 3. Sales Pipeline — "Flight Training Funnel"

Single deal pipeline with 6 stages. Each stage has a probability % and ideal CTA.

| # | Stage | Probability | What this means | Default CTA |
|---|---|---|---|---|
| 1 | Inquiry Received | 10% | Form submitted, no contact made yet | Reply within 1 hour |
| 2 | Discovery Booked | 30% | Calendly appointment scheduled | Confirm + send pre-flight info |
| 3 | Discovery Completed | 50% | They flew with us | Send post-flight nurture + program quote |
| 4 | Quote Sent | 60% | Cost calculator output emailed or formal quote sent | Follow up within 48 hrs |
| 5 | Verbal Commit | 80% | Student says "yes, let's do it" | Send enrollment packet |
| 6 | Enrolled (Closed Won) | 100% | Deposit paid, scheduled in Flight Circle | Move to Customer lifecycle |

Closed Lost reasons (sub-property of Deal):
- Price / Financing
- Timing not right
- Chose another school
- Didn't qualify (medical/legal)
- Ghosted / no response after 3 attempts

---

## 4. Forms (HubSpot Forms — embedded on the static site)

| Form name | Page | Fields | Lifecycle on submit | Workflow triggered |
|---|---|---|---|---|
| Contact General | /contact | First, Last, Email, Phone, Program Interest, Message | Lead | "General Inquiry Nurture" |
| Discovery Flight Interest | /discovery-flight (above Calendly) | First, Last, Email, Phone, Target Start Window | MQL | "Discovery Booked Confirmation" |
| Careers Application | /careers | First, Last, Email, Phone, Role, Total Hours, Resume (file), Message | Other | "Careers Auto-Reply + Notify Hiring" |
| Cost Calculator Gate | /cost-calculator | First, Last, Email, Program Interest | Lead | "Cost Calc Follow-Up" |
| Newsletter Footer | (every page footer, optional) | Email | Subscriber | "Welcome Newsletter" |

---

## 5. Lists (smart, auto-updating)

| List | Criteria | Use case |
|---|---|---|
| Active Discovery Funnel | Lifecycle = MQL/SQL AND Program Interest = Discovery | Targeting for Discovery promos |
| IFR Hot Leads | Program Interest = Accelerated IFR AND Submitted < 30 days | Hot list for IFR cohort fill |
| Pre-PPL Researchers | Total Flight Hours < 5 | Long-game nurture |
| Career Pilots | Total Flight Hours > 200 | Commercial/CFI/CPL outreach |
| Newsletter Only | Lifecycle = Subscriber | Monthly content drop |
| Alumni | Lifecycle = Evangelist | Review requests, referrals |

---

## 6. Lead Source Tracking

UTM tagging convention for all marketing links:

```
?utm_source=instagram&utm_medium=social&utm_campaign=discovery_q2
?utm_source=google&utm_medium=cpc&utm_campaign=ifr_charleston
?utm_source=referral&utm_medium=alumni&utm_campaign=word_of_mouth
```

HubSpot's built-in Original Source property captures these automatically. We add `lead_source_detail` as a free-text override for things HubSpot misses (e.g., "Footer chatbot", "Blog post: How long does PPL take").

---

## 7. AI Conversation Bot (Breeze)

Trained on the Q&A pairs in `ai-bot-kb.md`. System prompt defined there.
Triggers: chat widget on every page, conversation routing on inbound messaging.
Escalation: flag to human if asked about specific pricing edge cases, medical disqualification, or financing approval.

---

## 8. Email Marketing — From Address

All transactional + marketing email sends from:
- **From name:** CRAFT Flight Training
- **From address:** craft@flycraftchs.com (verified domain)
- **Reply-to:** craft@flycraftchs.com
- **Footer:** Standard CAN-SPAM with physical address, unsubscribe link, brand mark

Domain DNS records to set up (SPF, DKIM, DMARC) once `flycraftchs.com` points to Vercel — HubSpot will provide the records.

---

## 9. Calendly ↔ HubSpot Sync

Use HubSpot's native Calendly integration:
- Booking on Calendly → contact created/updated in HubSpot
- Set `discovery_flight_booked` property automatically
- Trigger "Discovery Booked Confirmation" workflow

When ready, can replace Calendly with HubSpot Meetings (free) and consolidate.

---

## 10. Flight Circle Integration (future)

Flight Circle has no public API. Options for sync:
1. **Email parsing** — Flight Circle sends booking confirmations; HubSpot's email-to-CRM can parse them into contact records (manual setup, brittle).
2. **Zapier bridge** — If Flight Circle adds account-level webhooks for your school, Zapier listens → HubSpot contact upsert.
3. **Manual relay** — Dispatcher in Flight Circle copies relevant data to HubSpot weekly. Probably fine at low volume.

We'll revisit when Flight Circle support confirms integration options.

---

## Build Order (when MCP is back)

1. Verify domain + sender email (SPF/DKIM/DMARC)
2. Create custom contact properties (12 properties listed in §1)
3. Create Pipeline + 6 stages (§3)
4. Create 5 Forms with field mappings (§4)
5. Create 6 Smart Lists (§5)
6. Upload 6 Email Templates (in `email-templates/`)
7. Build 5 Workflows (in `workflows/`)
8. Configure AI Bot Breeze with KB + system prompt (`ai-bot-kb.md`)
9. Replace Formspree action= URLs on the site with HubSpot form embed code
10. Connect Calendly via native integration
11. End-to-end smoke test: submit each form, verify contact creation, workflow firing, email delivery

Estimated execution time once MCP is connected: **~30 minutes for a clean buildout.**
