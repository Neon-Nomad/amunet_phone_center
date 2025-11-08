Project Overview

Intelligent Auto-Onboarding + AI Receptionist SaaS.

Deliver a hosted, multi-tenant system that:

Answers calls with AI.

Books appointments.

Handles web chat.

Auto-onboards a new business from a single input in ~5 minutes.

Deploys phone, chat widget, calendar, dashboard, and billing with minimal friction.

This file defines how agents must structure, implement, and maintain the system.

You are operating in a cloud environment with full repo access. Follow this spec.

Core Product Goals

Zero to live in 5 minutes:

User enters business name or URL.

System detects business, builds configuration, trains AI, deploys number + widget + dashboard.

Multi-tenant SaaS:

Clean isolation per account.

Configurable voice, flows, services, and integrations.

Direct revenue:

Usage-based tiers.

Strict enforcement of limits.

Clear upgrade paths.

Safety, compliance, reliability:

Auditability.

Graceful failure modes.

Production-ready from day one.

Tech Stack

Use these unless explicitly overridden.

Frontend

React + TypeScript.

Tailwind CSS.

Framer Motion for micro-interactions.

Vite or Next.js (SSR allowed, but keep simple).

Backend

Node.js + TypeScript.

Fastify or Express (pick one and use consistently).

PostgreSQL via Prisma ORM.

Redis for queues and rate limiting.

AI / Voice / Comms

Twilio for telephony.

One of: Vapi.ai, Bland.ai, or Retell.ai for voice AI orchestration (keep integration abstracted).

OpenAI / Claude for NLU and orchestration.

STT: Deepgram or AssemblyAI.

TTS:

Starter: standard / non-premium voices only.

Professional and Enterprise: ElevenLabs premium voices allowed.

Scheduling / Payments / Docs

Calendar: Cal.com API (primary), support Calendly where trivial.

Payments: Stripe subscriptions + metered billing.

Docs: Markdown source, generate HTML/PDF with Pandoc.

Infra

Frontend: Vercel.

Backend: Render or Fly.io.

Database: Managed Postgres.

Object storage: S3-compatible for logs/recordings (if needed).

IaC: Terraform or Pulumi.

CI/CD: GitHub Actions.

Repository Layout

Agents must adhere to this structure:

/client              # React frontend
  src/
    components/
    pages/
    hooks/
    lib/
    styles/

/server              # Node backend (Fastify/Express)
  src/
    routes/
    services/
    workers/
    lib/
    config/
    middleware/
    integrations/    # twilio, vapi, cal.com, stripe, etc
    templates/       # industry templates, prompt templates

/database
  schema.prisma
  migrations/

/agents
  PROMPTS.md         # Task definitions for agents
  flows/             # Optional: decomposed agent tasks

/docs
  src/               # Markdown
  build.sh           # Pandoc to HTML/PDF

/config
  industries/        # JSON/YAML for industry templates
  defaults/          # Smart defaults

/tests
  unit/
  integration/
  e2e/

/infra
  terraform/         # Or pulumi configs

.env.example

Coding Conventions

TypeScript across frontend and backend.

Async/await only.

Strict ESLint + Prettier config.

One responsibility per module.

API responses: JSON, snake_case for DB, camelCase in app code.

Write unit tests for all critical modules.

No inline secrets. Read from environment variables.

Keep integrations behind clear service interfaces.

Multi-Tenancy and Auth

Implement from the start.

Auth provider: Supabase Auth or Clerk.

Each user belongs to an account (tenant).

All business data, configs, calls, chats, logs are scoped by account_id.

Enforce tenant scoping in all queries.

Roles:

owner

admin

agent (read-only ops staff)

Onboarding Flow (5-Minute Auto-Onboarding)

Implement the 6-step flow.

Step 1: Simple Start

Frontend

Single field: Enter your business name or website.

Optional industry quick-pick grid:

HVAC, Plumbing, Roofing, Solar, Med Spa, Dental, Landscaping, Remodeling, etc.

