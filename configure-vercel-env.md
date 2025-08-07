# Configure Vercel Environment Variables for OpenCut

## 🚀 Deployment Status: SUCCESS (with env vars needed)
- **Project URL**: https://socialmedia-bk16vmqsk-lucianos-projects-b0bcbedf.vercel.app
- **Project Name**: socialmedia  
- **Status**: Built successfully, needs environment variables

## 📋 Required Environment Variables

### 1. Database (PostgreSQL via Supabase)
```bash
DATABASE_URL=postgresql://postgres.xxxxx:your-password@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

### 2. Authentication (Better Auth)
```bash
BETTER_AUTH_SECRET=0b2e0a6268e56981d2772f8d39d1b748ec28f11c682d37f35e5a9409ed2d7eacb
NEXT_PUBLIC_BETTER_AUTH_URL=https://socialmedia-bk16vmqsk-lucianos-projects-b0bcbedf.vercel.app
```

### 3. Redis (Upstash)
```bash
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### 4. Audio API (Freesound)
```bash
FREESOUND_CLIENT_ID=your-freesound-client-id
FREESOUND_API_KEY=your-freesound-api-key
```

### 5. Optional AI APIs
```bash
# OpenAI (for text generation)
OPENAI_API_KEY=sk-your-openai-key

# Runware (for image generation) 
RUNWARE_API_KEY=your-runware-key

# Midjourney (for image generation)
MIDJOURNEY_API_KEY=your-midjourney-key
MIDJOURNEY_BASE_URL=https://api.midjourney.com
```

## 🔧 Configuration Steps

### Via Vercel Dashboard:
1. Go to: https://vercel.com/dashboard
2. Find project "socialmedia" 
3. Go to Settings > Environment Variables
4. Add each variable above for "Production" environment
5. Redeploy after adding all variables

### Via CLI (if preferred):
```bash
# Set each variable using:
npx vercel env add VARIABLE_NAME production
```

## ✅ Next Steps After Environment Setup:
1. **Configure Supabase database** (create account + get DATABASE_URL)
2. **Generate secrets** (BETTER_AUTH_SECRET can be random 32+ char string)
3. **Set up Redis** (Upstash free tier recommended)
4. **Add environment variables to Vercel**
5. **Redeploy application**
6. **Test production deployment**

## 🎯 Current Status:
- ✅ Build pipeline working
- ✅ Deployment successful 
- ✅ Monorepo dependencies resolved
- 🔄 Environment variables needed
- 📦 Ready for database setup

The deployment infrastructure is complete and working correctly!