# Workflow 03 — Post-Discovery Nurture

**Trigger:** `discovery_flight_completed` property is set.
**Re-enrollment:** No.
**Goal:** Convert MQL → SQL, get them into a program.

```
START
  │
  ├─ Step 1: Set Lifecycle Stage = "Sales Qualified Lead"
  │
  ├─ Step 2: Move deal to "Discovery Completed" stage
  │
  ├─ Step 3: DELAY 4 hours
  │
  ├─ Step 4: Send email "Welcome Aboard"
  │            (template: welcome-aboard.html)
  │            Recap what they flew, link to PPL/IFR/CPL programs by interest
  │
  ├─ Step 5: DELAY 3 days
  │
  ├─ Step 6: BRANCH: Did they request a quote OR fill cost calculator?
  │            ├─ YES → END (next stage handled by Workflow 04 or sales)
  │            └─ NO  → Continue
  │
  ├─ Step 7: Send email "Cost Calculator Nudge"
  │            CTA to /cost-calculator
  │
  ├─ Step 8: DELAY 7 days
  │
  ├─ Step 9: BRANCH: Engagement
  │            ├─ Engaged → Move deal to "Quote Sent" if applicable, END
  │            └─ Cold   → Internal task to CFI for personal call
  │
  └─ END
```

**Suppression rules:**
- Skip if already enrolled (Lifecycle = Customer)