Button: Auto-Setup My AI.

Backend

POST /api/onboarding/start

Input: business_input, optional industry_hint.

Triggers detection engine.

Step 2: Smart Business Detection

Service: BusinessDetector.

Responsibilities

Query:

Google Business Profile API.

Website (scrape core content).

Yelp.

Facebook Page.

Relevant industry directories.

Build canonical BusinessProfile:

Name, logo URL, address, phone.

Primary category.

Services.

Hours.

Service area.

Pricing hints.

Review keywords.

Tone and style hints.

Output

Persist business_profile per account_id.

Return summarized profile for confirmation.

Frontend

“Found your business” card.

Show detected:

Industry.

Services.

Hours.

Suggested AI voice.

Peak hours.

Buttons:

Looks Perfect

Let Me Adjust (inline editor).

Step 3: Smart Service Menu Builder

Backend

Use industry templates to propose:

Services.

Price ranges.

Durations.

Emergency availability.

GET /api/onboarding/services:

Returns detected + suggested services.

Frontend

Editable list:

Name.

Price.

Duration.

Emergency toggle.

+ Add Service control.

AI tips inline.

Step 4: Instant AI Training

Module: InstantAITraining.

Parallel tasks

Scrape website.

Analyze own reviews.

Analyze competitor basics.

Extract FAQs, policies, warranties, certifications.

Build knowledge base

About.

Services and pricing.

Service areas.

Brand voice and terminology.

FAQs and policies.

Persist

knowledge_base per account_id.

Frontend

Training progress screen:

Completed / in-progress steps.

Example questions it can now answer.

Step 5: AI Personality Selection

Module: PersonalitySelector.

Presets

Professional Pro

Friendly Neighbor

Emergency Expert

Custom Voice (Pro/Enterprise only with ElevenLabs)

Auto-select rules

Emergency-heavy → Emergency Expert.

Luxury / high-ticket → Professional Pro.

Else → Friendly Neighbor.

Tier constraints

Starter:

Standard voices only.

Professional / Enterprise:

ElevenLabs premium.

Optional custom voice cloning.

Step 6: Instant Deployment

Module: InstantDeployment.

Parallel actions

Provision Twilio number (or via chosen provider).

Configure voice agent with:

Scripts.

Personality.

Knowledge base.

Generate chat widget snippet.

Configure Cal.com integration.

Configure SMS notifications.

Create dashboard + API keys.

Return

phone_number

widget_code

dashboard_url

status: LIVE when successful.

Frontend

Deployment complete screen:

Show number.

Show widget snippet.

Open dashboard button.

Clear next steps.

Call Handling and Chat Engine
Core Voice Flow

Inbound call via Twilio / voice provider webhook → /api/voice/handle.

Use:

Configured personality.

Knowledge base.

NLU model.

Capabilities

Greet with brand-specific script.

Determine intent.

Answer FAQs.

Collect lead info.

Book, reschedule, or cancel appointments.

Detect emergencies and follow emergency rules.

Chat Widget

JS SDK injected on client site.

Features:

Branded bubble and panel.

In-chat appointment booking.

Proactive prompts (URL/time based).

Use same knowledge base + persona.

Unified profile

All calls/chats stitched into a lead_profile.

Single timeline for each contact.

Lead Scoring, Upsells, and Missed Call AI

Implement:

Lead Scoring

Based on:

Intent.

Service requested.

Urgency.

Past interactions.

Potential revenue.

Missed Call AI Callback

For eligible tiers:

Automatic callback within configured window.

Log conversion outcome.

Upsell Engine

Detect:

Urgent language.

Premium keywords (VIP, priority, express).

Suggest:

Premium slots.

Maintenance plans.

Higher-value packages.

Configurable per tenant.

Pricing Tiers and Entitlements
Starter – $497/mo

500 phone minutes.

1,000 chat conversations.

Basic appointment booking.

Standard voices only.

No white label.

