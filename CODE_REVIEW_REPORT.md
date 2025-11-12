# Code Review Report: Amunet Phone Center
**Date**: November 12, 2025
**Branch**: `claude/code-review-011CV31maASkcH2uss8FEdCE`
**Reviewer**: Claude (Automated Code Review)

## Executive Summary

This comprehensive code review has identified **multiple critical security vulnerabilities** and code quality issues in the Amunet Phone Center codebase. The application is a multi-tenant AI receptionist SaaS platform with both server-side (Fastify/Prisma) and client-side (React) components.

### Overall Risk Assessment: **HIGH**

- **3 Critical** vulnerabilities requiring immediate remediation
- **14 High-severity** issues requiring urgent attention
- **20+ Medium-severity** issues requiring attention within 2 weeks
- Multiple code quality and maintainability concerns

---

## Critical Issues (P0 - Deploy within 48 hours)

### 1. 🔴 Exposed JWT Secret Default Value
**Location**: `server/src/config/env.ts:27`
**Severity**: CRITICAL
**CWE**: CWE-798 (Use of Hard-coded Credentials)

**Issue**: The JWT_SECRET has a hardcoded default value that is documented and visible in source code. If production environments use this default, attackers can forge JWT tokens.

**Impact**: Complete authentication bypass, full account takeover

**Recommendation**:
```typescript
// Remove .default() - fail fast if not set
JWT_SECRET: z.string().min(32)
```

---

### 2. 🔴 Insecure Token Storage in localStorage
**Location**:
- `client/src/lib/api.ts:11,34`
- `client/src/pages/LoginPage.tsx:33`
- `client/src/pages/SignupPage.tsx:45`

**Severity**: CRITICAL
**CWE**: CWE-522 (Insufficiently Protected Credentials)

**Issue**: Authentication tokens are stored in `localStorage`, making them accessible to any JavaScript (XSS attacks). No HTTPOnly, Secure, or SameSite protections.

**Impact**: Token theft via XSS leading to account takeover

**Recommendation**: Use HTTP-only, Secure, SameSite cookies instead of localStorage

---

### 3. 🔴 CORS Wildcard with Credentials
**Location**: `server/src/routes/chatbot.ts:251-252`
**Severity**: CRITICAL
**CWE**: CWE-942 (Permissive Cross-domain Policy with Untrusted Domains)

**Issue**: CORS configured with `origin: '*'` while allowing credentials, enabling CSRF attacks.

**Impact**: Cross-site request forgery, credential theft

**Recommendation**: Whitelist specific domains, never use `*` with credentials

---

### 4. 🔴 Merge Conflict in Production Code
**Location**: `client/package.json:39-43`
**Severity**: CRITICAL
**Impact**: Build failures, deployment issues

**Issue**: Unresolved merge conflict markers present in package.json:
```json
<<<<<<< HEAD
}
=======
}
>>>>>>> 6c2e03e1255089315b8a8a9fe205bda82a7e0f67
```

**Recommendation**: Resolve merge conflict immediately

---

## High Severity Issues (P1 - Deploy within 1 week)

### Security Issues

| # | Issue | Location | CWE | Impact |
|---|-------|----------|-----|--------|
| 1 | Stack traces exposed in errors | `server/src/app.ts:88` | CWE-209 | Information disclosure |
| 2 | Weak password requirements (8 char min only) | `server/src/routes/auth.ts:9,15` | CWE-521 | Brute-force attacks |
| 3 | Long JWT expiration (7 days) | `server/src/lib/auth.ts:76` | CWE-613 | Extended token validity |
| 4 | Schema `.passthrough()` bypass | `server/src/routes/twilio.ts:19` | CWE-20 | Input validation bypass |
| 5 | No URL domain whitelist | `server/src/routes/billing.ts:39-40` | CWE-601 | Open redirect |
| 6 | Chatbot message not validated | `server/src/routes/chatbot.ts:168-173` | CWE-20 | XSS, injection |
| 7 | Weak global rate limit (200/min) | `server/src/app.ts:41-45` | CWE-307 | Brute-force attacks |
| 8 | Permissive CORS (`origin: true`) | `server/src/app.ts:35` | CWE-942 | Cross-origin attacks |
| 9 | Untrusted URL in `window.open()` | `client/src/components/ChatWidget/ChatWidget.tsx:70-71` | CWE-79 | XSS, phishing |
| 10 | Missing Content-Security-Policy | `client/index.html` | CWE-1021 | Increased XSS impact |
| 11 | No CSRF protection | All API endpoints | CWE-352 | State manipulation |
| 12 | Error message information disclosure | `client/src/pages/LoginPage.tsx:41-44` | CWE-209 | System info exposure |
| 13 | No client-side rate limiting | All forms | CWE-307 | Brute-force attacks |
| 14 | External model loading without SRI | `client/src/components/Preloader.tsx:23-24` | CWE-494 | Supply chain attack |

