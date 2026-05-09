# CRAFT Email Paste Playbook

10 stub email drafts exist in HubSpot. Each needs the matching HTML body pasted in. ~3 min total.

## How to paste

For EACH email below:

1. HubSpot → Marketing → Email
2. Find the draft by name (filter on "[CRAFT]")
3. Click to open
4. The editor opens in the visual builder. **Click the rich-text/body area** to start editing.
5. Click the **Source** button (looks like `</>`) in the rich-text toolbar
6. Open the matching HTML file in this folder, copy the entire contents
7. Paste into the source view
8. Click out / Save
9. Top-right: **Review and publish** → **Save for automation**

## Email mapping

| Draft name in HubSpot | HTML file | HubSpot ID |
|---|---|---|
| [CRAFT] Discovery Confirmed | `01-discovery-confirm.html` | 343014893292 |
| [CRAFT] Discovery 24h Reminder | `02-discovery-reminder-24h.html` | 343014893295 |
| [CRAFT] Post-Flight Follow-up | `03-discovery-post-flight.html` | 343014893298 |
| [CRAFT] Accelerated Quote Request | `04-accelerated-quote.html` | 342996138706 |
| [CRAFT] Self-Paced Welcome | `05-self-paced-welcome.html` | 343014893301 |
| [CRAFT] Cost Calculator Follow-up | `06-cost-calc-followup.html` | 343014893304 |
| [CRAFT] Chatbot Lead Welcome | `07-chatbot-welcome.html` | 342996138709 |
| [CRAFT] General Inquiry Reply | `08-general-inquiry-reply.html` | 342996138712 |
| [CRAFT] Application Received | `09-careers-received.html` | 343014894267 |
| [CRAFT] Newsletter Welcome | `10-newsletter-welcome.html` | 342996138715 |

## After all 10 are saved-for-automation

In each workflow, add a **Send email** action pointing to its matching email:

- **01 - Discovery / Tour Lead** → Send `[CRAFT] Discovery Confirmed`
- **02 - Accelerated Lead** → Send `[CRAFT] Accelerated Quote Request`
- **03 - At Your Own Pace Lead** → Send `[CRAFT] Self-Paced Welcome`
- **04 - Careers Application** → Send `[CRAFT] Application Received`

For the cost-calc / chatbot / general / discovery-reminder / discovery-post-flight emails, you'll need to create new workflows OR add them as additional sends inside existing workflows. Easiest path: create 3 more workflows enrolled by `craft_lead_track` IS `cost_calculator` / `chatbot` / `general`.

## Style notes

Each template uses the CRAFT tactical aesthetic:
- Dark `#0A0D12` background
- `#14181F` card with beacon-red `#E63027` top accent line
- Barlow Condensed display heads, Inter body text, JetBrains Mono eyebrows
- Beacon-red CTA buttons
- Footer with contact info + unsubscribe link

`{{contact.firstname}}` is HubSpot's personalization token — it'll render as the recipient's first name on send. If first name is empty, HubSpot defaults to "there" if you set the property default.
