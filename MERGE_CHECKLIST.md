# Merge Checklist: JWT Authentication & Route Protection

## ⚠️ BREAKING CHANGES - Action Required Before Merge

### 1. Environment Variable Required
**Action:** Add `JWT_SECRET` to your `.env` file before deploying

```bash
# In your .env file, add:
JWT_SECRET=your-super-secret-key-minimum-32-characters-long-change-in-production
```

**Impact if missing:** 
- ✅ Won't break - has default value for development
- ⚠️ **MUST** be set in production with a strong secret (32+ chars)

### 2. Existing Users Need to Re-login
**Impact:** Users currently logged in will need to log in again after merge

**Why:** 
- Old sessions don't have JWT tokens
- Protected routes now require valid JWT tokens
- Users will be redirected to login page automatically

**Mitigation:** 
- This is expected behavior - improves security
- Users will get a token on next login
- No data loss - all user data remains intact

### 3. DashboardHome.tsx Still Uses Old Pattern
**Location:** `client/src/pages/DashboardHome.tsx`

**Issue:** Still uses `axios` directly instead of `api` instance

**Impact:** 
- ⚠️ **WILL BREAK** - Backend now requires JWT auth, not tenant headers
- Currently passes `x-tenant-id` header manually
- Won't have `Authorization: Bearer <token>` header

**Fix Required:** Update DashboardHome to use `api` instance instead of `axios`

### 4. Dependencies
**Action:** Run `npm install` after merge

**New dependencies:**
- ✅ `@fastify/jwt` - Already in package.json
- ✅ No new client dependencies

## ✅ Safe to Merge

### What Won't Break:
- ✅ Login/Signup flows - Already updated
- ✅ API client - Already uses tokens
- ✅ Protected routes - Already implemented
- ✅ Database schema - No changes
- ✅ Public routes (Twilio webhooks, contact) - Still work
- ✅ Environment variables - JWT_SECRET has default

### Migration Path:
1. Merge the branch
2. Add `JWT_SECRET` to `.env` files (dev, staging, production)
3. Deploy
4. Users will be prompted to log in again (automatic redirect)
5. After login, everything works normally

## 🔧 Post-Merge Tasks

1. **Fix DashboardHome.tsx** (Critical)
   ```typescript
   // Change from:
   const { tenant, axios } = useOutletContext<DashboardContext>();
   const response = await axios.get('/api/dashboard/overview', {
     headers: { 'x-tenant-id': tenant?.tenantId }
   });
   
   // To:
   import api from '../lib/api';
   const response = await api.get('/api/dashboard/overview');
   ```

2. **Update .env files** with JWT_SECRET
3. **Test login flow** after deployment
4. **Monitor for 401 errors** in first hour after deploy

## 📝 Summary

**Can merge?** ✅ Yes, but fix DashboardHome.tsx first or it will break dashboard overview

**Will break app?** ⚠️ Partially - DashboardHome will fail until fixed

**User impact:** Users need to re-login (automatic, no data loss)

**Security improvement:** ✅ Major - Routes now properly protected

