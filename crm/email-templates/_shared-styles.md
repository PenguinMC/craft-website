# Shared Email Style Notes

All CRAFT emails use:
- Single-column 600px max width (industry standard for inbox readability)
- Inline styles only (no `<link>` to CSS — Outlook strips it)
- Web-safe fonts with Barlow Condensed fallback to Arial Black; Inter falls back to Helvetica/Arial
- Beacon red `#E63027` for accents; dark approach `#14181F` for backgrounds; white `#FFFFFF` for body
- HubSpot personalization tokens: `{{contact.firstname}}`, `{{contact.program_interest}}`, etc.
- Fully responsive via media queries fallbacks (Outlook ignores them, falls to desktop layout)
- CAN-SPAM compliant footer with physical address + unsubscribe link (HubSpot auto-injects in marketing emails)

Paste each template directly into HubSpot's "Custom HTML" email designer mode.
