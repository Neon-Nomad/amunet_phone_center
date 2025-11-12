# Server-Side Security Analysis Report
## Amunet Phone Center - /home/user/amunet_phone_center/server/src

### Executive Summary
Comprehensive security review of the Node.js/Fastify backend server including authentication, authorization, input validation, and error handling patterns. The codebase demonstrates good use of security libraries but has several critical and high-severity vulnerabilities that require immediate attention.

---

## 1. AUTHENTICATION & AUTHORIZATION PATTERNS

### Current Implementation (lib/auth.ts)
- **JWT-based authentication** using @fastify/jwt
- Token structure: `{ userId, tenantId, email }`
- Expiration: 7 days (routes/auth.ts:76)
- Middleware: `requireAuth()` and helper functions `verifyJWT()`, `getAuthUser()`

### Positive Aspects
- ✓ Uses bcryptjs for password hashing (12 rounds) in auth.ts:31
- ✓ JWT verification happens on protected routes via preHandler middleware
- ✓ Timing-safe comparison for Twilio signatures (lib/twilio.ts:45 - crypto.timingSafeEqual)
- ✓ Proper use of Zod for input validation in auth routes

### Critical Vulnerabilities & Issues

#### **CRITICAL: Default JWT_SECRET Exposed**
**Location**: server/src/config/env.ts:27
```typescript
JWT_SECRET: z.string().min(32).default('change-me-in-production-min-32-chars-long-secret-key')
```
- Default secret is hardcoded and documented in the code
- Production deployments may be using this default value
- **Impact**: Attackers can forge JWT tokens if default is used
- **Recommendation**: Fail fast in production if JWT_SECRET is not set, remove default value

#### **HIGH: Weak Password Requirements**
**Location**: server/src/routes/auth.ts:9, 15
```typescript
password: z.string().min(8)
```
- Only checks minimum length (8 characters)
- No complexity requirements (uppercase, lowercase, numbers, symbols)
- No password dictionary checks
- **Impact**: Vulnerable to brute-force attacks
- **Recommendation**: Enforce complexity requirements, implement rate limiting on login

#### **HIGH: Long JWT Expiration Window**
**Location**: server/src/routes/auth.ts:76
```typescript
expiresIn: '7d' // Token expires in 7 days
```
- 7-day expiration is very long for API tokens
- No token refresh mechanism implemented
- No token invalidation on logout (routes/auth.ts:87-90)
- **Impact**: Compromised tokens remain valid for a week
- **Recommendation**: Reduce to 1-2 hours, implement refresh tokens

#### **MEDIUM: Missing Logout Token Invalidation**
**Location**: server/src/routes/auth.ts:86-91
```typescript
app.post('/logout', { preHandler: requireAuth }, async (request, reply) => {
  // Logout is handled client-side by removing the token
  // This endpoint can be used for server-side token invalidation in the future
  // For now, we just return success
  return reply.send({ message: 'Logged out successfully' });
});
```
- Logout does nothing on the server
- Tokens remain valid until expiration
- No token blacklist mechanism
- **Impact**: Users cannot truly logout; tokens remain valid
- **Recommendation**: Implement token blacklist or shorter expiration times

---

## 2. INPUT VALIDATION APPROACHES

### Current Implementation
Using **Zod schema validation** across all routes - Good Practice

#### Validation Coverage
| File | Validation | Status |
|------|-----------|--------|
| auth.ts | registrationSchema, loginSchema | ✓ Present |
| onboarding.ts | onboardingSchema | ✓ Present |
| billing.ts | checkoutSchema, customerId schema | ✓ Present |
| twilio.ts | twilioPayloadSchema | ✓ Present |
| scheduling.ts | bookingSchema | ✓ Present |
| config.ts | updateSchema | ✓ Present |
| chatbot.ts | Manual string checks | ⚠ Partial |
| contact.ts | contactSchema | ✓ Present |

### Vulnerabilities Found

