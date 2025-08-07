# Enhanced Authentication System Design

## Overview
Extended user authentication and management system built on OpenCut's existing Better Auth foundation, enhanced for AI-powered social media content generation with advanced user profiles, API key management, subscription billing, and team collaboration.

## Current OpenCut Authentication Foundation

### Existing Setup
- **Better Auth**: Production-ready authentication with email/password
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Redis-based with Upstash
- **Rate Limiting**: Redis-backed rate limiting
- **Security**: Row Level Security (RLS) enabled

### Current Schema
```typescript
// From OpenCut/packages/db/src/schema.ts
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
}).enableRLS();

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  // ... other session fields
}).enableRLS();
```

## Enhanced Authentication Architecture

### 1. Extended User Profile System

#### User Profile Extensions
```typescript
// Extended user profile for social media content generation
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  
  // Business Information
  businessName: text("business_name"),
  industry: text("industry"),
  website: text("website"),
  description: text("description"),
  
  // Brand Voice & Preferences
  brandVoice: json("brand_voice").$type<BrandVoice>(),
  defaultTone: text("default_tone").$type<ToneOfVoice>().default("friendly"),
  targetAudience: json("target_audience").$type<TargetAudience>(),
  
  // Preferences
  preferredFormats: json("preferred_formats").$type<SocialFormat[]>().default([]),
  autoApplyAI: boolean("auto_apply_ai").default(false),
  languagePreference: text("language_preference").default("en"),
  
  // Usage tracking
  totalProjects: integer("total_projects").default(0),
  totalGenerations: integer("total_generations").default(0),
  lastActiveAt: timestamp("last_active_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}).enableRLS();

interface BrandVoice {
  tone: ToneOfVoice;
  personality: string[];
  keywords: string[];
  avoidWords: string[];
  sampleTexts: string[];
}

interface TargetAudience {
  demographics: {
    ageRange: string;
    gender: string;
    location: string;
  };
  interests: string[];
  behaviors: string[];
  painPoints: string[];
}
```

#### API Key Management
```typescript
export const userApiKeys = pgTable("user_api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  service: text("service").$type<AIService>().notNull(), // 'runware', 'openai', 'anthropic'
  keyName: text("key_name").notNull(), // User-friendly name
  encryptedKey: text("encrypted_key").notNull(),
  keyHash: text("key_hash").notNull(), // For validation without decryption
  
  // Usage limits and tracking
  monthlyLimit: integer("monthly_limit"), // Custom limits
  currentUsage: integer("current_usage").default(0),
  lastUsedAt: timestamp("last_used_at"),
  
  // Permissions
  permissions: json("permissions").$type<APIKeyPermissions>().default({}),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userServiceIdx: uniqueIndex("user_service_idx").on(table.userId, table.service),
})).enableRLS();

type AIService = 'runware' | 'openai' | 'anthropic';

interface APIKeyPermissions {
  textGeneration: boolean;
  imageGeneration: boolean;
  backgroundRemoval: boolean;
  upscaling: boolean;
  maxRequestsPerHour: number;
}
```

### 2. Subscription and Billing System

#### Subscription Plans
```typescript
export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  
  // Pricing
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }),
  priceYearly: decimal("price_yearly", { precision: 10, scale: 2 }),
  
  // Limits
  maxProjects: integer("max_projects").default(-1), // -1 = unlimited
  maxGenerationsPerMonth: integer("max_generations_per_month").default(-1),
  maxTemplates: integer("max_templates").default(-1),
  maxTeamMembers: integer("max_team_members").default(1),
  
  // Features
  features: json("features").$type<PlanFeatures>().notNull(),
  
  // Status
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

interface PlanFeatures {
  aiTextGeneration: boolean;
  aiImageGeneration: boolean;
  templateLibrary: boolean;
  customTemplates: boolean;
  multiCanvasExport: boolean;
  teamCollaboration: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  apiAccess: boolean;
}
```

#### User Subscriptions
```typescript
export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => subscriptionPlans.id),
  
  // Billing
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").$type<SubscriptionStatus>().notNull(),
  
  // Billing cycle
  billingCycle: text("billing_cycle").$type<BillingCycle>().notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  
  // Usage tracking
  currentUsage: json("current_usage").$type<UsageMetrics>().default({}),
  
  // Trial
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}).enableRLS();

type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid';
type BillingCycle = 'monthly' | 'yearly';

interface UsageMetrics {
  projectsCreated: number;
  textGenerations: number;
  imageGenerations: number;
  exportsCompleted: number;
  templatesCreated: number;
  resetDate: string; // ISO date string
}
```

