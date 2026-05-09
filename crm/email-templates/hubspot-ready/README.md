# HubSpot-Ready Email Templates

These are the same 6 templates from `../` but stripped of `<html>`/`<head>`/`<body>` tags and rewritten with HubSpot's HubL personalization syntax. Paste these directly into HubSpot's "Custom HTML" email module.

## How to paste into HubSpot

1. Marketing → Email → click the matching draft
2. In the email body, find/add a **Custom HTML** module (or convert any existing module to source/HTML view)
3. Click **"</> View source"** or open the HTML editor
4. Delete any default content, paste the file content
5. **Save** then **Preview**

## Mapping to email drafts

| File | HubSpot Email | ID |
|---|---|---|
| 01-discovery-confirmation.html | [CRAFT] Discovery Confirmation | 342901229254 |
| 02-quote-request-reply.html | [CRAFT] Quote Request Reply | 342901229257 |
| 03-24hr-nudge.html | [CRAFT] 24hr Nudge | 342902834895 |
| 04-welcome-aboard.html | [CRAFT] Welcome Aboard (Post-Discovery) | 342901229260 |
| 05-application-received.html | [CRAFT] Application Received | 342902834898 |
| 06-newsletter-welcome.html | [CRAFT] Newsletter Welcome | 342901229263 |

## Personalization tokens used

The templates use HubL syntax with default values so the `contact.firstname doesn't exist` errors won't trigger:

- `{{ contact.firstname|default("there") }}` — first name with fallback
- `{{ contact.craft_program_interest|default("your training") }}` — program interest dropdown
- `{{ contact.craft_discovery_booked|default("your scheduled date") }}` — discovery flight date
- `{{ contact.craft_role_applied_for|default("CFI") }}` — careers role

If you want different fallbacks, just edit the text inside `default("...")`.

## Other warnings you may see in HubSpot review

- **"flycraftchs.com/cost-calculator can't be found"** — these will resolve once the domain points to your Vercel deploy. Not a blocker, just a warning.
- **"Edit your footer address"** — HubSpot needs your physical address in the email footer for CAN-SPAM compliance. Add it via Settings → Marketing → Email → Configuration → Office locations. The address block will auto-inject in the footer area below the body content.
- **"reply-to address is also in the recipients"** — happens during test sends to yourself. Won't trigger for real sends to other people. Ignore for tests.