#### **HIGH: Schema Bypass with .passthrough()**
**Location**: server/src/routes/twilio.ts:19
```typescript
const twilioPayloadSchema = z
  .object({...})
  .passthrough();  // ⚠ Allows any additional fields
```
- Schema accepts additional unknown fields
- Can be exploited to inject unexpected data
- **Impact**: Allows arbitrary data through validation
- **Recommendation**: Remove .passthrough() or explicitly list allowed fields

#### **HIGH: No URL Validation on Redirect URLs**
**Location**: server/src/routes/billing.ts:39, 40
```typescript
success_url: successUrl,  // Only validated as URL, no domain whitelist
cancel_url: cancelUrl,
```
- Stripe session URLs are validated only as URLs
- No origin/domain verification
- Could redirect users to attacker-controlled sites
- **Impact**: Open redirect vulnerability
- **Recommendation**: Whitelist allowed domains for redirect URLs

#### **MEDIUM: Chatbot Message Not Properly Validated**
**Location**: server/src/routes/chatbot.ts:168-173
```typescript
const { message, userType = 'visitor', tenantId, intent, userId } = request.body;
if (!message?.trim()) {
  return reply.status(400).send({ text: 'Please ask a question so I can help.' });
}
```
- No Zod schema validation on chatbot POST /chat endpoint
- Message length unbounded (could cause DoS)
- No sanitization before sending to OpenAI or logging
- **Impact**: Potential injection attacks via message parameter
- **Recommendation**: Add Zod schema with max length validation

#### **MEDIUM: Email Validation Insufficient**
**Location**: server/src/routes/contact.ts:8
```typescript
email: z.string().email()
```
- Zod's email validation is permissive
- No verification that email actually works
- Could allow invalid formats through
- **Impact**: Invalid email addresses in system
- **Recommendation**: Add email verification step

---

## 3. SQL INJECTION VULNERABILITIES

### Analysis
**Good News**: The codebase uses **Prisma ORM exclusively** - parameterized queries by default

#### Safe Patterns Found
✓ All database queries use Prisma client API
✓ No raw SQL queries found
✓ No string concatenation in queries
✓ Tenant isolation through tenantId checks

Example - Safe Query (dashboard.ts:10-13):
```typescript
await app.prisma.call.findMany({
  where: { tenantId: user.tenantId },  // Parameterized
  orderBy: { createdAt: 'desc' },
  take: 5
})
```

### Potential Issues

#### **MEDIUM: JSON Metadata Fields**
**Location**: server/src/routes/twilio.ts:37, 85
```typescript
metadata: payload  // Storing entire payload as JSON
```
- Entire webhook payload stored in JSON field
- Could contain malicious data if attacker controls Twilio
- JSON parsing not validated before storage
- **Impact**: Potential injection in metadata JSON
- **Recommendation**: Validate/sanitize payload before storing as JSON

#### **MEDIUM: callRoutingConfig JSON Not Validated**
**Location**: server/src/services/onboardingService.ts:200-203
```typescript
callRoutingConfig: {
  greeting: `Thanks for calling ${businessName}.`,  // Template interpolation
  keywords: detection.keywords ?? []
}
```
- Dynamic greeting built from unvalidated businessName
- If businessName contains special characters, could cause issues
- **Impact**: Could have JSON/template injection issues
- **Recommendation**: Validate businessName more strictly before use in JSON

---

## 4. HARDCODED SECRETS & CREDENTIALS

### Environment Variables (config/env.ts)
All secrets properly defined as environment variables - **Good Practice**

**Secrets found in env.ts**:
- OPENAI_API_KEY (optional)
- ELEVENLABS_API_KEY (optional)
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN (optional)
- STRIPE_SECRET_KEY (optional)
- STRIPE_WEBHOOK_SECRET (optional)
- SENDGRID_API_KEY (required)
- SLACK_WEBHOOK_URL (required)
- JWT_SECRET (with dangerous default)

### Critical Finding: DANGEROUS DEFAULT JWT_SECRET
**File**: server/src/config/env.ts:27
```typescript
JWT_SECRET: z.string().min(32).default('change-me-in-production-min-32-chars-long-secret-key')
```
- **CRITICAL**: Production may be using this default
- Visible in source code
- All instances would be compromised
- **Immediate Action Required**: Remove default, fail in production

