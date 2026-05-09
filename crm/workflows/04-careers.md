# Workflow 04 — Careers Auto-Reply + Hiring Notify

**Trigger:** Form submission on /careers.
**Re-enrollment:** Yes (allow re-applications).
**Goal:** Acknowledge, route to hiring, never go silent on candidates.

```
START
  │
  ├─ Step 1: Set Lifecycle Stage = "Other"
  │            Set property: Role Applied For = {role_applied_for}
  │
  ├─ Step 2: Internal email to hiring@flycraftchs.com (or craft@flycraftchs.com)
  │            "Application: {firstname} {lastname} — {role_applied_for} — {total_flight_hours} hrs.
  │             Resume: {resume_url}"
  │
  ├─ Step 3: Send email "Application Received"
  │            (template: application-received.html)
  │            Confirms receipt, sets expectation: response within 5 business days
  │
  ├─ Step 4: DELAY 7 days
  │
  ├─ Step 5: BRANCH: Has internal team marked candidate "Reviewed" or moved status?
  │            ├─ YES → END
  │            └─ NO  → Internal task: "Application from {firstname} not yet reviewed.
  │                                       Reply or decline within 48 hrs."
  │
  └─ END
```

**Note:** Does NOT enroll candidate in marketing nurture (separate audience).
