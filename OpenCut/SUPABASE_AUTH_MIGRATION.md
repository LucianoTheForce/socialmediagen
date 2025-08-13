# Supabase Auth Migration Guide

## Migration Status: 90% Complete ✅

### ✅ Completed Tasks

1. **Installed Supabase Client Libraries**
   - @supabase/supabase-js: ^2.55.0
   - @supabase/ssr: ^0.6.1

2. **Created Supabase Configuration Files**
   - [`/lib/supabase/client.ts`](OpenCut/apps/web/src/lib/supabase/client.ts) - Browser client
   - [`/lib/supabase/server.ts`](OpenCut/apps/web/src/lib/supabase/server.ts) - Server client with cookie management

3. **Updated AuthProvider Component**
   - [`/components/auth-provider.tsx`](OpenCut/apps/web/src/components/auth-provider.tsx) - Complete rewrite for Supabase
   - Implements Supabase session management
   - Handles OAuth redirects and session refresh

4. **Updated Authentication Hooks**
   - [`/hooks/auth/useLogin.ts`](OpenCut/apps/web/src/hooks/auth/useLogin.ts) - Google OAuth login
   - [`/hooks/auth/useSignUp.ts`](OpenCut/apps/web/src/hooks/auth/useSignUp.ts) - Google OAuth signup

5. **Created OAuth Callback Route**
   - [`/api/auth/callback/route.ts`](OpenCut/apps/web/src/app/api/auth/callback/route.ts) - Handles OAuth redirects

6. **Migrated All API Routes to Supabase Auth**
   - ✅ `/api/projects/route.ts`
   - ✅ `/api/media/route.ts`
   - ✅ `/api/projects/[projectId]/canvases/route.ts`
   - ✅ `/api/timelines/tracks/route.ts`
   - ✅ `/api/timelines/elements/route.ts`
   - ✅ `/api/ai/generations/route.ts`
   - ✅ `/api/ai/generations/[id]/status/route.ts`
   - ✅ `/api/ai/openai/text/route.ts`
   - ✅ `/api/ai/midjourney/image/route.ts`

7. **Updated Middleware**
   - [`/middleware.ts`](OpenCut/apps/web/src/middleware.ts) - Supabase session management

8. **Removed Better Auth Implementation**
   - Deleted `/lib/auth/` folder
   - Deleted `/api/auth/[...all]/route.ts`
   - Removed Better Auth dependency from package.json

9. **Updated Database Schema**
   - [`/lib/db/schema.ts`](OpenCut/apps/web/src/lib/db/schema.ts) - Removed Better Auth tables
   - Created migration script: [`drop-better-auth-tables.sql`](OpenCut/apps/web/drop-better-auth-tables.sql)

10. **Updated Environment Configuration**
    - [`.env.example`](OpenCut/apps/web/.env.example) - Added Supabase variables
    - [`/env.ts`](OpenCut/apps/web/src/env.ts) - Updated for Supabase

### 🔄 In Progress Tasks

**Configure Google OAuth in Supabase Dashboard**
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add OAuth credentials:
   - **Authorized JavaScript origins**: 
     ```
     https://[your-project].supabase.co
     http://localhost:3001
     ```
   - **Authorized redirect URIs**:
     ```
     https://[your-project].supabase.co/auth/v1/callback
     http://localhost:3001/api/auth/callback
     ```

### 📝 Pending Tasks

**Deploy to Production**
1. Configure environment variables in Vercel:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
   DATABASE_URL=[your-supabase-database-url]
   ```

2. Run database migration (after backup):
   ```sql
   -- Run drop-better-auth-tables.sql to remove old auth tables
   ```

3. Test OAuth flow in production

## Key Changes Summary

### Authentication Flow
- **Before**: Better Auth with custom session management
- **After**: Supabase Auth with built-in OAuth and session handling

### API Authentication Pattern
**Before:**
```typescript
const { user } = await auth.api.getSession({
  headers: await headers(),
});
```

**After:**
```typescript
const supabase = await createClient();
const { data: { user }, error } = await supabase.auth.getUser();
```

### Client-Side Authentication
**Before:**
```typescript
const session = useSession();
const { signIn } = useAuthClient();
```

**After:**
```typescript
const { user, session } = useAuth();
const supabase = createClient();
```

## Database Schema Changes

### Removed Tables
- `sessions` - Managed by Supabase internally
- `accounts` - Managed by Supabase internally  
- `verifications` - Managed by Supabase internally

### Kept Tables
- `users` - Synced with Supabase Auth, stores additional metadata

## Benefits of Migration

1. **Simplified Auth Management**: Supabase handles all authentication complexity
2. **Built-in OAuth**: No need for custom OAuth implementation
3. **Better Security**: Enterprise-grade authentication with RLS
4. **Dashboard Management**: Visual interface for managing users and providers
5. **Cost Efficiency**: Unified database and auth provider
6. **Real-time Capabilities**: Built-in real-time subscriptions for auth state

## Testing Checklist

- [ ] Local OAuth login flow
- [ ] Local OAuth signup flow
- [ ] Session persistence across page refreshes
- [ ] Protected API routes authorization
- [ ] Logout functionality
- [ ] Production OAuth flow
- [ ] Production session management

## Rollback Plan

If issues arise:
1. Restore Better Auth implementation from git history
2. Re-add Better Auth dependencies
3. Restore original database schema
4. Update environment variables

## Support Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [OAuth Setup Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)