### 3. Team Collaboration System

#### Teams
```typescript
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  
  // Owner
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  // Settings
  settings: json("settings").$type<TeamSettings>().default({}),
  
  // Billing
  subscriptionId: uuid("subscription_id")
    .references(() => userSubscriptions.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}).enableRLS();

interface TeamSettings {
  allowMemberInvites: boolean;
  defaultProjectPermissions: ProjectPermission[];
  brandGuidelines: BrandGuidelines;
}

interface BrandGuidelines {
  colors: string[];
  fonts: string[];
  logoUrl: string;
  guidelines: string;
}
```

#### Team Members
```typescript
export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  role: text("role").$type<TeamRole>().notNull(),
  permissions: json("permissions").$type<TeamPermissions>().notNull(),
  
  // Status
  status: text("status").$type<MemberStatus>().default("active"),
  invitedBy: text("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at"),
  joinedAt: timestamp("joined_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  teamUserIdx: uniqueIndex("team_user_idx").on(table.teamId, table.userId),
})).enableRLS();

type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';
type MemberStatus = 'pending' | 'active' | 'suspended';

interface TeamPermissions {
  canCreateProjects: boolean;
  canEditProjects: boolean;
  canDeleteProjects: boolean;
  canManageTemplates: boolean;
  canInviteMembers: boolean;
  canManageTeam: boolean;
  canAccessAnalytics: boolean;
}
```

### 4. Usage Tracking and Analytics

#### Usage Logs
```typescript
export const usageLogs = pgTable("usage_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  teamId: uuid("team_id").references(() => teams.id),
  
  // Event details
  eventType: text("event_type").$type<UsageEventType>().notNull(),
  resource: text("resource").notNull(), // project_id, template_id, etc.
  
  // AI usage specific
  aiService: text("ai_service").$type<AIService>(),
  tokensUsed: integer("tokens_used"),
  cost: decimal("cost", { precision: 10, scale: 6 }),
  
  // Metadata
  metadata: json("metadata"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userDateIdx: index("usage_user_date_idx").on(table.userId, table.createdAt),
  teamDateIdx: index("usage_team_date_idx").on(table.teamId, table.createdAt),
})).enableRLS();

type UsageEventType = 
  | 'project_created' | 'project_exported' 
  | 'text_generated' | 'image_generated' 
  | 'template_applied' | 'template_created'
  | 'user_login' | 'user_logout';
```

### 5. Enhanced Session Management

#### Extended Session Store
```typescript
// Extend Redis session storage for enhanced features
interface ExtendedSessionData {
  userId: string;
  email: string;
  teamId?: string;
  currentTeamRole?: TeamRole;
  subscriptionStatus: SubscriptionStatus;
  featureFlags: Record<string, boolean>;
  
  // AI service connection status
  connectedServices: {
    runware: boolean;
    openai: boolean;
    anthropic: boolean;
  };
  
  // User preferences cache
  preferences: {
    defaultFormats: SocialFormat[];
    autoApplyAI: boolean;
    theme: 'light' | 'dark';
  };
  
  // Rate limiting context
  rateLimits: {
    textGeneration: number;
    imageGeneration: number;
    exports: number;
  };
}

class EnhancedSessionManager {
  private redis: Redis;
  
  async createSession(userId: string, data: Partial<ExtendedSessionData>): Promise<string> {
    const sessionId = generateSessionId();
    const sessionData: ExtendedSessionData = {
      userId,
      email: await this.getUserEmail(userId),
      subscriptionStatus: await this.getSubscriptionStatus(userId),
      featureFlags: await this.getFeatureFlags(userId),
      connectedServices: await this.getConnectedServices(userId),
      preferences: await this.getUserPreferences(userId),
      rateLimits: await this.getCurrentRateLimits(userId),
      ...data,
    };
    
    await this.redis.setex(
      `session:${sessionId}`,
      24 * 60 * 60, // 24 hours
      JSON.stringify(sessionData)
    );
    
    return sessionId;
  }
  
  async updateSessionData(sessionId: string, updates: Partial<ExtendedSessionData>): Promise<void> {
    const existing = await this.getSession(sessionId);
    if (!existing) return;
    
    const updated = { ...existing, ...updates };
    await this.redis.setex(
      `session:${sessionId}`,
      24 * 60 * 60,
      JSON.stringify(updated)
    );
  }
  
  async getSession(sessionId: string): Promise<ExtendedSessionData | null> {
    const data = await this.redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }
}
```

