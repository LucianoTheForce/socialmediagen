# AI Text Generation Integration Plan

## Overview
Comprehensive AI text generation system for dynamic caption, hashtag, and overlay text creation tailored to different social media platforms, integrated with OpenCut's existing timeline and text editing capabilities.

## Technical Stack

### AI Services
- **Primary**: OpenAI GPT-4 API
- **Alternative**: Anthropic Claude API (fallback)
- **Local Processing**: OpenAI tiktoken for token counting

### Integration Points
- **OpenCut Timeline**: [`timeline-store.ts`](OpenCut/apps/web/src/stores/timeline-store.ts:1)
- **Text Elements**: [`updateTextElement()`](OpenCut/apps/web/src/stores/timeline-store.ts:847)
- **Project Context**: [`project-store.ts`](OpenCut/apps/web/src/stores/project-store.ts:1)

## AI Text Generation Architecture

### 1. AI Text Store (`ai-text-store.ts`)

```typescript
interface AITextStore {
  // Generation state
  isGenerating: boolean
  generationQueue: TextGenerationTask[]
  generatedSuggestions: Map<string, TextSuggestion[]>
  
  // Platform-specific generation
  generateCaption: (context: GenerationContext) => Promise<string[]>
  generateHashtags: (content: string, platform: SocialPlatform) => Promise<string[]>
  generateCTA: (business: BusinessContext, platform: SocialPlatform) => Promise<string[]>
  generateHeadline: (topic: string, style: HeadlineStyle) => Promise<string[]>
  
  // Template-based generation
  generateFromTemplate: (template: TextTemplate, variables: Record<string, any>) => Promise<string>
  enhanceExistingText: (text: string, enhancement: TextEnhancement) => Promise<string>
  
  // Batch operations
  generateMultiPlatform: (context: GenerationContext, platforms: SocialPlatform[]) => Promise<Map<SocialPlatform, TextSuggestion[]>>
  
  // Optimization
  optimizeForPlatform: (text: string, platform: SocialPlatform) => Promise<string>
  checkCharacterLimits: (text: string, platform: SocialPlatform) => ValidationResult
  
  // Context management
  setBusinessContext: (context: BusinessContext) => void
  setToneOfVoice: (tone: ToneOfVoice) => void
  setTargetAudience: (audience: TargetAudience) => void
}
```

### 2. Generation Context System

```typescript
interface GenerationContext {
  // Business context
  businessName?: string
  industry?: string
  brandVoice?: BrandVoice
  targetAudience?: TargetAudience
  
  // Content context
  visualDescription?: string // AI-generated from Runware images
  contentType?: ContentType
  occasion?: string // holiday, event, season
  
  // Platform requirements
  platform: SocialPlatform
  maxLength?: number
  includeHashtags?: boolean
  includeCTA?: boolean
  
  // Style preferences
  tone?: ToneOfVoice
  language?: string
  emoji?: EmojiStyle
}

enum SocialPlatform {
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  FACEBOOK = 'facebook',
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
  YOUTUBE = 'youtube'
}

enum ToneOfVoice {
  PROFESSIONAL = 'professional',
  CASUAL = 'casual',
  FRIENDLY = 'friendly',
  AUTHORITATIVE = 'authoritative',
  PLAYFUL = 'playful',
  INSPIRATIONAL = 'inspirational',
  EDUCATIONAL = 'educational'
}

enum ContentType {
  PROMOTIONAL = 'promotional',
  EDUCATIONAL = 'educational',
  ENTERTAINING = 'entertaining',
  INSPIRATIONAL = 'inspirational',
  NEWS = 'news',
  BEHIND_SCENES = 'behind_scenes',
  USER_GENERATED = 'user_generated'
}
```

### 3. Platform-Specific Text Optimization