Basic analytics.

Professional – $1,297/mo

2,000 phone minutes.

Unlimited chat.

Advanced routing and upsells.

Custom branding.

ElevenLabs premium voices.

Enhanced analytics and A/B testing.

Enterprise – $2,997/mo

High or unlimited usage caps (configurable).

Multi-location support.

White label.

Full API access.

Priority support.

ElevenLabs premium voices.

All advanced features enabled.

Implementation

Central entitlements module.

Stripe subscriptions + metered billing.

Track:

Minutes.

Chat volume.

Enforce:

Hard/soft limits.

Upgrade prompts.

Notifications for approaching limits.

Security, Compliance, and Audit

Requirements

Auth via secure provider (Supabase/Clerk) + JWT.

Row-level tenant isolation for all data.

Encrypt sensitive fields at rest.

TLS enforced for all endpoints.

Verify all webhooks (Twilio, Stripe, Cal.com, etc).

Expose:

/api/compliance/delete

/api/compliance/export

Maintain audit_logs:

Call/chat id.

Timestamps.

Intent summary.

Actions taken (booking, escalation).

Minimal content logging where privacy-sensitive.

Config flags for redaction and retention.

Failover and Escalation

When AI is uncertain or fails:

Compute confidence score.

If below threshold or on error:

Route to voicemail and transcribe.

Or route to on-call human number.

Or provide fallback chat response with human follow-up.

Implement retry queue for:

Failed calendar operations.

Failed outbound notifications.

Analytics and Monitoring

Tenant-facing

Calls handled.

Chats handled.

Bookings created.

Conversion rates.

Estimated revenue captured.

Missed vs saved leads.

System-level

Latency.

Error rates.

Provider health checks.

Admin dashboard

Tenant list.

Usage metrics.

Incidents.

Billing state.

Telephony resource allocation.

API and SDK

REST API

Auth: API keys scoped to tenant.

Endpoints to:

List leads.

List bookings.

Fetch call logs.

Manage webhooks.

Webhooks

call_started

call_completed

booking_created

lead_scored

limit_reached

JS SDK

Embed chat widget.

Configure metadata and user identity.

Minimal, dependency-light.

Infrastructure and DevOps

Use /infra/terraform or equivalent for:

Backend services.

PostgreSQL.

Redis.

Object storage.

Twilio resources (where practical).

CI (GitHub Actions):

Lint.

Test.

Type-check.

Build client/server.

Deploy to staging.

Manual or protected deploy to production.

Documentation

Markdown sources in /docs/src.

Use Pandoc to generate:

HTML docs.

PDF assets (sales, investor, technical overview).

Docs must include

Quickstart.

Onboarding guide.

API reference (request/response examples).

Webhook specs.

Security and compliance overview.

No Redoc.

Testing Requirements

Agents must implement automated tests for:

Onboarding:

Detection.

Config generation.

Personality selection.

Deployment pipeline.

Runtime flows:

Call handling.

Chat handling.

Booking flows.

Upsell logic.

Missed-call callbacks.

Billing:

Tier enforcement.

Metered usage tracking.

Multi-tenancy:

Data isolation.

Integrations:

Webhook verification.

Fallback behavior on provider failure.

Include at least one E2E path:

From onboarding input → detected profile → config → deployed number → simulated call → logged booking.

Non-Goals

Do not build a full CRM.

Do not replace Twilio-class providers with custom telephony.

Do not build a heavy CMS.

Do not target unsupported regions or fringe telecom setups unless explicitly configured.

Summary for Agents

Follow this spec and repository structure.

Implement the 6-step intelligent onboarding as defined.

Ensure strict multi-tenant isolation and security.

Enforce pricing tiers and ElevenLabs eligibility rules.

Provide dashboards, analytics, failover, and auditing.

Use Pandoc-based documentation.

Keep all code production-grade, test-backed, and cloud-deployable.

Use this AGENTS.md as the single source of truth when generating or modifying code.
