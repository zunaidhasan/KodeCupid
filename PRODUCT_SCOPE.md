# KodeCupid — Product Scope (MVP prototype)

**Goal:** help verified professionals (healthcare, education, college/university, science & public health) find meaningful connections using profession, goals, lifestyle, location and — uniquely — **compatible work schedules** with **workplace-privacy** controls.

Legend: ✅ implemented in the prototype · 🧪 implemented as a mock · ⏳ deferred to production

## Roles

| Role | Prototype coverage |
| --- | --- |
| Guest | ✅ Landing, pricing, legal/CMS pages, sign-up start, account-closure form. Cannot browse profiles (redirected to sign-up). |
| Member | ✅ Onboarding, discovery, matching, chat, micro-dates, privacy, notifications, safety, billing, consult |
| Admin / Moderator | ✅ Separate `/admin` console behind a 🧪 mock login |

## Implemented MVP features

### Acquisition & onboarding
- ✅ Landing page: hero, audience, 5 benefits, pricing preview (Free / Silver $39.99 / Premium $49.99 / Daily $9.99 / Prime-time hourly $6.99 / coins & gifts), CTA, waitlist, footer links
- 🧪 Phone sign-up with 6-digit OTP (any code), ToS + Community Guidelines acceptance, explicit 18+ confirmation
- ✅ 7-step onboarding wizard with local progress saving; age auto-calculated; **under-18 blocked**; gender visibility toggle; mock location permission
- ✅ Low-friction registration: only name, age, location, gender, preference (+ profession category) are required; optional fields are labelled and nudged later via *profile strength*
- 🧪 Verification: NPI lookup (real check-digit validation) or manual credential upload; *Pending review* state; *Skip for demo* → verified

### Discovery & matching
- ✅ Swipe-style stack (drag + buttons), photo carousel, compatibility %, schedule badge, icebreaker, workplace type, goals
- ✅ Filter drawer: distance, age, profession, specialty, goal, schedule compatibility, education, lifestyle, language, verified-only (no race/ethnicity/religion filters by design)
- ✅ "It's a Match!" modal, Super Like (Premium), free-tier limits (1 match/week, no member search) with upgrade prompts
- ✅ `matchScore(a, b)` — 8 weighted, explainable factors (weights sum to 100), flagged as a *prototype estimate*
- ✅ Profile detail with privacy-respecting fields, score breakdown, locked messaging for non-matches, report/block

### Shift-aware matching (core differentiator)
- ✅ Work patterns: days, nights, swings, regular weekday, variable + typical hours + 24-hour timeline
- ✅ Compatibility rules: same pattern → great · complementary → some · conflicting → different; educators/admin on regular hours treated differently from rotating clinical shifts
- ✅ Badges: *Great schedule overlap* / *Some overlap* / *Different schedules*
- ✅ Micro-date scheduler: calendar with availability dots, shared time blocks, suggested public venues near workplaces, invitation lifecycle (Pending / Accepted / Declined / Expired)

### Privacy & safety
- ✅ Workplace privacy: enable toggle, facility selection, radius (default 1 mile), mock map, mutual hiding in discovery
- ✅ Per-field visibility toggles (age, gender, height, location, workplace, lifestyle, religion, politics, ethnicity)
- ✅ Report profile / message (7 categories) with confirmation, block / unblock, content-filter preferences, Safety Tips, Community Pledge
- ✅ Verification documents visible to moderators only

### Messaging
- ✅ Chat only after mutual match; typing indicator, read receipts, image sharing, report message, block, unmatch
- ✅ Match expiry (configurable 3–14 days) with countdown + expired state + extend with coins
- 🧪 Paid pre-match message (one, 200 chars) via mock payment; 🧪 video call screen ("coming soon") with disable setting

### Notifications
- ✅ All 7 types (match, message, like, date, verification, billing, safety); 🧪 mock push banners
- ✅ Shift-aware quiet hours (night-shift & standard presets, custom), *Notifications paused during quiet hours*, held notifications, simulated clock for demos

### Monetisation & support
- ✅ Pricing, checkout, success, failed, manage subscription, coins & gifts — 🧪 Stripe / Square / PayPal mock screens with *Prototype — no real charge*
- ✅ Entitlements: Free / Silver / Premium + day & hourly passes
- ✅ Curbside Consult ($45): question + screenshot + context → 🧪 payment → submitted (48 h SLA) → history → 🧪 simulated counselor reply; crisis-support disclaimer + emergency links

### Account closure
- ✅ Public `/account-closure` form (no login) → stored locally → visible in admin with processing / completed / notes

### Admin console
- ✅ Dashboard KPIs + activity feed · user search & management (suspend / remove / notes / verification) · verification queue with audit trail · reports queue (dismiss / warn / suspend / remove content / escalate) · deletion requests · subscriptions & payments (mock refund / cancel) · content management (placeholder legal copy)

### PWA & quality
- ✅ Manifest, maskable icons, offline-shell service worker, install prompt, safe-area support, responsive layouts (mobile bottom nav / desktop sidebar)
- ✅ Accessible forms, focus-visible styles, semantic landmarks, focus-trapped dialogs, skeleton loaders on major screens, empty states
- ✅ Tests: match scoring, schedule compatibility, quiet hours, entitlements, NPI checksum, services, UI components, and a route smoke test over every screen

## Deferred to production ⏳

| Area | Deferred item |
| --- | --- |
| Backend | Real database, auth, RLS, API, realtime, file storage, background jobs |
| Messaging | Real-time delivery, push, offline queue, E2E considerations |
| Verification | Real NPPES lookup, license-board checks, secure document storage, reviewer SLAs, re-verification |
| Payments | Real Stripe/Square/PayPal, tax, receipts, dunning, refunds, app-store billing |
| Safety | ML content moderation, image scanning, ban evasion detection, background-check partners, law-enforcement process |
| Geo | Real geolocation (opt-in), PostGIS, geofencing accuracy, spoofing protection |
| Matching | Server-side ranking, learning from feedback, fairness audits, A/B testing |
| Video | Real video calls |
| Compliance | Final legal copy, GDPR/CCPA flows, data retention, audit logs, SOC 2, accessibility audit |
| Admin | Roles & permissions, 2FA, immutable audit trail, analytics, bulk tools |
| Growth | Referrals, email/SMS campaigns, localisation, native wrappers |
