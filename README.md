# KodeCupid — verified-community dating PWA (prototype)

KodeCupid is a mobile-first Progressive Web App prototype for **verified healthcare, education, university and science professionals**. Its differentiators are **shift-aware matching** and **workplace-privacy controls**.

> ⚠️ **This is an MVP / stakeholder prototype.** All members, photos, employers and contact details are fictional. SMS, payments, NPI lookups, video, push notifications and geolocation are **mocked**. No real PII is stored and no real charges are made.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/ (a single inlined index.html + PWA assets)
npm run preview    # serve the production build
npx vitest run     # unit, component, service and route-smoke tests
```

**Demo shortcuts**

| What | How |
| --- | --- |
| Try the app instantly | Landing page → *Try the demo member* (Taylor, ICU night-shift nurse, Silver plan) |
| New sign-up flow | *Create your profile* → any phone → **any 6-digit code** (mock code `123456`) |
| Admin console | `/#/admin` → `admin@kodecupid.test` / `admin123` (credentials shown on the login screen) |
| Compare plan tiers | Me → Subscription → *Prototype · compare tiers instantly* |
| Quiet hours demo | Alerts → settings → *simulate the clock* → Jump into quiet hours |
| Fresh start | Me → *Reset prototype data* |

> The app uses a **HashRouter** (`/#/app`, `/#/admin`, `/#/account-closure`) so it also works when served as one static HTML file. Switch to `BrowserRouter` + SPA rewrites in production.

---

## What's inside

Guest · Member · Admin flows are all implemented against a local mock backend:

- **Landing page**, pricing preview, footer legal links, waitlist modal
- **Auth**: phone → mock OTP, ToS/Community Guidelines + explicit 18+ confirmation
- **Onboarding wizard** (7 steps, progress saved locally): identity (auto-age, <18 blocked), profession + shift schedule, **NPI mock / manual credential verification** (+ *Skip for demo*), profile details + icebreakers, relationship preferences, privacy + notification preferences, preview. Only name, age, location, gender and preference are required; everything else is optional and nudged later via profile-strength prompts.
- **Discovery**: swipe card stack (drag or buttons), photo carousel, compatibility %, schedule badge, icebreaker, filter drawer, "It's a Match!" modal, **free-tier limits + upgrade prompts**
- **Profile detail**: gallery, privacy-respecting fields, score breakdown ("Why?"), shift timeline comparison, report/block, locked messaging state with a **paid pre-match message** (mock payment)
- **Matching engine mock**: `matchScore(a, b)` — weighted, explainable (`src/lib/matchScore.ts`)
- **Shift-aware matching**: pattern rules + free-hour overlap (`src/lib/schedule.ts`), Schedule page with compatibility chart, **micro-date scheduler** (calendar → shared free blocks → public venue near work → invitation with Pending/Accepted/Declined/Expired)
- **Workplace privacy / mock geofence**: pick facilities + radius (default 1 mile) on a mock SVG map; Discovery hides profiles inside the radius (mutual)
- **Messaging**: matches list, chat thread, typing indicator, read receipts, image sharing, report message, block, **match-expiry countdown** (configurable), extend-with-coins, mock video call screen (+ disable setting)
- **Notifications** for all 7 event types, mock push banners, **shift-aware quiet hours** (held notifications)
- **Curbside Consult** ($45): form → mock payment → history → simulated counselor reply, with a crisis-support disclaimer and emergency links
- **Safety**: report profile/message (7 categories + confirmation), block/unblock, content-filter preferences, Safety Tips + Community Pledge
- **Account closure / data deletion** public form → appears in the admin console
- **Billing**: pricing, checkout (mock Stripe/Square/PayPal), success, failure, manage subscription, coins & gifts
- **Admin console** (`/admin`): dashboard, user management, verification queue with audit trail, reports & moderation, deletion requests, subscriptions & payments (mock refunds/cancels), content management (placeholder legal copy)
- **PWA**: manifest, maskable icons, service worker (offline shell), install prompt hook, safe-area insets, `viewport-fit=cover`

---

## Project structure