### Email Address Hardcoded
**Location**: server/src/services/mailService.ts:19
```typescript
from: { email: 'hello@amunet.ai', name: 'Amunet AI Concierge' }
```
- Email address is hardcoded
- Not configurable via environment
- Minor issue but should be externalized

### No Secrets in Code
✓ No API keys hardcoded in source
✓ No passwords hardcoded
✓ No credit card test numbers hardcoded
✓ All environment files properly gitignored (.env.example present)

---

## 5. RATE LIMITING IMPLEMENTATION

### Current Setup (app.ts:41-45)
```typescript
await app.register(rateLimit, {
  global: true,
  max: 200,
  timeWindow: '1 minute'
});
```

### Implementation Details
- **Global rate limit**: 200 requests per minute (3.3 req/sec)
- Applied to entire application
- Uses @fastify/rate-limit

### Issues Found

#### **HIGH: Weak Global Rate Limit**
- 200 requests/minute is relatively high
- No per-endpoint customization
- No per-user/IP differentiation
- **Impact**: Could be exhausted by brute-force attacks
- **Recommendation**: 
  - Reduce global limit to 100 req/min
  - Implement stricter limits on auth endpoints (10-20/min)
  - Implement stricter limits on payment endpoints

#### **MEDIUM: No Login Rate Limiting**
**Location**: server/src/routes/auth.ts:56-84 (/login endpoint)
- Uses global limit only (200/min)
- Should have separate stricter limit
- Vulnerable to brute-force password attacks
- **Recommendation**: Add specific rate limiter for login (5-10 attempts per minute max)

#### **MEDIUM: Billing Webhook Has Custom Rate Limit But Global Also Applies**
**Location**: server/src/routes/billing.ts:85-88
```typescript
config: {
  rawBody: true,
  bodyLimit: 1_000_000,
  rateLimit: {
    max: 100,        // Local limit
    timeWindow: '1 minute'
  }
}
```
- Local limit is 100 req/min (less restrictive than global 200)
- Both limits might apply
- **Recommendation**: Document rate limit behavior, ensure sensible defaults

#### **MISSING: No Rate Limiting on Twilio Webhooks**
**Location**: server/src/routes/twilio.ts (all endpoints)
- Twilio webhooks vulnerable to replay attacks
- No rate limiting configured
- Signature verification alone is insufficient
- **Recommendation**: Add nonce tracking or timestamp validation

---

## 6. ERROR HANDLING PATTERNS

### Current Error Handling Strategy

#### Custom Error Classes
```typescript
// auth.ts
export class UnauthorizedError extends Error {
  statusCode = 401;
}

// tenant.ts
export class TenantMissingError extends Error {
  statusCode = 400;
}
```

#### Global Error Handler (app.ts:72-89)
```typescript
app.setErrorHandler((error, request, reply) => {
  if (error instanceof TenantMissingError) {
    return reply.status(error.statusCode ?? 400).send({
      error: 'Bad Request',
      message: error.message
    });
  }
  // Default Fastify handler
  reply.send(error);
});
```

### Issues Found

#### **HIGH: Generic Error Handler Leaks Stack Traces**
**Location**: app.ts:88
```typescript
// Default Fastify handler - may expose stack traces in production
reply.send(error);
```
- Falls back to default Fastify error handling
- May expose sensitive stack traces in production
- Includes sensitive paths and internal logic
- **Impact**: Information disclosure
- **Recommendation**: Add explicit error handling that never sends stack traces to clients

#### **HIGH: Unhandled Promise Rejections**
- No global promise rejection handler
- Unhandled async errors could crash process
- **Recommendation**: Add process.on('unhandledRejection') handler

#### **MEDIUM: Inconsistent Error Response Format**
Different endpoints return different error formats:
```typescript
// Format 1: Basic error
{ error: 'User already exists' }

// Format 2: With details
{ error: 'Invalid checkout payload', details: error.flatten().fieldErrors }

// Format 3: Generic
reply.send(error)
```
- No consistent error response schema
- Client must handle multiple formats
- **Recommendation**: Standardize all error responses