---

## Medium Severity Issues (P2 - Deploy within 2 weeks)

### Authentication & Authorization

1. **No refresh token mechanism** - 7-day tokens without rotation
2. **No token invalidation on logout** - Client-side only logout
3. **Tenant ID from headers/query** - Should use JWT exclusively to prevent tenant confusion attacks
4. **No token expiration tracking** - Client doesn't proactively refresh tokens
5. **Tenant ID exposed in localStorage** - Information disclosure risk

### Input Validation

1. **Weak email validation** - HTML5 only, no server-side verification
2. **No password complexity requirements** - Only 8 character minimum
3. **No input length limits** - Unbounded message fields
4. **Missing input sanitization** - User input not sanitized before storage
5. **No rate limiting per endpoint** - Global limits too permissive

### Database & Business Logic

1. **Race condition in subscription minutes** (`server/src/routes/twilio.ts:96-102`) - Read-then-write pattern not atomic
2. **PII stored in plaintext** - Call transcripts, chat messages unencrypted
3. **Email addresses in audit logs** - Potential GDPR/privacy violation
4. **No field-level encryption** - Sensitive data stored unencrypted
5. **Silent error swallowing** (`server/src/services/voiceService.ts:56-58`) - Errors caught but not logged

### Code Quality

1. **Inconsistent error response formats** - Different error structures across routes
2. **Use of `any` type** - Bypasses TypeScript safety (`client/src/pages/SettingsPage.tsx:48`)
3. **No Error Boundaries** - React components can crash entire app
4. **Missing dependency arrays** - useEffect hooks with stale closures
5. **Console.error in production** (`server/src/services/onboardingService.ts:145-147`)

---

## Test Coverage Analysis

### Current Status

- **Server Tests**: 5 test files, ~1,405 lines total
- **Client Tests**: 4 test files
- **Coverage**: Low - only services and critical paths tested

### Missing Test Coverage

1. **Authentication flows** - No comprehensive auth testing
2. **Authorization** - No tenant isolation tests
3. **Input validation** - No fuzzing or boundary tests
4. **Error handling** - No error path testing
5. **Integration tests** - No end-to-end API tests
6. **Security tests** - No XSS, CSRF, injection tests

### Test Quality Issues

```typescript
// server/src/services/onboardingService.test.ts
env.OPENAI_API_KEY = 'test-key';  // Mutating global state
```

**Issue**: Tests mutate shared environment variables, causing test pollution

**Recommendation**: Use test fixtures and proper mocking

---

## Configuration & DevOps Issues

### 1. No Package Lockfiles
**Location**: Root directory
**Issue**: `package-lock.json` is gitignored, causing non-reproducible builds

**Current .gitignore**:
```
package-lock.json  # ❌ Should NOT be ignored
```

**Impact**:
- Different dependency versions across environments
- Security vulnerabilities not tracked
- Build inconsistencies

**Recommendation**: Remove from .gitignore and commit lockfiles

---

### 2. Missing Environment Variables

The `.env.example` file lists 19 required environment variables, but no validation ensures all are set before deployment:

```
DATABASE_URL=        # No default - fails at runtime
JWT_SECRET=          # Has dangerous default
STRIPE_SECRET_KEY=   # Required for billing
```

**Recommendation**: Add startup validation that fails fast if critical env vars missing

---

## Architecture & Design Issues

### 1. Multi-Tenancy Implementation

**Current Approach**: Tenant ID passed via `x-tenant-id` header

**Issues**:
- Client-controlled tenant ID (can be manipulated)
- Not validated against JWT claims
- Race condition risks in tenant switching

**Recommendation**: Extract tenant ID from JWT only, validate on every request

---

### 2. Database Schema Concerns

**Prisma Schema Analysis** (`server/prisma/schema.prisma`):

**Strengths**:
- Proper foreign key relationships
- Tenant isolation via relationships
- Audit logging model