```typescript
interface PlatformTextConfig {
  platform: SocialPlatform
  maxCaptionLength: number
  maxHashtags: number
  hashtagStyle: 'inline' | 'separate' | 'both'
  commonPatterns: string[]
  engagementTriggers: string[]
  restrictions: string[]
}

const PLATFORM_CONFIGS: Record<SocialPlatform, PlatformTextConfig> = {
  [SocialPlatform.INSTAGRAM]: {
    platform: SocialPlatform.INSTAGRAM,
    maxCaptionLength: 2200,
    maxHashtags: 30,
    hashtagStyle: 'separate',
    commonPatterns: ['✨', '💫', '🌟'],
    engagementTriggers: ['Double tap if', 'Tag someone who', 'Share in your stories'],
    restrictions: ['No excessive caps', 'Avoid spam words']
  },
  [SocialPlatform.TIKTOK]: {
    platform: SocialPlatform.TIKTOK,
    maxCaptionLength: 300,
    maxHashtags: 5,
    hashtagStyle: 'inline',
    commonPatterns: ['POV:', 'When you', 'How to'],
    engagementTriggers: ['Duet this', 'Try this', 'What do you think?'],
    restrictions: ['Keep it short', 'Use trending sounds reference']
  },
  [SocialPlatform.LINKEDIN]: {
    platform: SocialPlatform.LINKEDIN,
    maxCaptionLength: 3000,
    maxHashtags: 5,
    hashtagStyle: 'separate',
    commonPatterns: ['Key insight:', 'Lessons learned:', 'Industry update:'],
    engagementTriggers: ['What are your thoughts?', 'Have you experienced this?', 'Share your experience'],
    restrictions: ['Professional tone', 'No excessive emojis']
  }
  // ... other platforms
}
```

### 4. AI Prompt Templates

```typescript
interface PromptTemplate {
  id: string
  name: string
  category: PromptCategory
  template: string
  variables: string[]
  platforms: SocialPlatform[]
  examples?: string[]
}

enum PromptCategory {
  CAPTION = 'caption',
  HASHTAGS = 'hashtags',
  CTA = 'cta',
  HEADLINE = 'headline',
  DESCRIPTION = 'description'
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'instagram_caption_promotional',
    name: 'Instagram Promotional Caption',
    category: PromptCategory.CAPTION,
    template: `Create an engaging Instagram caption for a {{businessType}} business promoting {{productService}}. 
    
Context:
- Brand voice: {{brandVoice}}
- Target audience: {{targetAudience}}
- Visual description: {{visualDescription}}
- Tone: {{tone}}

Requirements:
- Maximum 200 words
- Include relevant emojis
- Add a clear call-to-action
- Make it engaging and authentic
- End with line breaks for hashtags

Generate 3 variations with different approaches.`,
    variables: ['businessType', 'productService', 'brandVoice', 'targetAudience', 'visualDescription', 'tone'],
    platforms: [SocialPlatform.INSTAGRAM]
  },
  
  {
    id: 'multi_platform_hashtags',
    name: 'Platform-Specific Hashtags',
    category: PromptCategory.HASHTAGS,
    template: `Generate optimized hashtags for {{platform}} based on this content:

Content: {{contentDescription}}
Industry: {{industry}}
Target audience: {{targetAudience}}

Requirements for {{platform}}:
- Maximum {{maxHashtags}} hashtags
- Mix of popular and niche hashtags
- Include branded hashtag if applicable: {{brandedHashtag}}
- Avoid banned or shadowbanned hashtags
- Focus on {{hashtagStrategy}} strategy

Return as a clean list separated by spaces.`,
    variables: ['platform', 'contentDescription', 'industry', 'targetAudience', 'maxHashtags', 'brandedHashtag', 'hashtagStrategy'],
    platforms: [SocialPlatform.INSTAGRAM, SocialPlatform.TIKTOK, SocialPlatform.LINKEDIN]
  }
]
```

### 5. OpenAI Service Integration

