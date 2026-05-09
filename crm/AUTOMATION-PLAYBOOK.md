# CRAFT Automation Playbook
**Last updated:** 2026-05-09 · `lead_track` architecture

## What's wired right now

Every form on the site is connected to HubSpot. Each submission auto-tags `craft_lead_track` so the right person gets the right email/follow-up.

| Where | Form | `craft_lead_track` | Auto-Reply Email Draft |
|---|---|---|---|
| `/discovery-flight` (Calendly only — form removed per request) | n/a | n/a | n/a |
| `/accelerated` | Accelerated Programs Interest | `accelerated` | `[CRAFT] Auto-Reply: Accelerated Quote Request` |
| `/flight-school` | At Your Own Pace Interest | `self_paced` | `[CRAFT] Auto-Reply: Self-Paced Welcome` |
| `/contact` + homepage | Contact General | `general` | `[CRAFT] Auto-Reply: We Got Your Message` |
| `/cost-calculator` (gate) | → Contact General | `cost_calculator` | (uses Contact General reply) |
| Live chatbot (gate) | → Contact General | `chatbot` | (uses Contact General reply) |
| `/careers` | Careers Application | `careers` | `[CRAFT] Auto-Reply: Application Received` |

All 5 emails are **created in HubSpot as drafts** with full HTML body, From `CRAFT Flight Training <craft@flycraftchs.com>`, and themed subject lines.

Every form's `followUpId` is set to its matching email — meaning when someone submits, HubSpot is configured to auto-send that email.

---

## ⚠️ One UI step you must do (per email, ~30 seconds each)

HubSpot's API can create the email draft and link it to the form, but the **email itself must be "published" in the UI before HubSpot will actually send it**. This is a deliberate platform safeguard — they don't let API calls auto-send unreviewed emails.

For each of the 5 emails:

1. Go to **Marketing → Email** in HubSpot
2. Open the draft (e.g. `[CRAFT] Auto-Reply: Discovery Flight Booked`)
3. Click **Review and publish** (top-right)
4. Confirm From, Subject, Reply-to look right
5. Click **Save for automation** (NOT "Send now")
6. Done. The next form submission with that lead_track will trigger the email.

There's no shortcut — HubSpot blocks this via API on every tier including Pro/Enterprise.

---

## SMS automation (the next layer)

Right now **phone is captured on every form** but no SMS is sent. Grasshopper (your current phone provider) doesn't have an automation API, so we have two paths:

**Path A — Twilio + Vercel webhook** (~$15-20/mo)
- $1.15/mo for a Twilio number
- $0.0079 per SMS sent
- Build a Vercel API route at `/api/hubspot-webhook` that receives form submissions and sends an SMS via Twilio
- Total estimated cost at 100 leads/month: **~$2.20 in usage + $1.15 number = ~$3.35/mo**

**Path B — HubSpot SMS add-on**
- $50/mo add-on to Marketing Hub Pro
- Native integration with workflows (no code)
- Use the same workflows that send emails to also send SMS
- Higher cost but zero-maintenance

I'd lean toward **Path A (Twilio)** at your current scale. We can build the webhook in 30 minutes when you're ready.

---

## Test the flow yourself

1. Open a private/incognito browser tab
2. Go to https://craft-website-xi.vercel.app/contact
3. Fill in the form with your real email
4. Submit
5. Check HubSpot CRM → Contacts — you should see yourself with `craft_lead_track = general`
6. Once you've completed the "Save for automation" UI step above, you'll also receive the auto-reply email at the address you submitted

If anything doesn't work, the debug path is:
- HubSpot → Forms → click the form name → **Submissions** tab — see what came in
- Contact record → **Activity** — see if the email send was attempted

---

## Email IDs for reference

```
Discovery Flight Auto-Reply: 342937234146
Accelerated Auto-Reply:      342935740133
Self-Paced Auto-Reply:       342935740136
General Contact Auto-Reply:  342935740139
Careers Auto-Reply:          342937234149
```

## Form IDs for reference

```
Discovery:     35b9964f-0993-4008-96e2-2a843799ec0a
Accelerated:   b3cac9ae-fd0e-4fd4-80a3-edd9ce68f502
Self-Paced:    9b632cf0-2839-47e4-ad5f-8c0c28279089
Contact:       677d5614-45c0-4da0-ba39-18d7468e946b   ← also receives cost_calculator + chatbot leads
Careers:       d780334d-e76f-4d75-a640-0fc7518224a6
```
