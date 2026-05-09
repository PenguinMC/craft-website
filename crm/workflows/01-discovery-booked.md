# Workflow 01 — Discovery Booked Confirmation

**Trigger:** `discovery_flight_booked` property is known (set by Calendly integration or Discovery form).
**Re-enrollment:** Allow if booking date changes.
**Goal:** Move contact to MQL, fire confirmation, ensure they show up.

## Branch flow

```
START
  │
  ├─ Step 1: Set Lifecycle Stage = "Marketing Qualified Lead"
  │
  ├─ Step 2: Move associated deal to "Discovery Booked" stage
  │            (or create deal if none exists)
  │
  ├─ Step 3: Internal SMS to staff (Twilio integration or HubSpot SMS add-on)
  │            "New discovery flight booked: {firstname} {lastname} on {discovery_flight_booked}.
  │             Phone: {phone}. Hours: {total_flight_hours}."
  │
  ├─ Step 4: Send email "Discovery Confirmed" template
  │            (template: discovery-confirmation.html)
  │
  ├─ Step 5: DELAY — until 24 hours before {discovery_flight_booked}
  │
  ├─ Step 6: Send email "Pre-Flight Reminder" 
  │            (what to bring, where to park, who to ask for at Atlantic FBO)
  │
  ├─ Step 7: DELAY — until {discovery_flight_booked} + 2 hours
  │
  ├─ Step 8: BRANCH: Was discovery_flight_completed set?
  │            ├─ YES → Enroll in Workflow 03 "Post-Discovery Nurture"
  │            └─ NO  → Internal task: "Did {firstname} fly today? Update record."
  │
  └─ END
```

**Suppression rules:**
- Don't fire if Lifecycle = Customer (already enrolled)
- Don't fire if `unsubscribed` from marketing