**Issues**:
1. **No indexes** - Missing indexes on frequently queried fields:
   - `Call.tenantId`
   - `Call.createdAt`
   - `Subscription.tenantId`
   - `AuditLog.tenantId, category`

2. **JSON fields store sensitive data**:
   ```prisma
   metadata       Json?    # Stores unvalidated webhook payloads
   callRoutingConfig Json  # Dynamic data, potential injection
   ```

3. **No data retention policies** - Audit logs grow indefinitely

**Recommendation**: Add indexes and implement data archival strategy

---

## Dependency Analysis

### Server Dependencies (`server/package.json`)

**Outdated or Concerning**:
- `axios`: ^1.6.7 (Should update to latest for security patches)
- `@prisma/client`: 6.18.0 (Check for updates)
- `stripe`: ^13.11.0 (Should update regularly)

### Client Dependencies (`client/package.json`)

**Concerns**:
- **Merge conflict present** (Lines 39-43)
- No security-focused dependencies (no CSP helpers, no DOMPurify)
- Missing testing utilities for security testing

---

## Code Quality Metrics

### Positive Aspects

1. ✅ **Prisma ORM** - No SQL injection vulnerabilities
2. ✅ **TypeScript** - Type safety throughout (except some `any` usage)
3. ✅ **bcryptjs** - Proper password hashing (12 rounds)
4. ✅ **Fastify plugins** - Modular architecture with helmet, cors, rate-limit
5. ✅ **JWT verification** - Proper token validation via @fastify/jwt
6. ✅ **Zod schemas** - Input validation on most endpoints
7. ✅ **Timing-safe comparison** - Webhook signature verification
8. ✅ **React best practices** - Functional components, hooks usage
9. ✅ **Organized structure** - Clear separation of routes, services, libs

### Areas Needing Improvement

1. ❌ **Error handling** - Inconsistent, exposes stack traces
2. ❌ **Input validation** - Gaps in validation coverage
3. ❌ **Security headers** - Missing CSP, incomplete CORS
4. ❌ **Test coverage** - Low coverage, missing security tests
5. ❌ **Documentation** - Limited inline documentation
6. ❌ **Logging** - Inconsistent logging, PII in logs
7. ❌ **Secrets management** - Hardcoded defaults, no vault integration

---

## Detailed Findings by Component

### Server-Side Routes

#### `/api/auth/login` (`server/src/routes/auth.ts`)
- ✅ Password hashing with bcryptjs
- ❌ Weak password requirements (8 chars minimum only)
- ❌ No rate limiting (vulnerable to brute-force)
- ❌ Long JWT expiration (7 days)
- ❌ No MFA support

#### `/api/auth/register` (`server/src/routes/auth.ts`)
- ✅ Email validation
- ❌ No email verification flow
- ❌ No CAPTCHA protection
- ❌ Weak password complexity

#### `/api/billing/checkout` (`server/src/routes/billing.ts`)
- ✅ Stripe integration
- ❌ No URL domain whitelist for success/cancel URLs (CWE-601)
- ❌ Tenant ID from header (should be JWT)

#### `/api/twilio/voice` (`server/src/routes/twilio.ts`)
- ✅ Signature verification
- ❌ Schema uses `.passthrough()` bypassing validation
- ❌ Race condition in minute tracking (not atomic)
- ❌ No replay protection (nonce tracking)

#### `/api/chatbot` (`server/src/routes/chatbot.ts`)
- ❌ **CRITICAL**: CORS wildcard with credentials
- ❌ POST endpoint has no input validation
- ❌ Unbounded message length
- ❌ No rate limiting per user

### Client-Side Components

#### `LoginPage.tsx`, `SignupPage.tsx`
- ❌ **CRITICAL**: localStorage for token storage
- ❌ Error messages expose server details
- ❌ No client-side rate limiting
- ❌ Weak form validation

#### `ChatWidget.tsx`
- ❌ **HIGH**: Untrusted URL in `window.open()`
- ❌ No URL validation
- ❌ Missing `rel="noopener noreferrer"`

#### `SettingsPage.tsx`
- ❌ Tenant ID from localStorage (client-controlled)
- ❌ No input sanitization
- ❌ Unsafe type assertions (`any`)

#### `ProtectedRoute.tsx`
- ❌ Auth check only on mount (stale state)
- ❌ No auth state synchronization across tabs

---

