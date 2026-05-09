# Workflow 02 — General Inquiry Nurture

**Trigger:** Form submission on /contact OR /flight-school OR any non-Discovery form.
**Re-enrollment:** No.
**Goal:** Acknowledge fast, route to right CFI for follow-up, light nurture.

```
START
  │
  ├─ Step 1: Set Lifecycle Stage = "Lead" (if currently Subscriber/None)
  │
  ├─ Step 2: Internal email to craft@flycraftchs.com
  │            "New inquiry from {firstname} — Program: {program_interest}.
  │             Reply within 1 hr to maintain SLA."
  │
  ├─ Step 3: DELAY 5 minutes
  │
  ├─ Step 4: Send email "Quote Request Reply" 
  │            (template: quote-request-reply.html)
  │            Body adapts to {program_interest} via personalization tokens
  │
  ├─ Step 5: DELAY 48 hours
  │
  ├─ Step 6: BRANCH: Has contact replied OR booked Calendly?
  │            ├─ YES → END (workflow done, lead is engaged)
  │            └─ NO  → Continue
  │
  ├─ Step 7: Send email "24hr Nudge"
  │            (template: 24hr-nudge.html)
  │            Soft re-ask with Discovery Flight CTA
  │
  ├─ Step 8: DELAY 5 days
  │
  ├─ Step 9: BRANCH: Engagement check
  │            ├─ Engaged → END
  │            └─ Not engaged → Internal task to staff: "Final manual touch on {firstname}"
  │
  └─ END
```

**Suppression rules:**
- Don't fire on Careers form submissions (those go to Workflow 04)
- Skip if Lifecycle ≥ Opportunity
