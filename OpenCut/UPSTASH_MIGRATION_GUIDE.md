# 🚀 Upstash Migration Guide

## Overview

Migrating OpenCut from **Supabase PostgreSQL + Upstash Redis** to **Upstash PostgreSQL + Redis** for unified architecture.

## ✅ Benefits

- **🔧 Unified Management**: Single dashboard for PostgreSQL + Redis
- **🔑 Simplified Auth**: Same account, less configuration complexity  
- **🚀 Performance**: Both services in same network/region
- **💰 Cost Optimization**: Potential savings with unified billing
- **🛡️ Reduced Complexity**: Fewer failure points

## 📋 Migration Steps

### Step 1: Setup Upstash PostgreSQL

1. **Create Upstash Account** (if not already done)
   - Go to https://console.upstash.com/
   - Create new PostgreSQL database
   - Note the connection string format: `postgresql://username:password@region-pooler.aws.upstash.io:5432/database-name`

2. **Create Database Schema**
   ```bash
   # Run the migration script on your Upstash PostgreSQL
   psql "postgresql://username:password@region-pooler.aws.upstash.io:5432/database-name" -f upstash-migration.sql
   ```

### Step 2: Export Data from Supabase

```sql
-- Export users (run in Supabase SQL editor)
COPY (SELECT * FROM users) TO STDOUT WITH CSV HEADER;

-- Export accounts
COPY (SELECT * FROM accounts) TO STDOUT WITH CSV HEADER;

-- Export sessions  
COPY (SELECT * FROM sessions) TO STDOUT WITH CSV HEADER;

-- Export verifications
COPY (SELECT * FROM verifications) TO STDOUT WITH CSV HEADER;

-- Export waitlist
COPY (SELECT * FROM waitlist) TO STDOUT WITH CSV HEADER;
```

### Step 3: Import Data to Upstash

```sql
-- Import to Upstash PostgreSQL (adjust file paths)
\COPY users FROM 'users.csv' WITH CSV HEADER;
\COPY accounts FROM 'accounts.csv' WITH CSV HEADER;
\COPY sessions FROM 'sessions.csv' WITH CSV HEADER;
\COPY verifications FROM 'verifications.csv' WITH CSV HEADER;
\COPY waitlist FROM 'waitlist.csv' WITH CSV HEADER;
```

### Step 4: Update Environment Variables

**Local Development (`.env.local`):**
```env
# Replace Supabase connection with Upstash
DATABASE_URL="postgresql://username:password@region-pooler.aws.upstash.io:5432/database-name"

# Keep existing Redis configuration
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

**Production (Vercel):**
```bash
# Update DATABASE_URL in Vercel dashboard or via CLI
vercel env add DATABASE_URL
# Enter your Upstash PostgreSQL connection string
```

### Step 5: Test Migration

1. **Test Database Connection**
   ```bash
   cd OpenCut/apps/web
   npm run db:push
   ```

2. **Test Authentication**
   - Login/signup functionality
   - Session management
   - Rate limiting (if Redis configured)

3. **Test Carousel API**
   - Generate carousel
   - Verify no 500 errors
   - Check production logs

### Step 6: Deploy to Production

```bash
# Commit all changes
git add -A
git commit -m "Migrate to Upstash PostgreSQL for unified architecture"

# Deploy to Vercel
vercel --prod
```

## 🔧 Configuration Updates

### Better Auth Changes

- ✅ **Redis Optional**: System works without Redis (rate limiting disabled)
- ✅ **Fallback Handling**: Graceful degradation if Redis unavailable  
- ✅ **Error Logging**: Enhanced debugging for connection issues
- ✅ **Type Safety**: Proper TypeScript types for Redis parameters

### Database Changes

- ✅ **Schema Optimized**: Removed Supabase-specific RLS policies
- ✅ **Indexes Added**: Performance optimization for common queries
- ✅ **Foreign Keys**: Proper relationship constraints maintained

## 🚨 Rollback Plan

If issues occur during migration:

1. **Revert Environment Variables**
   ```bash
   # Restore original Supabase connection
   vercel env add DATABASE_URL
   # Enter original Supabase connection string
   ```

2. **Redeploy Previous Version**
   ```bash
   git revert HEAD
   vercel --prod
   ```

## 📊 Post-Migration Verification

### Database Health Check
- [ ] All tables created successfully
- [ ] Data imported without corruption
- [ ] Foreign key constraints working
- [ ] Indexes created for performance

### Application Health Check  
- [ ] User authentication working
- [ ] Session management functional
- [ ] Carousel generation working
- [ ] No 500 errors in production
- [ ] Redis rate limiting (if configured)

### Performance Monitoring
- [ ] Database query performance
- [ ] API response times
- [ ] Error rates in production
- [ ] Redis connection stability

## 🎯 Success Criteria

- ✅ Zero downtime migration
- ✅ All user data preserved
- ✅ Authentication system functional
- ✅ Carousel API working in production
- ✅ Unified Upstash architecture
- ✅ Improved error handling and logging

## 📞 Support

- **Upstash Docs**: https://docs.upstash.com/
- **Better Auth Docs**: https://www.better-auth.com/docs
- **Migration Issues**: Check production logs in Vercel dashboard

---

**Status**: Ready for migration  
**Estimated Time**: 30-45 minutes  
**Risk Level**: Low (fallback plan available)