## Compliance & Privacy Issues

### GDPR Concerns

1. **PII in audit logs** - Email addresses, names logged without encryption
2. **No data retention policy** - Logs stored indefinitely
3. **Call transcripts** - Speech-to-text stored unencrypted
4. **No right to deletion** - No mechanism to purge user data

### PCI-DSS (if handling payments)

1. **Cardholder data** - Ensure Stripe handles all card data (appears OK)
2. **Audit trails** - Good: Comprehensive audit logging present
3. **Access controls** - Needs improvement: Tenant isolation has gaps

---

## Recommendations by Priority

### Immediate (P0 - Next 48 hours)

1. **Resolve merge conflict** in `client/package.json`
2. **Remove JWT_SECRET default** - Fail fast if not set
3. **Fix CORS wildcard** in chatbot route
4. **Add stack trace sanitization** in error handler
5. **Deploy emergency patch** with these fixes

### Urgent (P1 - Next 7 days)

1. **Migrate token storage** from localStorage to HTTP-only cookies
2. **Add URL validation** for `window.open()` calls
3. **Implement CSP headers** on client
4. **Add CSRF protection** across all state-changing endpoints
5. **Strengthen password requirements** (complexity, length)
6. **Reduce JWT expiration** to 1-2 hours with refresh tokens
7. **Add rate limiting** per endpoint (especially auth)
8. **Fix Twilio schema** - Remove `.passthrough()`
9. **Add chatbot input validation**
10. **Commit package lockfiles** and remove from .gitignore

### Important (P2 - Next 2 weeks)

1. **Implement refresh token mechanism**
2. **Add token invalidation** on logout (blacklist/database)
3. **Extract tenant ID from JWT only** (not headers)
4. **Fix subscription minutes race condition** (use atomic operations)
5. **Add database indexes** for performance and security
6. **Implement Error Boundaries** in React
7. **Add comprehensive security tests**
8. **Implement input sanitization** across all forms
9. **Add API timeouts** to prevent hanging requests
10. **Standardize error responses**

### Nice to Have (P3 - Next 30 days)

1. **Field-level encryption** for sensitive data
2. **Twilio replay protection** (nonce tracking)
3. **Data retention policies** and archival
4. **MFA support** for admin users
5. **Security headers** (HSTS, X-Frame-Options, etc.)
6. **Comprehensive logging strategy** (remove PII, structured logs)
7. **Secrets management** (HashiCorp Vault, AWS Secrets Manager)
8. **Performance monitoring** (APM integration)
9. **Automated security scanning** (SAST/DAST in CI/CD)
10. **Penetration testing** by security firm

---

## Security Testing Recommendations

### Automated Testing

1. **SAST** (Static Application Security Testing):
   - SonarQube or Semgrep
   - npm audit (fix no-lockfile issue first)
   - Snyk or Dependabot

2. **DAST** (Dynamic Application Security Testing):
   - OWASP ZAP
   - Burp Suite Professional

3. **Dependency Scanning**:
   ```bash
   npm audit --audit-level=moderate
   ```

### Manual Testing

1. **Authentication bypass attempts**
2. **Authorization testing** (tenant isolation)
3. **Input fuzzing** (SQL, XSS, command injection)
4. **CSRF token bypass**
5. **Rate limit bypass**
6. **Session management** (token fixation, theft)

---

## Conclusion

The Amunet Phone Center codebase demonstrates good architectural foundations with modern technologies (TypeScript, Prisma, React, Fastify). However, **critical security vulnerabilities** require immediate attention before production deployment.

### Risk Summary

- **Current State**: NOT production-ready
- **Timeline to Production-Ready**: 2-4 weeks with focused remediation
- **Recommended Actions**:
  1. Address all P0 issues immediately (48 hours)
  2. Complete P1 issues before any production deployment (7 days)
  3. Implement P2 issues for long-term security (2 weeks)

### Final Recommendation

**DO NOT DEPLOY** to production until at minimum:
- All P0 (Critical) issues are resolved
- All P1 (High) issues are addressed
- Security testing is performed
- Independent security review is conducted

---

## Appendix: Useful Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Fastify Security Best Practices](https://www.fastify.io/docs/latest/Reference/Recommendations/)
- [React Security Checklist](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Report Generated**: November 12, 2025
**Reviewer**: Claude (Automated Security Analysis)
**Next Review Recommended**: After P0/P1 remediation