#### **MEDIUM: Console.error() in Production**
**Location**: server/src/services/onboardingService.ts:145-147
```typescript
console.error('!!!!!!!!!! OPENAI ONBOARDING FAILED !!!!!!!!!!!');
console.error(error.response?.data ?? error.message ?? error);
console.error('!!!!!!!!!! END OF OPENAI ERROR !!!!!!!!!!!');
```
- Using console.error() for production errors
- Should use app.log instead
- Could leak sensitive information to logs
- **Recommendation**: Replace with app.log.error()

#### **MEDIUM: Missing Error Handling in Async Background Jobs**
**Location**: server/src/routes/chatbot.ts:220-237
```typescript
const backgroundJobs: Promise<void>[] = [];
// ... push promises
await Promise.all(backgroundJobs);  // ⚠ One failure cancels all
```
- Uses Promise.all() which fails on first error
- Should use Promise.allSettled() to handle partial failures
- Could cause incomplete email/Slack notifications
- **Recommendation**: Use Promise.allSettled() or Promise.catch() handlers

#### **MEDIUM: Silent Error Swallowing**
**Location**: server/src/services/voiceService.ts:56-58
```typescript
} catch (error) {
  // swallow errors and fall back to deterministic voice mapping
}
```
- Errors completely silenced
- No logging of failures
- Makes debugging difficult
- **Recommendation**: Log errors even if falling back

---

## 7. ADDITIONAL SECURITY FINDINGS

### CORS Configuration (app.ts:35)
```typescript
await app.register(cors, { origin: true });
```
- **ISSUE**: `origin: true` allows ANY origin (overly permissive)
- **Impact**: Cross-origin attacks possible
- **Recommendation**: Whitelist specific domains

### Custom CORS Headers in Chatbot (routes/chatbot.ts:251-252)
```typescript
.header('Access-Control-Allow-Origin', request.headers.origin ?? '*')
.header('Access-Control-Allow-Credentials', 'true')
```
- **CRITICAL**: Wildcard origin with credentials allowed
- Violates CORS security model
- Allows credential theft via CSRF
- **Recommendation**: Never use '*' with credentials

### Tenant Isolation - MEDIUM Risk
**Location**: server/src/lib/tenant.ts
```typescript
const tenantIdHeader = request.headers[tenantHeader] as string | undefined;
const tenantIdQuery = query?.tenantId;
const tenantId = tenantIdHeader ?? tenantIdQuery;
```
- Tenants identified via header/query parameter
- Not tied to authenticated user
- Could allow tenant confusion attacks
- **Recommendation**: Always extract from JWT token instead of headers/query

### External API Calls - No Timeout
- callOpenAI() - axios calls with no timeout
- ElevenLabs API calls - no timeout
- **Impact**: Could hang indefinitely, cause resource exhaustion
- **Recommendation**: Add timeout configuration (5-30 seconds)

### Stripe Webhook Signature Verification - GOOD
**Location**: server/src/routes/billing.ts:106
- Uses Stripe's webhooks.constructEvent() correctly
- Validates raw body and signature
- Proper error handling for signature failures

### Twilio Signature Verification - GOOD
**Location**: server/src/lib/twilio.ts:23-45
- Uses timing-safe comparison
- Proper HMAC validation
- However, requests can still be replayed

### Missing Security Headers
- X-Content-Type-Options (nosniff)
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security
- **Note**: Helmet is registered (app.ts:36) which should add these

---

## 8. SENSITIVE DATA EXPOSURE

### Audit Logs Store User Messages
**Location**: server/src/routes/chatbot.ts:240-248
```typescript
await app.prisma.auditLog.create({
  data: {
    tenantId,
    category: 'chatbot',
    message: `${userType} asked: ${message}`,  // ⚠ Full message in plain text
    metadata: meta
  }
});
```
- User messages stored in plain text
- No encryption at rest
- Could contain PII, payment information, etc.
- **Recommendation**: Encrypt sensitive fields or hash messages

