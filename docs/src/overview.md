# Amunet AI Documentation

## Quickstart

1. Clone the repository and install dependencies with `npm install`.
2. Configure environment variables in `.env`.
3. Generate Prisma client and run migrations from the `server` package.
4. Launch development services with `npm run dev`.

## Onboarding Guide

1. **Discovery** — Provide a business name or website URL via `/api/onboarding/start`. The service enriches metadata and verifies the domain.
2. **Profile Detection** — Industry, timezone, and channel preferences are derived from public signals and stored in `BusinessConfig`.
3. **Voice Alignment** — The voice service selects an appropriate persona, sourcing premium ElevenLabs voices when the tier allows.
4. **Workflow Assembly** — Default call routing, booking rules, and follow-up actions are generated and recorded for the tenant.
5. **Integration Provisioning** — Stripe, Cal.com, and telephony placeholders are prepared and ready for credential activation.
6. **Launch Summary** — Final response returns tenant, user, and config identifiers so the dashboard can render immediately.

## API Reference

### Onboarding

- **POST `/api/onboarding/start`** — Body: `{ businessName?, websiteUrl?, email, tier }`. Returns onboarding steps and
  provisioned IDs.
  - Example response:

    ```json
    {
      "tenantId": "ten_123",
      "userId": "usr_456",
      "configId": "cfg_789",
      "steps": [
        { "name": "discovery", "status": "complete" },
        { "name": "profile", "status": "complete" },
        { "name": "voice", "status": "complete" }
      ]
    }
    ```

### Webhooks

- **POST `/api/twilio/voice`** — Twilio call handler. Requires `x-tenant-id` header.
- **POST `/api/twilio/incoming`** — Message intake.
- **POST `/api/twilio/status`** — Status callbacks.
  - Expected headers: `X-Twilio-Signature` signed with `TWILIO_AUTH_TOKEN`.
  - Error Codes: `403` for invalid signature, `422` for malformed payloads.

Sample payload for `/api/twilio/status`:

```json
{
  "CallSid": "CA123",
  "From": "+14155550100",
  "To": "+14155550200",
  "CallStatus": "completed",
  "CallDuration": "180"
}
```

### Billing

- **POST `/api/billing/checkout`** — Creates Stripe checkout session for plan upgrades.

### Config

- **GET `/api/config`** — Fetch current business configuration.
- **PUT `/api/config`** — Update voice profile and AI provider.

### Dashboard

- **GET `/api/dashboard/overview`** — Retrieve recent calls, bookings, subscription status, and uptime summary.

## Security & Compliance

- Tenants isolated via header + database scoping.
- Premium voice enforcement ensures Starter plans stay on standard voices.
- Rate limiting enabled globally; configure Redis for distributed deployments.
- Twilio and Stripe webhook signatures validated before any write operations occur.