```typescript
class OpenAITextService {
  private client: OpenAI
  private rateLimiter: RateLimiter
  private cache: RedisCache
  
  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
    this.rateLimiter = new RateLimiter({ requestsPerMinute: 60 })
    this.cache = new RedisCache({ ttl: 3600 }) // 1 hour cache
  }
  
  async generateText(prompt: string, options: GenerationOptions): Promise<string[]> {
    // Check cache first
    const cacheKey = this.generateCacheKey(prompt, options)
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Rate limiting
    await this.rateLimiter.acquire()
    
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-effective for text generation
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt(options.platform, options.tone)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options.creativity || 0.7,
        max_tokens: options.maxTokens || 500,
        n: options.variations || 3
      })
      
      const results = response.choices.map(choice => choice.message.content?.trim() || '')
      
      // Cache results
      await this.cache.set(cacheKey, results)
      
      return results
    } catch (error) {
      console.error('OpenAI text generation error:', error)
      throw new Error('Failed to generate text')
    }
  }
  
  private buildSystemPrompt(platform: SocialPlatform, tone: ToneOfVoice): string {
    const platformConfig = PLATFORM_CONFIGS[platform]
    
    return `You are an expert social media content creator specializing in ${platform}. 
    
Your expertise includes:
- Platform-specific best practices and character limits
- Engagement optimization techniques
- Hashtag research and strategy
- Brand voice consistency
- Current trends and viral content patterns

Always follow these platform guidelines:
- Maximum caption length: ${platformConfig.maxCaptionLength} characters
- Maximum hashtags: ${platformConfig.maxHashtags}
- Hashtag style: ${platformConfig.hashtagStyle}
- Common engagement patterns: ${platformConfig.commonPatterns.join(', ')}

Tone of voice: ${tone}

Generate content that is authentic, engaging, and optimized for ${platform} algorithm.`
  }
  
  async generateCaptions(context: GenerationContext): Promise<string[]> {
    const template = this.selectTemplate(PromptCategory.CAPTION, context.platform)
    const prompt = this.fillTemplate(template, context)
    
    return this.generateText(prompt, {
      platform: context.platform,
      tone: context.tone || ToneOfVoice.FRIENDLY,
      creativity: 0.8,
      variations: 3
    })
  }
  
  async generateHashtags(content: string, platform: SocialPlatform): Promise<string[]> {
    const template = this.selectTemplate(PromptCategory.HASHTAGS, platform)
    const context = { contentDescription: content, platform }
    const prompt = this.fillTemplate(template, context)
    
    const response = await this.generateText(prompt, {
      platform,
      tone: ToneOfVoice.PROFESSIONAL,
      creativity: 0.6,
      variations: 1
    })
    
    // Parse hashtags from response
    return this.parseHashtags(response[0], platform)
  }
  
  private parseHashtags(text: string, platform: SocialPlatform): string[] {
    const maxHashtags = PLATFORM_CONFIGS[platform].maxHashtags
    const hashtags = text.match(/#[\w]+/g) || []
    return hashtags.slice(0, maxHashtags)
  }
}
```

### 6. Integration with OpenCut Timeline

```typescript
// Extend timeline store for AI text integration
interface TimelineStoreExtended extends TimelineStore {
  // AI text generation
  generateTextForElement: (trackId: string, elementId: string, context: GenerationContext) => Promise<void>
  applySuggestedText: (trackId: string, elementId: string, suggestion: string) => void
  
  // Batch text generation
  generateAllTextElements: (context: GenerationContext) => Promise<void>
  
  // Text optimization
  optimizeTextForPlatform: (trackId: string, elementId: string, platform: SocialPlatform) => Promise<void>
}

// Implementation in timeline-store.ts extension
const useTimelineStoreExtended = create<TimelineStoreExtended>((set, get) => ({
  ...originalTimelineStore,
  
  generateTextForElement: async (trackId: string, elementId: string, context: GenerationContext) => {
    const { tracks } = get()
    const track = tracks.find(t => t.id === trackId)
    const element = track?.elements.find(e => e.id === elementId) as TextElement
    
    if (!element || element.type !== 'text') return
    
    // Generate text suggestions
    const aiTextStore = useAITextStore.getState()
    const suggestions = await aiTextStore.generateCaption(context)
    
    // Store suggestions for user selection
    aiTextStore.generatedSuggestions.set(elementId, suggestions.map(text => ({
      id: generateId(),
      text,
      platform: context.platform,
      confidence: 0.8
    })))
    
    // Automatically apply first suggestion if auto-apply is enabled
    if (context.autoApply) {
      get().updateTextElement(trackId, elementId, { content: suggestions[0] })
    }
  },
  
  generateAllTextElements: async (context: GenerationContext) => {
    const { tracks } = get()
    
    for (const track of tracks) {
      for (const element of track.elements) {
        if (element.type === 'text') {
          await get().generateTextForElement(track.id, element.id, context)
        }
      }
    }
  }
}))
```