### Call Metadata Stored in JSON
**Location**: server/src/routes/twilio.ts:37, 85
```typescript
metadata: payload  // Entire webhook payload
```
- All call metadata stored unencrypted
- Could contain sensitive call details
- **Recommendation**: Encrypt sensitive metadata fields

### Email Addresses in Audit Logs
**Location**: server/src/routes/chatbot.ts:158
```typescript
`Email: ${body.email}`  // In audit log body
```
- PII stored in audit logs
- Not encrypted
- **Recommendation**: Encrypt or hash sensitive PII

---

## 9. BUSINESS LOGIC SECURITY ISSUES

### Subscription Minutes Tracking - Race Condition
**Location**: server/src/routes/twilio.ts:96-102
```typescript
if (subscription && durationSeconds > 0) {
  const minutes = Math.max(1, Math.ceil(durationSeconds / 60));
  await app.prisma.subscription.update({
    where: { id: subscription.id },
    data: { meteredMinutes: subscription.meteredMinutes + minutes }
  });
}
```
- Race condition: Reads then writes
- Two concurrent calls could cause lost updates
- **Impact**: Billing inconsistency
- **Recommendation**: Use atomic increment in database

### No Idempotency Keys for Stripe Webhooks
- Could process same event twice
- Would create duplicate subscription updates
- Deduplication exists (billings.ts:114-124) but not guaranteed
- **Recommendation**: Add idempotency key to webhook processing

### No Rate Limiting on API Operations
- No protection against DoS via normal API calls
- Could enumerate all calls/bookings with pagination

---

## SUMMARY TABLE

| Category | Finding | Severity | Status |
|----------|---------|----------|--------|
| Auth | Default JWT_SECRET | CRITICAL | ⚠ Not Fixed |
| Auth | 7-day token expiration | HIGH | ⚠ Not Fixed |
| Auth | No logout invalidation | HIGH | ⚠ Not Fixed |
| Auth | Weak password requirements | HIGH | ⚠ Not Fixed |
| Validation | Schema .passthrough() | HIGH | ⚠ Not Fixed |
| Validation | No URL domain whitelist | HIGH | ⚠ Not Fixed |
| Validation | Chatbot no schema | MEDIUM | ⚠ Not Fixed |
| Rate Limiting | Weak global limit | HIGH | ⚠ Not Fixed |
| Rate Limiting | No auth endpoint limit | MEDIUM | ⚠ Not Fixed |
| Error Handling | Stack trace exposure | HIGH | ⚠ Not Fixed |
| Error Handling | Console.error in prod | MEDIUM | ⚠ Not Fixed |
| CORS | Wildcard + credentials | CRITICAL | ⚠ Not Fixed |
| Tenant | Query param based ID | MEDIUM | ⚠ Not Fixed |
| Data | Plaintext message logging | MEDIUM | ⚠ Not Fixed |

---

## REMEDIATION PRIORITY

### IMMEDIATE (P0 - Deploy within 48 hours)
1. Remove JWT_SECRET default value
2. Fix CORS: origin: true + credentials
3. Fix chatbot CORS headers (no wildcard)
4. Add explicit error handler (no stack traces)

### URGENT (P1 - Deploy within 1 week)
1. Reduce rate limits and add auth endpoint limits
2. Add login brute-force protection
3. Implement password complexity requirements
4. Add URL domain whitelist for redirects
5. Remove .passthrough() from Twilio schema
6. Add Zod validation to chatbot endpoint

### IMPORTANT (P2 - Deploy within 2 weeks)
1. Implement shorter JWT expiration (1-2 hours)
2. Add refresh token mechanism
3. Implement token logout blacklist
4. Add external API timeouts
5. Fix race condition in subscription minutes
6. Encrypt sensitive fields in logs
7. Use Promise.allSettled() in chatbot

### FOLLOW-UP (P3 - Deploy within 1 month)
1. Standardize error response format
2. Add idempotency keys for webhooks
3. Fix tenant ID extraction from JWT
4. Add email verification
5. Add Twilio replay protection
6. Implement comprehensive audit logging

