# CRAFT Flight Training — Static Site

Vercel-deployable static HTML for CRAFT Flight Training.

## Deploy in 60 seconds

```bash
# One-time setup (only the first time):
npm install -g vercel
cd "C:\Users\parke\Documents\Claude\Projects\CRAFT Website"
vercel login

# Deploy:
vercel --prod
```

That's it. Vercel will give you a URL like `craft-flight-training.vercel.app` and a custom domain can be wired up in the Vercel dashboard (Project → Settings → Domains → add `flycraftchs.com`).

## Folder structure

```
CRAFT Website/
├── index.html              ← Homepage (this is the whole site for now)
├── public/
│   └── craft-logo.png      ← Logo (referenced by index.html)
├── programs/               ← Future detail pages go here
├── vercel.json             ← Vercel config (clean URLs, security headers)
└── README.md               ← This file
```

## Tech stack

- **Pure static HTML/CSS/JS** — no build step, no framework, no dependencies. Loads in <500ms.
- **Inline everything** — single index.html for fastest load. Refactor to components only when adding more pages.
- **Vercel hosting** — free tier, edge network, automatic HTTPS.

## What's wired up

- Hero video background (YouTube embed at top, will fall back to poster image if autoplay blocked)
- Real CRAFT pricing from your Course Cost Estimate PDF
- Interactive cost calculator (Private Pilot through Gold Pro Pilot)
- 6 programs in calculator: PPL, Acc IFR, Acc CPL, Bronze, Silver, Gold
- DPE-in-weeks differentiator section
- 95% pass rate stat
- Real address, phone, email, hours in footer
- Sticky mobile CTA

## Adding things later

### Replace YouTube background with MP4 (recommended for reliable autoplay)

1. Download the YouTube video as MP4 (use yt-dlp or savefrom.net)
2. Drop it in `public/hero.mp4`
3. In `index.html`, replace the `<iframe>` inside `.hero-video-wrap` with:

```html
<video autoplay muted loop playsinline poster="public/hero-poster.jpg">
  <source src="public/hero.mp4" type="video/mp4" />
</video>
```

Native `<video>` autoplays muted reliably in all modern browsers. YouTube iframes don't.

### Hook up forms to a CRM

The Discovery Flight CTA currently links to your Zoho booking calendar. To use a custom form that posts to a CRM:

1. Replace the `<a>` button with a `<form>` element
2. Set `<form action="https://services.leadconnectorhq.com/hooks/YOUR_GHL_WEBHOOK" method="POST">` (or whatever your CRM webhook URL is)
3. Add hidden fields with whatever you want to capture

For GoHighLevel specifically: create a webhook in GHL → copy the URL → that's your form `action`. GHL will receive the lead and trigger the SMS/email automation flow.

### Drop in an AI chatbot

Pick one and paste their script tag right before `</body>` in `index.html`:

- **Crisp** (free tier, easiest): `<script src="https://client.crisp.chat/l.js" async></script>`
- **Intercom** (paid, more capable): their install snippet
- **Custom OpenAI**: spin up a Vercel API route at `/api/chat.js` that proxies to OpenAI, build a small chat UI, embed it

The TODO comment near the bottom of `index.html` marks where to drop it.

### Add more pages

Drop new `.html` files in the root or `programs/`. Vercel serves them at the matching URL automatically. Add rewrites in `vercel.json` if you want clean URLs (e.g. `/programs/ppl` instead of `/programs/ppl.html`).

## Local preview

```bash
# In the project folder:
python3 -m http.server 8000
# or:
npx serve .
```

Then open http://localhost:8000.

## Custom domain (flycraftchs.com)

In Vercel dashboard → Project → Settings → Domains:
1. Add `flycraftchs.com` and `www.flycraftchs.com`
2. Vercel will show you DNS records to add at your registrar (Namecheap, GoDaddy, etc.)
3. Set an A record pointing to `76.76.21.21` and a CNAME for `www` pointing to `cname.vercel-dns.com`
4. SSL provisions automatically in ~60 seconds

Whatever was at the old WordPress site will need 301 redirects added to `vercel.json` so old URLs don't 404. Drop me a sitemap of the old site and I'll write them.
