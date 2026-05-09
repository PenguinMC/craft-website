# Workflow 05 — Newsletter Welcome + Drip

**Trigger:** Newsletter form submission OR contact added to "Newsletter Only" list.
**Re-enrollment:** No.
**Goal:** Build top-of-funnel relationship with people not ready to buy.

```
START
  │
  ├─ Step 1: Set Lifecycle Stage = "Subscriber" (only if currently None)
  │
  ├─ Step 2: Send email "Welcome to the Hangar"
  │            (template: newsletter-welcome.html)
  │            CRAFT story, latest blog post, Discovery Flight soft CTA
  │
  ├─ Step 3: Add to monthly newsletter send list
  │
  ├─ Step 4: DELAY 30 days
  │
  ├─ Step 5: Send "First-flight nudge"
  │            CTA: take a Discovery Flight, $325
  │
  ├─ Step 6: BRANCH: Did they book Discovery?
  │            ├─ YES → Lifecycle promotes to MQL via Workflow 01
  │            └─ NO  → Stay in monthly drip
  │
  └─ END (continues monthly broadcast)
```

**Notes:**
- Monthly newsletter is a separate broadcast send, not part of this workflow
- Workflow only handles the welcome + first-month onboarding