### 7. User Interface Components

#### AI Text Generation Panel
```typescript
interface AITextPanelProps {
  elementId?: string
  trackId?: string
  context: GenerationContext
}

const AITextGenerationPanel: React.FC<AITextPanelProps> = ({ elementId, trackId, context }) => {
  const [suggestions, setSuggestions] = useState<TextSuggestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([])
  
  const generateText = async () => {
    setIsGenerating(true)
    try {
      const results = await aiTextStore.generateMultiPlatform(context, selectedPlatforms)
      setSuggestions(Array.from(results.values()).flat())
    } finally {
      setIsGenerating(false)
    }
  }
  
  return (
    <div className="ai-text-panel">
      <div className="generation-controls">
        <PlatformSelector 
          selected={selectedPlatforms}
          onChange={setSelectedPlatforms}
        />
        
        <ContextForm 
          context={context}
          onChange={setContext}
        />
        
        <Button 
          onClick={generateText}
          loading={isGenerating}
          disabled={selectedPlatforms.length === 0}
        >
          Generate Text
        </Button>
      </div>
      
      <div className="suggestions-list">
        {suggestions.map(suggestion => (
          <TextSuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onApply={() => applySuggestion(suggestion)}
            onEdit={() => editSuggestion(suggestion)}
          />
        ))}
      </div>
    </div>
  )
}
```

#### Context Configuration Panel
```typescript
const ContextConfigPanel: React.FC = () => {
  const [businessContext, setBusinessContext] = useState<BusinessContext>()
  const [brandVoice, setBrandVoice] = useState<BrandVoice>()
  
  return (
    <div className="context-config">
      <FormSection title="Business Information">
        <Input
          label="Business Name"
          value={businessContext?.name}
          onChange={(value) => setBusinessContext(prev => ({ ...prev, name: value }))}
        />
        
        <Select
          label="Industry"
          options={INDUSTRY_OPTIONS}
          value={businessContext?.industry}
          onChange={(value) => setBusinessContext(prev => ({ ...prev, industry: value }))}
        />
      </FormSection>
      
      <FormSection title="Brand Voice">
        <ToneSelector
          selected={brandVoice?.tone}
          onChange={(tone) => setBrandVoice(prev => ({ ...prev, tone }))}
        />
        
        <TextArea
          label="Brand Voice Description"
          placeholder="Describe your brand's personality and communication style..."
          value={brandVoice?.description}
          onChange={(value) => setBrandVoice(prev => ({ ...prev, description: value }))}
        />
      </FormSection>
    </div>
  )
}
```

### 8. Caching and Performance

#### Redis Caching Strategy
```typescript
interface TextGenerationCache {
  // Cache keys
  generateCacheKey(prompt: string, context: GenerationContext): string
  
  // Cache operations
  getCachedSuggestions(key: string): Promise<TextSuggestion[] | null>
  cacheSuggestions(key: string, suggestions: TextSuggestion[], ttl?: number): Promise<void>
  
  // Cache invalidation
  invalidateUserCache(userId: string): Promise<void>
  invalidatePlatformCache(platform: SocialPlatform): Promise<void>
}

class RedisTextCache implements TextGenerationCache {
  private redis: Redis
  private defaultTTL = 3600 // 1 hour
  
  generateCacheKey(prompt: string, context: GenerationContext): string {
    const hash = createHash('md5')
      .update(prompt)
      .update(JSON.stringify(context))
      .digest('hex')
    
    return `ai_text:${context.platform}:${hash}`
  }
  
  async getCachedSuggestions(key: string): Promise<TextSuggestion[] | null> {
    const cached = await this.redis.get(key)
    return cached ? JSON.parse(cached) : null
  }
  
  async cacheSuggestions(key: string, suggestions: TextSuggestion[], ttl = this.defaultTTL): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(suggestions))
  }
}
```