### 6. Authentication Middleware Extensions

#### Enhanced Auth Guard
```typescript
interface AuthContext {
  user: User;
  session: ExtendedSessionData;
  team?: Team;
  subscription: UserSubscription;
  permissions: UserPermissions;
}

interface UserPermissions {
  canCreateProjects: boolean;
  canUseAI: boolean;
  canAccessTemplates: boolean;
  canInviteMembers: boolean;
  remainingGenerations: number;
  remainingProjects: number;
}

class EnhancedAuthGuard {
  async validateSession(sessionId: string): Promise<AuthContext | null> {
    const session = await this.sessionManager.getSession(sessionId);
    if (!session) return null;
    
    const user = await this.getUser(session.userId);
    const subscription = await this.getSubscription(session.userId);
    const team = session.teamId ? await this.getTeam(session.teamId) : null;
    
    const permissions = await this.calculatePermissions(user, subscription, team);
    
    return {
      user,
      session,
      team,
      subscription,
      permissions,
    };
  }
  
  async requireFeature(feature: keyof PlanFeatures, context: AuthContext): Promise<boolean> {
    const plan = await this.getSubscriptionPlan(context.subscription.planId);
    return plan.features[feature];
  }
  
  async requireUsageLimit(
    limitType: keyof UsageMetrics, 
    context: AuthContext
  ): Promise<boolean> {
    const usage = context.subscription.currentUsage;
    const plan = await this.getSubscriptionPlan(context.subscription.planId);
    
    switch (limitType) {
      case 'textGenerations':
        return usage.textGenerations < plan.maxGenerationsPerMonth;
      case 'projectsCreated':
        return usage.projectsCreated < plan.maxProjects;
      default:
        return true;
    }
  }
}
```

### 7. API Key Encryption Service

#### Secure Key Management
```typescript
class APIKeyManager {
  private encryptionKey: string;
  
  constructor() {
    this.encryptionKey = process.env.API_KEY_ENCRYPTION_SECRET!;
  }
  
  async storeAPIKey(
    userId: string, 
    service: AIService, 
    keyName: string, 
    apiKey: string
  ): Promise<string> {
    // Encrypt the API key
    const encryptedKey = await this.encrypt(apiKey);
    const keyHash = await this.hash(apiKey);
    
    const keyRecord = await db.insert(userApiKeys).values({
      userId,
      service,
      keyName,
      encryptedKey,
      keyHash,
      permissions: this.getDefaultPermissions(service),
    }).returning();
    
    // Test the key validity
    await this.validateAPIKey(service, apiKey);
    
    return keyRecord[0].id;
  }
  
  async getAPIKey(userId: string, service: AIService): Promise<string | null> {
    const keyRecord = await db.query.userApiKeys.findFirst({
      where: and(
        eq(userApiKeys.userId, userId),
        eq(userApiKeys.service, service),
        eq(userApiKeys.isActive, true)
      ),
    });
    
    if (!keyRecord) return null;
    
    return this.decrypt(keyRecord.encryptedKey);
  }
  
  private async encrypt(text: string): Promise<string> {
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
  
  private async decrypt(encryptedText: string): Promise<string> {
    const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  
  private async validateAPIKey(service: AIService, apiKey: string): Promise<boolean> {
    switch (service) {
      case 'runware':
        return this.validateRunwareKey(apiKey);
      case 'openai':
        return this.validateOpenAIKey(apiKey);
      default:
        return false;
    }
  }
  
  private async validateRunwareKey(apiKey: string): Promise<boolean> {
    try {
      // Test connection to Runware API
      const ws = new WebSocket('wss://ws-api.runware.ai/v1', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      return new Promise((resolve) => {
        ws.on('open', () => {
          ws.close();
          resolve(true);
        });
        ws.on('error', () => resolve(false));
      });
    } catch {
      return false;
    }
  }
}
```

### 8. User Onboarding Flow