```
src/
├── app/                 Layouts (Public, Member, Admin) + route-level smoke test
├── components/          Reusable UI + shared widgets
│   └── ui/              Button, Input, Select, DatePicker, Toggle, Card, Avatar, Badge, Modal,
│                        BottomSheet, TabBar, EmptyState, Toast, SkeletonLoader, Choice (chips), Slider, Tabs
├── context/             AppContext (session + derived entitlements), ToastContext (+ mock push banners)
├── data/                Seed data: 26 profiles, facilities, venues, icebreakers, catalog, CMS content, seed DB
├── features/            Screens grouped by domain
│   ├── landing · auth · onboarding · discovery · profile · messaging
│   ├── schedule · privacy · notifications · consult · safety · billing · account · content · admin
├── hooks/               useDb, useLocalStorage, useNow, useSimulatedLoading, useInstallPrompt, useDialog
├── lib/                 Pure, tested logic: matchScore, schedule, entitlements, quietHours, geo, format, draft, placeholderArt
├── services/            "Backend" layer — the ONLY code that writes data
│   ├── db.ts            localStorage-backed store (swap for Supabase / Firebase / Postgres)
│   ├── providers.ts     Mock SMS, payments (Stripe/Square/PayPal), NPI, video, push, geo — behind interfaces
│   └── *Service.ts      auth, member, match, chat, date, notification, payment, consult, safety, account, admin
└── types/               Full data model (User, Profile, ProfessionalProfile, VerificationRecord, …)
public/                  manifest.webmanifest, sw.js, icons
```

**Layering rule:** components → hooks/context → services → `db` (mock). Components never touch storage directly, so replacing `services/*` with real API calls doesn't require UI changes.

---

## Mock data

`src/data/profiles.ts` builds **26 fictional members** from a compact table: physicians, nurses, a PA, pharmacist, psychologist, paramedic/EMT, veterinarian, healthcare administrator, teachers, principal, superintendent, professors, deans, registrar, researchers, an epidemiologist and an atmospheric scientist. They span days / nights / swings / weekday / variable schedules, ages 26–52, several locations in a mock Front Range metro, and every verification state (verified, pending, needs-info, unverified). Several have workplace privacy on. Photos are procedurally generated SVG placeholders (no real people, works offline).

`src/data/seedDb.ts` adds the demo member's matches, conversations, micro-dates in every status, notifications of every type, reports, deletion requests, subscriptions and payments so every screen has content on first load.

State persists in `localStorage` under `kodecupid.db`; *Reset prototype data* reseeds it.

---

## Mocked integrations

| Integration | Mock | Real replacement |
| --- | --- | --- |
| SMS OTP | `smsProvider` — any 6-digit code (mock `123456`) | Twilio Verify / Supabase Auth / Firebase Phone Auth |
| Payments | `paymentGateways` (Stripe/Square/PayPal) — card `…4242` ok, `…0002` declined, `…9995` insufficient funds | Stripe Checkout / Square Web Payments / PayPal Buttons + webhooks |
| NPI verification | `npiRegistry` — real NPI check-digit validation; `1234567893` matches | NPPES NPI Registry API |
| Video chat | `videoProvider` → "coming soon" screen | Daily / Twilio Video / LiveKit |
| Push notifications | `pushProvider` → in-app banners; quiet-hour holding | Web Push (VAPID) via the service worker / FCM |
| Geolocation / geofence | Fixed mock coordinates + Haversine | Browser geolocation + PostGIS `ST_DWithin` |
| Real-time chat | Timers simulate read receipts, typing and replies | Supabase Realtime / WebSockets |
| Counselor responses | Canned reply after ~20 s | Human workflow + ticketing |
| Image storage | Resized data URIs | Object storage + moderation scan |

---

## Future production-integration notes

1. **Backend**: Postgres + PostGIS (or Supabase). The types in `src/types` map 1:1 to tables — see `DATA_MODEL.md`. Add Row-Level Security so members only read their own matches, messages and documents.
2. **Auth**: replace the mock session with real phone auth; add device/session management, rate limits and abuse detection.
3. **Entitlements**: enforce plan limits (weekly match cap, discovery access) server-side; the client helpers in `lib/entitlements.ts` are UX only.
4. **Matching**: move candidate retrieval + scoring to the server (PostGIS radius query → ranker). Keep the `MatchScoreResult` shape.
5. **Verification & documents**: store credentials in a private bucket, encrypt at rest, restrict to moderators, add retention rules.
6. **Moderation**: automated text/image scanning, rate-limited reporting, immutable audit logs, admin roles + 2FA, SLAs.
7. **Privacy/compliance**: legal review of all CMS copy (current content is placeholder), consent management, data export/deletion pipeline, HIPAA/FERPA-adjacent considerations for workplace data (avoid collecting patient/student data).
8. **PWA**: replace `public/sw.js` with Workbox (`vite-plugin-pwa`) for versioned precaching; add a real push handler; use `BrowserRouter`.
9. **Accessibility**: the prototype uses labelled controls, visible focus, semantic landmarks, `aria-live` regions and focus-trapped dialogs — run an audit (axe, screen-reader pass) before launch.

See also: [`PRODUCT_SCOPE.md`](./PRODUCT_SCOPE.md) and [`DATA_MODEL.md`](./DATA_MODEL.md).
