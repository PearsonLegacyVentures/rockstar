# Rockstar Transportation and Tours

A standalone, mobile-first Nassau tourism website for cruise passengers, groups, ATV adventure enquiries and swimming-pigs excursion requests.

**Stack:** Static HTML, CSS and JavaScript, plus an optional Cloudflare Pages Function for booking emails. No React, npm install, database or paid frontend dependencies required.

## What is built

- Six experience cards with working category filters
- Mobile menu, prominent booking calls to action, accessible booking drawer
- Request form: tour, date, guests, name, email, arrival type, pickup details and notes
- Approximate starting prices: groups $50/person; individual/private $100/person
- Server-side email delivery to owner via Resend once credentials are connected
- Graceful failure with a copyable request when server-side email isn't configured
- Responsive layouts, motion-reduction accessibility, SEO metadata and structured data
- Bahamas location images sourced from Unsplash with photographer credits

**Important:** This is a booking *request* workflow. No live availability, confirmed reservations or online payment is represented. There is no verified owner phone number, WhatsApp number or email in the source information; nothing has been invented.

## Deploy on Cloudflare Pages

Connect GitHub repository \`PearsonLegacyVentures/rockstar\` to a **new** Cloudflare Pages project or consciously switch an existing project's repository (do not overwrite the old project without review).

Use:
- Framework preset: **None**
- Build command: **(leave blank)**
- Build output directory: **.** (repository root)
- Root directory: **/** (default)

This publishes the static site and the \`/api/booking\` Pages Function.

### Enable real booking emails

Create a Resend account and verify a sender domain before enabling the form. In **Cloudflare Pages → project → Settings → Variables and Secrets**, set:

| Name | Value |
| --- | --- |
| \`RESEND_API_KEY\` | Encrypted Resend API key |
| \`BOOKING_TO_EMAIL\` | Business owner's VERIFIED booking inbox |
| \`BOOKING_FROM_EMAIL\` | Verified sender address on the Resend domain, e.g. \`Rockstar <bookings@YOUR-VERIFIED-DOMAIN>\` |

Deploy again after adding variables. Add Cloudflare WAF/rate limiting and ideally Turnstile prior to public traffic. Do not store secrets in GitHub.

Until configured, the form clearly states **request not sent** and offers a copy-to-clipboard fallback.

### Before going live

1. Confirm Rockstar's **official** phone, WhatsApp, email, actual meeting point, and permission to use its real vehicles/guest photos. Never use old repo's \`+1 242 000 0000\` or \`info@rockstarconcierge.com\` placeholders.
2. Confirm six services, price floors, what ATV age/license rules apply, exact pickup policies and partner/operator for swimming pigs; price specific trips only after approval.
3. Connect email function, test one full enquiry to the inbox and the failure state.
4. Confirm domain, then add canonical URL, Open Graph URL, sitemap and submit in Google Search Console.
5. Check desktop/mobile, keyboard nav, image load, links, form, and production logs. No claimed test has been run by this README.

## Photo sources and usage

- Nassau harbour / cruise ships — Colin Lloyd, [Unsplash](https://unsplash.com/photos/aerial-photography-of-white-and-blue-cruise-ships-during-daytime-rMaWin9-9Gk) (\`photo-1548574505-5e239809ee19\`)
- Nassau boardwalk — Jared Schwitzke, [Unsplash](https://unsplash.com/photos/a-wooden-walkway-leading-to-the-beach-with-palm-trees-KDtEIYPiOr8) (\`photo-1707616824227-0f31ee435e73\`)
- Pig Beach, Exuma — Forest S, [Unsplash](https://unsplash.com/photos/brown-pig-in-body-of-water-xa-fv2RQCPY) (\`photo-1533586616444-300edc8a6b5e\`)

Images are real location/destination imagery, **not proof of Rockstar customers or its equipment**. Remote image dependencies should be locally optimized and served from an approved asset host before high-volume launch.

## Public background

Rockstar's earlier [VIP Party Bus & Tours listing](https://www.tripadvisor.com/AttractionProductReview-g147415-d28985122-Rockstar_s_VIP_Party_Bus_Tours_Nassau_Bahamas-New_Providence_Island_Bahamas.html) is an older product, not automatically proof of availability today. This site uses the newer six-service brief instead.

## File map

- \`index.html\` — metadata, sections, form, basic schema
- \`styles.css\` — brand system, responsive layouts, interactions
- \`script.js\` — filters, menu, accessible modal, form, clipboard fallback
- \`functions/api/booking.js\` — optional Cloudflare Pages email endpoint
- \`_headers\` — static response security headers
- \`robots.txt\` — crawl permissions
