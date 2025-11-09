# Amunet Phone Center

Amunet AI is a multi-tenant, production-ready receptionist SaaS that onboards new businesses in six intelligent steps, deploys
voice + chat agents, books meetings, and manages billing in minutes.

## Features

- **Fastify + Prisma backend** with Postgres multi-tenancy and audit logging.
- **Six-step intelligent onboarding** that detects business details, selects voice profiles, and provisions configs.
- **Twilio webhooks** for voice, incoming events, and status callbacks.
- **Stripe-powered billing** with Starter, Professional, and Enterprise tiers (premium voices enforced).
- **Dynamic ElevenLabs voice sourcing** that selects premium voices per industry when credentials are supplied.
- **Cal.com scheduling** integration ready for activation via environment variables.
- **React + Tailwind + Framer Motion frontend** featuring a premium marketing site and authenticated dashboard shells.
- **Automated tests** covering onboarding pipeline and pricing tier integrity.

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- PostgreSQL database URL available as `DATABASE_URL`

### Installation

```bash
npm install
```

This installs dependencies for both the backend (`server`) and frontend (`client`).

### Environment Variables

Copy `.env.example` to `.env` at the repository root and set the required values.

```bash
cp .env.example .env
```

Key variables:

- `DATABASE_URL` — Postgres connection string (required)
- `STRIPE_SECRET_KEY` & price IDs (`STRIPE_STARTER_PRICE_ID`, etc.)
- `CALCOM_API_KEY` / `CALCOM_BASE_URL`
- `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `TWILIO_*` for provider activation

### Database

Prisma is used for schema management. Generate the client and apply migrations with:

```bash
cd server
npx prisma generate
npx prisma migrate deploy
```

### Development

Start both the backend API and frontend dev server:

```bash
npm run dev
```

- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173`

### Production Build

```bash
npm run build
```

Then run the Fastify server:

```bash
npm start
```

## Version Control Notes

The canonical branch for this repository is `main`. When preparing to push
updates to GitHub, make sure you have committed all work locally before
attempting to push:

```bash
git status           # verify clean working tree
git add <files>      # stage your changes
git commit -m "feat: describe your change"
git push origin main
```

Keeping the branch up to date with committed work prevents push failures that
occur when the working tree still has pending changes.

### Testing

Run the shared test suite:

```bash
npm test
```

## Key API Routes

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/api/onboarding/start` | Execute 6-step onboarding flow and provision tenant |
| POST | `/api/auth/register` | Create a starter-tier tenant and admin user |
| POST | `/api/auth/login` | Stub login returning tenant headers |
| GET | `/api/dashboard/overview` | Retrieve recent calls, bookings, and subscription status |
| GET/PUT | `/api/config` | Retrieve or update business configuration (voice, AI provider, calendar) |
| POST | `/api/billing/checkout` | Create a Stripe checkout session for a tier |
| POST | `/api/billing/portal` | Create Stripe billing portal session |
| POST | `/api/scheduling/book` | Create a Cal.com booking and persist it |
| POST | `/api/twilio/voice` | Handle voice webhooks and log calls |
| POST | `/api/twilio/incoming` | Handle inbound messages |
| POST | `/api/twilio/status` | Log call status callbacks |

All Twilio webhooks require a valid `X-Twilio-Signature` header that is verified against `TWILIO_AUTH_TOKEN` before tenant data
is persisted.

All tenant-specific endpoints require the `x-tenant-id` header.

## Stripe Webhooks

- `/api/billing/webhook` receives Stripe `customer.subscription.*` events and relies on `fastify-raw-body` so the raw payload can be passed to `Stripe.webhooks.constructEvent`.
- Set `STRIPE_WEBHOOK_SECRET` to the Signing Secret provided in the Stripe dashboard. Stripe CLI (`stripe listen --forward-to`) is helpful for asserting the endpoint and signature.
- The handler updates the Prisma `Subscription` status and `stripeSubId` so the dashboard reflects Stripe’s source of truth and you can reconcile failed renewal states.
- Monitor webhook health through Stripe’s Webhook dashboard (Notifications → Webhooks) and add alerts around failed deliveries so retries receive human follow-up; logging unsuccessful verifications (e.g., invalid signatures) into your observability stack helps with long-term tracking.
- Idempotent delivery is enforced via audit-log entries keyed by Stripe event IDs, so duplicate retries simply return `{ received: true, duplicate: true }`. Failures are logged with the event ID/type and return HTTP 500 so Stripe retries.
- Rate limit the webhook (100 calls/minute) because Stripe may retry aggressively during outages.
- Track `stripe.webhook.received` / `stripe.webhook.processed` metrics through your preferred monitoring agent (Prometheus/StatsD) so you can chart volumes and success rates.

### Webhook Monitoring

- **Failed webhooks:** Track 4xx/5xx responses in Stripe’s Dashboard and correlate with telemetry (e.g., `billing_webhook` audit logs).
- **Processing time:** Keep each handler under 5 seconds; long-running handlers are surfaced via `pino` spans or Fastify metrics.
- **Duplicate events:** Normal; our audit log deduplication will flag duplicates as `duplicate: true`, but track them to ensure idempotency keeps working.
- **Missing events:** Alert on webhook endpoint downtime or high latency so you can request Stripe to retry missed deliveries.

Suggested alerts:
1. 3+ consecutive webhook failures (Stripe shows this and it should map to an ops alert).
2. Webhook endpoint unreachable (Fastify/hosting-level health check).
3. Unhandled event types logged as warnings so you can add new handlers before sellers start subscribing to them.

### Rotating Webhook Secrets

1. Create a new webhook endpoint in Stripe and note the new signing secret.
2. Update `STRIPE_WEBHOOK_SECRET` (and any staging mirrors) with the new secret.
3. Deploy the updated service so the new secret is used.
4. Verify webhooks process successfully via the Stripe Dashboard or CLI.
5. Delete the old webhook endpoint/secret in Stripe once the rollout is confirmed.

## Frontend Overview

- Premium landing page with sticky navigation, hero parallax, feature carousel, pricing tiers, onboarding timeline, and
  testimonials.
- Dashboard shell featuring overview metrics, call logs, and booking summaries.
- Settings page to manage voice profiles and AI providers with premium voice enforcement feedback.

## Architecture Notes

- **Backend:** Fastify, Prisma, Stripe, Twilio, Cal.com, OpenAI, ElevenLabs stubs. Logging via pino.
- **Frontend:** React 18, Tailwind CSS, Framer Motion animations, responsive navigation.
- **Testing:** Vitest suites for onboarding logic and pricing tiers.
- **Multi-tenancy:** Enforced via `x-tenant-id` header and tenant-specific DB records.

## Deployment Considerations

- Configure Redis (via `REDIS_URL`) for rate limiting and background jobs if required.
- Wire CI/CD to run `npm install`, `npm run build`, and `npm test`.
- Provision infrastructure per `agents.md` guidelines (Render/Fly.io backend, Vercel frontend, managed Postgres).