### 9. Cost Optimization

#### Token Management
```typescript
interface TokenManager {
  estimateTokens(prompt: string): number
  optimizePrompt(prompt: string, maxTokens: number): string
  trackUsage(userId: string, tokens: number, cost: number): Promise<void>
}

class OpenAITokenManager implements TokenManager {
  private encoder = encoding_for_model('gpt-4o-mini')
  
  estimateTokens(prompt: string): number {
    return this.encoder.encode(prompt).length
  }
  
  optimizePrompt(prompt: string, maxTokens: number): string {
    const tokens = this.estimateTokens(prompt)
    if (tokens <= maxTokens) return prompt
    
    // Truncate prompt intelligently
    const ratio = maxTokens / tokens
    const targetLength = Math.floor(prompt.length * ratio * 0.9) // 10% buffer
    
    return prompt.substring(0, targetLength) + '...'
  }
  
  async trackUsage(userId: string, tokens: number, cost: number): Promise<void> {
    // Track usage in database for billing and analytics
    await db.insert(aiUsage).values({
      userId,
      service: 'openai_text',
      tokens,
      cost,
      timestamp: new Date()
    })
  }
}
```

### 10. Quality Assurance

#### Content Filtering
```typescript
interface ContentFilter {
  checkContent(text: string): Promise<ContentValidation>
  filterInappropriate(suggestions: string[]): Promise<string[]>
  validatePlatformCompliance(text: string, platform: SocialPlatform): ValidationResult
}

interface ContentValidation {
  isAppropriate: boolean
  issues: string[]
  suggestions?: string[]
  confidence: number
}

class AIContentFilter implements ContentFilter {
  async checkContent(text: string): Promise<ContentValidation> {
    // Use OpenAI moderation API
    const moderation = await openai.moderations.create({ input: text })
    const result = moderation.results[0]
    
    return {
      isAppropriate: !result.flagged,
      issues: Object.keys(result.categories).filter(cat => result.categories[cat]),
      confidence: Math.max(...Object.values(result.category_scores))
    }
  }
  
  async filterInappropriate(suggestions: string[]): Promise<string[]> {
    const filtered = []
    
    for (const suggestion of suggestions) {
      const validation = await this.checkContent(suggestion)
      if (validation.isAppropriate) {
        filtered.push(suggestion)
      }
    }
    
    return filtered
  }
}
```

## Implementation Timeline

### Phase 1: Core AI Text Service (Week 1-2)
- Set up OpenAI API integration
- Implement basic text generation service
- Create prompt templates for major platforms
- Build caching layer

### Phase 2: Timeline Integration (Week 2-3)
- Extend timeline store with AI text capabilities
- Implement text suggestion system
- Create UI components for text generation
- Add context management

### Phase 3: Platform Optimization (Week 3-4)
- Implement platform-specific optimizations
- Add character limit validation
- Create hashtag generation system
- Build multi-platform generation

### Phase 4: Advanced Features (Week 4-5)
- Add content filtering and moderation
- Implement usage tracking and cost optimization
- Create batch generation capabilities
- Add A/B testing for generated content

### Phase 5: Polish and Integration (Week 5-6)
- UI/UX improvements
- Performance optimizations
- Error handling and fallbacks
- Integration testing with full system

## Success Metrics

- **Generation Speed**: < 2 seconds for caption generation
- **Content Quality**: 85%+ user approval rate
- **Platform Compliance**: 98%+ content passes platform guidelines
- **Cost Efficiency**: < $0.05 per text generation
- **User Adoption**: 70%+ of users use AI text features
- **Cache Hit Rate**: > 40% for repeated generations