#### Onboarding State Management
```typescript
export const userOnboarding = pgTable("user_onboarding", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  
  // Onboarding progress
  currentStep: integer("current_step").default(1),
  completedSteps: json("completed_steps").$type<OnboardingStep[]>().default([]),
  
  // Collected data during onboarding
  businessInfo: json("business_info").$type<BusinessInfo>(),
  goals: json("goals").$type<string[]>().default([]),
  experienceLevel: text("experience_level").$type<ExperienceLevel>(),
  
  // Status
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}).enableRLS();

type OnboardingStep = 
  | 'welcome' 
  | 'business_info' 
  | 'goals_selection' 
  | 'api_keys_setup' 
  | 'first_project' 
  | 'template_selection'
  | 'ai_generation_demo'
  | 'export_demo'
  | 'completed';

type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

interface BusinessInfo {
  name: string;
  industry: string;
  size: string;
  website?: string;
  socialMediaPresence: string[];
}
```

### 9. Security Enhancements

#### Advanced Rate Limiting
```typescript
class AdvancedRateLimiter {
  private redis: Redis;
  
  async checkRateLimit(
    userId: string, 
    action: string, 
    limit: number, 
    window: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `rate_limit:${userId}:${action}`;
    const now = Date.now();
    const windowStart = now - window * 1000;
    
    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests
    const current = await this.redis.zcard(key);
    
    if (current >= limit) {
      const oldestRequest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetTime = oldestRequest.length > 0 
        ? parseInt(oldestRequest[1]) + window * 1000 
        : now + window * 1000;
      
      return {
        allowed: false,
        remaining: 0,
        resetTime,
      };
    }
    
    // Add current request
    await this.redis.zadd(key, now, `${now}-${Math.random()}`);
    await this.redis.expire(key, window);
    
    return {
      allowed: true,
      remaining: limit - current - 1,
      resetTime: now + window * 1000,
    };
  }
}
```

#### Security Audit Logs
```typescript
export const securityLogs = pgTable("security_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id),
  
  // Event details
  eventType: text("event_type").$type<SecurityEventType>().notNull(),
  severity: text("severity").$type<SecuritySeverity>().notNull(),
  description: text("description").notNull(),
  
  // Context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  location: text("location"),
  
  // Additional data
  metadata: json("metadata"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userDateIdx: index("security_user_date_idx").on(table.userId, table.createdAt),
  severityIdx: index("security_severity_idx").on(table.severity),
}));

type SecurityEventType = 
  | 'login_success' | 'login_failure' 
  | 'password_change' | 'email_change'
  | 'api_key_created' | 'api_key_deleted'
  | 'suspicious_activity' | 'account_locked';

type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';
```

## Implementation Strategy

### Phase 1: Core Extensions (Week 1)
- Extend user profiles with business information
- Implement API key management with encryption
- Set up enhanced session management

### Phase 2: Subscription System (Week 2)
- Create subscription plans and billing integration
- Implement usage tracking and limits
- Set up Stripe webhook handlers

### Phase 3: Team Collaboration (Week 3)
- Build team management system
- Implement role-based permissions
- Create team invitation flow

### Phase 4: Security & Analytics (Week 4)
- Enhanced rate limiting and security logs
- Usage analytics and reporting
- Advanced audit trails

### Phase 5: Onboarding & UX (Week 5)
- User onboarding flow
- Profile completion workflows
- Settings management UI

## Security Considerations

- **API Key Encryption**: AES-256-GCM encryption for all stored API keys
- **Rate Limiting**: Advanced Redis-based rate limiting per user/feature
- **Audit Logging**: Comprehensive security event logging
- **Session Security**: Enhanced session data with feature flags
- **Permission System**: Granular role-based access control
- **Data Privacy**: GDPR-compliant user data management

## Performance Optimizations

- **Redis Caching**: Session data, user preferences, rate limits
- **Database Indexing**: Optimized queries for user lookups
- **Lazy Loading**: Profile data loaded on demand
- **Connection Pooling**: Efficient database connections
- **API Key Caching**: Decrypted keys cached temporarily

## Success Metrics

- **Authentication Speed**: < 100ms for session validation
- **API Key Security**: Zero key exposure incidents
- **User Onboarding**: 80%+ completion rate
- **Subscription Conversion**: 15%+ trial to paid conversion
- **Team Adoption**: 30%+ of users create teams
- **Session Security**: 99.9%+ session integrity