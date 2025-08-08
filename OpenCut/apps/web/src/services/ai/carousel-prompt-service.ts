interface CarouselTemplate {
  name: string;
  description: string;
  structure: string[];
  toneGuidelines: string;
  contentPatterns: string[];
}

interface CarouselPromptOptions {
  topic: string;
  slideCount: number;
  backgroundStrategy: 'unique' | 'thematic';
  tone: string;
  targetAudience: string;
  style: string;
  contentType: 'educational' | 'promotional' | 'inspirational' | 'storytelling' | 'tips';
}

interface SlideLayoutSuggestion {
  layoutType: 'text-focused' | 'image-overlay' | 'split-screen' | 'minimal' | 'bold-statement';
  textPlacement: 'top' | 'center' | 'bottom' | 'left' | 'right';
  fontSizeRecommendation: 'large' | 'medium' | 'small';
  colorScheme: 'high-contrast' | 'monochrome' | 'vibrant' | 'subtle';
  visualHierarchy: string[];
}

export class CarouselPromptService {
  private static templates: Record<string, CarouselTemplate> = {
    educational: {
      name: 'Educational Tips',
      description: 'Step-by-step learning content',
      structure: [
        'Hook slide with compelling question or statistic',
        'Problem identification slide',
        'Solution steps (3-5 slides)',
        'Implementation slide',
        'Call-to-action slide'
      ],
      toneGuidelines: 'Clear, authoritative, helpful, encouraging',
      contentPatterns: [
        'Use numbered lists for steps',
        'Include actionable takeaways',
        'Start with "How to" or "Why" questions',
        'End with clear next steps'
      ]
    },
    promotional: {
      name: 'Product/Service Promotion',
      description: 'Showcase benefits and drive conversion',
      structure: [
        'Problem statement or pain point',
        'Solution introduction',
        'Key benefits (2-3 slides)',
        'Social proof or testimonial',
        'Strong call-to-action'
      ],
      toneGuidelines: 'Persuasive, benefit-focused, urgent but not pushy',
      contentPatterns: [
        'Lead with customer pain points',
        'Focus on transformation outcomes',
        'Use power words and emotional triggers',
        'Include specific benefits, not just features'
      ]
    },
    inspirational: {
      name: 'Motivational Content',
      description: 'Inspire and motivate audience',
      structure: [
        'Relatable struggle or challenge',
        'Mindset shift or reframe',
        'Actionable inspiration (2-3 slides)',
        'Success story or example',
        'Empowering call-to-action'
      ],
      toneGuidelines: 'Uplifting, empathetic, empowering, authentic',
      contentPatterns: [
        'Use personal stories or relatable scenarios',
        'Include motivational quotes or mantras',
        'Focus on possibility and growth',
        'End with encouragement to take action'
      ]
    },
    storytelling: {
      name: 'Story-Based Content',
      description: 'Engage through narrative',
      structure: [
        'Setting the scene',
        'Character introduction or challenge',
        'Conflict or turning point',
        'Resolution or lesson learned',
        'Takeaway or moral'
      ],
      toneGuidelines: 'Narrative, engaging, authentic, conversational',
      contentPatterns: [
        'Use storytelling arc structure',
        'Include sensory details',
        'Create emotional connection',
        'Extract clear lessons or insights'
      ]
    },
    tips: {
      name: 'Quick Tips & Hacks',
      description: 'Actionable advice and life hacks',
      structure: [
        'Introduction to topic/problem',
        'Quick tip #1 with explanation',
        'Quick tip #2 with explanation',
        'Quick tip #3 with explanation',
        'Summary and encouragement to implement'
      ],
      toneGuidelines: 'Practical, concise, actionable, friendly',
      contentPatterns: [
        'Keep each tip simple and actionable',
        'Use specific examples or scenarios',
        'Include why each tip works',
        'Focus on immediate implementation'
      ]
    }
  };

  static detectContentType(prompt: string): 'educational' | 'promotional' | 'inspirational' | 'storytelling' | 'tips' {
    const lowercasePrompt = prompt.toLowerCase();
    
    // Educational patterns
    if (lowercasePrompt.includes('how to') || lowercasePrompt.includes('guide') || 
        lowercasePrompt.includes('learn') || lowercasePrompt.includes('tutorial') ||
        lowercasePrompt.includes('steps') || lowercasePrompt.includes('process')) {
      return 'educational';
    }
    
    // Tips patterns
    if (lowercasePrompt.includes('tips') || lowercasePrompt.includes('hacks') || 
        lowercasePrompt.includes('tricks') || lowercasePrompt.includes('secrets') ||
        lowercasePrompt.includes('ways to')) {
      return 'tips';
    }
    
    // Promotional patterns
    if (lowercasePrompt.includes('product') || lowercasePrompt.includes('service') ||
        lowercasePrompt.includes('buy') || lowercasePrompt.includes('offer') ||
        lowercasePrompt.includes('sale') || lowercasePrompt.includes('discount')) {
      return 'promotional';
    }
    
    // Inspirational patterns
    if (lowercasePrompt.includes('motivat') || lowercasePrompt.includes('inspir') ||
        lowercasePrompt.includes('success') || lowercasePrompt.includes('achieve') ||
        lowercasePrompt.includes('goals') || lowercasePrompt.includes('dream')) {
      return 'inspirational';
    }
    
    // Story patterns
    if (lowercasePrompt.includes('story') || lowercasePrompt.includes('journey') ||
        lowercasePrompt.includes('experience') || lowercasePrompt.includes('once')) {
      return 'storytelling';
    }
    
    // Default to educational for general content
    return 'educational';
  }

  static generateStructuredPrompt(options: CarouselPromptOptions): string {
    const { topic, slideCount, backgroundStrategy, tone, targetAudience, style, contentType } = options;
    const template = this.templates[contentType];
    
    const structuredPrompt = `
You are an expert Instagram carousel creator. Create a ${slideCount}-slide Instagram carousel on the topic: "${topic}"

CONTENT TYPE: ${template.name}
TARGET: ${targetAudience}
TONE: ${tone} (${template.toneGuidelines})
STYLE: ${style}

STRUCTURAL GUIDELINES:
${template.structure.map((item, index) => `${index + 1}. ${item}`).join('\n')}

CONTENT PATTERNS TO FOLLOW:
${template.contentPatterns.map(pattern => `• ${pattern}`).join('\n')}

SLIDE SPECIFICATIONS:
- Each slide must have a clear, specific purpose
- Titles: Attention-grabbing, max 60 characters
- Content: Concise but valuable, max 150 characters per slide
- Include strategic use of emojis (2-3 per slide max)
- Maintain consistent voice throughout
- Create logical flow between slides

BACKGROUND STRATEGY: ${backgroundStrategy}
${backgroundStrategy === 'thematic' ? 
  '• Create cohesive visual theme with consistent color palette, style, and mood\n• Background prompts should complement each other visually' :
  '• Create unique, varied backgrounds that match each slide\'s specific content\n• Ensure visual diversity while maintaining professional quality'
}

INSTAGRAM OPTIMIZATION:
- Hook readers within first 2 slides
- Use carousel-specific engagement tactics
- Include clear value proposition
- End with strong call-to-action
- Optimize for mobile viewing
- Consider swipe-through psychology

RESPONSE FORMAT (STRICT JSON):
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Attention-grabbing title",
      "subtitle": "Supporting subtitle (optional)",
      "content": "Main slide content with clear value",
      "cta": "Action-oriented text (if applicable)",
      "backgroundPrompt": "Detailed visual description for ${backgroundStrategy} background generation",
      "designNotes": "Layout and visual hierarchy suggestions",
      "engagementTactics": "Psychological or engagement elements for this slide"
    }
  ],
  "carouselMetadata": {
    "overallTheme": "Central theme description",
    "contentFlow": "How slides connect and flow",
    "targetEngagement": "Expected user behavior and engagement",
    "hashtagSuggestions": ["#relevant", "#hashtags", "#forContent"],
    "visualConsistency": "Guidelines for visual coherence"
  }
}

Create exactly ${slideCount} slides following this structure. Ensure each slide builds upon the previous one and creates a cohesive, engaging carousel experience.`;

    return structuredPrompt;
  }

  static generateBackgroundConsistencyPrompt(
    slidePrompts: string[], 
    strategy: 'unique' | 'thematic',
    baseStyle: string = 'modern and professional'
  ): string[] {
    if (strategy === 'unique') {
      return slidePrompts.map(prompt => 
        `${prompt}, ${baseStyle}, high quality, Instagram-optimized composition`
      );
    }

    // For thematic strategy, create consistent visual elements
    const themeElements = `${baseStyle}, consistent color palette, cohesive visual style, professional lighting, Instagram carousel optimized`;
    
    return slidePrompts.map((prompt, index) => 
      `${prompt}, ${themeElements}, slide ${index + 1} of cohesive series, maintaining visual consistency while highlighting: ${prompt}`
    );
  }

  static optimizePromptForRunware(prompt: string, slideContext: string): string {
    // Enhance prompts specifically for Runware's image generation
    const runwareOptimizations = [
      'high resolution',
      'professional quality',
      'Instagram optimized',
      'clean composition',
      'vibrant colors',
      'modern aesthetic'
    ];
    
    return `${prompt}, ${slideContext}, ${runwareOptimizations.join(', ')}`;
  }

  static generateCTARecommendations(contentType: string, topic: string): string[] {
    const ctaMap: Record<string, string[]> = {
      educational: [
        'Try this today!',
        'Which tip will you implement first?',
        'Save this for later!',
        'Share your results in comments',
        "What's your experience?"
      ],
      promotional: [
        'Get started today!',
        'Claim your discount now',
        'Link in bio for more info',
        "Don't miss out!",
        'Ready to transform?'
      ],
      inspirational: [
        'You\'ve got this!',
        'Start your journey today',
        'Believe in yourself',
        'Take the first step',
        'Your time is now'
      ],
      storytelling: [
        'What\'s your story?',
        'Share your experience',
        'Can you relate?',
        'How does this resonate?',
        'What would you do?'
      ],
      tips: [
        'Try tip #1 first!',
        'Which tip surprised you?',
        'Bookmark for later',
        'Share your favorite tip',
        'More tips in bio!'
      ]
    };

    return ctaMap[contentType] || ctaMap.educational;
  }

  static generateSlideLayoutSuggestions(
    content: string,
    slideIndex: number,
    totalSlides: number
  ): SlideLayoutSuggestion {
    // Analyze content length and type to suggest appropriate layout
    const contentLength = content.length;
    const isFirstSlide = slideIndex === 0;
    const isLastSlide = slideIndex === totalSlides - 1;
    
    // Determine layout type based on content and position
    let layoutType: SlideLayoutSuggestion['layoutType'];
    let textPlacement: SlideLayoutSuggestion['textPlacement'];
    let fontSizeRecommendation: SlideLayoutSuggestion['fontSizeRecommendation'];
    let colorScheme: SlideLayoutSuggestion['colorScheme'];
    
    if (isFirstSlide) {
      // First slide should grab attention
      layoutType = 'bold-statement';
      textPlacement = 'center';
      fontSizeRecommendation = 'large';
      colorScheme = 'high-contrast';
    } else if (isLastSlide) {
      // Last slide should have clear CTA
      layoutType = 'text-focused';
      textPlacement = 'center';
      fontSizeRecommendation = 'medium';
      colorScheme = 'vibrant';
    } else if (contentLength > 120) {
      // Long content needs more space
      layoutType = 'text-focused';
      textPlacement = 'top';
      fontSizeRecommendation = 'small';
      colorScheme = 'subtle';
    } else if (contentLength < 60) {
      // Short content can be bold
      layoutType = 'bold-statement';
      textPlacement = 'center';
      fontSizeRecommendation = 'large';
      colorScheme = 'high-contrast';
    } else {
      // Medium content
      layoutType = 'split-screen';
      textPlacement = 'left';
      fontSizeRecommendation = 'medium';
      colorScheme = 'monochrome';
    }

    // Create visual hierarchy based on content structure
    const visualHierarchy: string[] = [];
    if (content.includes('💡') || content.includes('📝') || content.includes('⭐')) {
      visualHierarchy.push('emoji/icon emphasis');
    }
    if (content.includes('•') || content.includes('-') || /\d+\./.test(content)) {
      visualHierarchy.push('list structure');
    }
    if (content.includes('?') || content.includes('!')) {
      visualHierarchy.push('question/exclamation emphasis');
    }
    visualHierarchy.push('main text content');
    if (isLastSlide) {
      visualHierarchy.push('call-to-action button');
    }

    return {
      layoutType,
      textPlacement,
      fontSizeRecommendation,
      colorScheme,
      visualHierarchy
    };
  }

  static generateCompositionRules(contentType: 'educational' | 'promotional' | 'inspirational' | 'storytelling' | 'tips'): string[] {
    const baseRules = [
      'Maintain consistent brand colors throughout carousel',
      'Use readable typography with sufficient contrast',
      'Ensure mobile-friendly text sizes (minimum 14px)',
      'Leave adequate white space for readability',
      'Create visual flow between slides'
    ];

    const typeSpecificRules: Record<string, string[]> = {
      educational: [
        'Use numbered steps or bullet points for clarity',
        'Highlight key takeaways with color or typography',
        'Include progress indicators across slides',
        'Use diagrams or icons to support complex concepts',
        'Maintain academic credibility with clean layouts'
      ],
      promotional: [
        'Lead with benefit-focused headlines',
        'Use contrasting colors for call-to-action elements',
        'Include social proof elements (testimonials, ratings)',
        'Create urgency with strategic color and typography',
        'End with strong, clear call-to-action'
      ],
      inspirational: [
        'Use uplifting imagery and warm color palettes',
        'Incorporate motivational quotes with elegant typography',
        'Create emotional connection through visual storytelling',
        'Use aspirational imagery that resonates with goals',
        'Include personal elements or authentic stories'
      ],
      storytelling: [
        'Create visual narrative flow between slides',
        'Use consistent characters or elements throughout',
        'Build tension and resolution through visual pacing',
        'Include sensory details in imagery choices',
        'Maintain story arc structure in layout progression'
      ],
      tips: [
        'Number each tip clearly for easy reference',
        'Use consistent icon system for different tip types',
        'Create scannable layouts with quick takeaways',
        'Include practical examples with visual support',
        'End with implementation encouragement'
      ]
    };

    return [...baseRules, ...(typeSpecificRules[contentType] || typeSpecificRules.educational)];
  }
}

export default CarouselPromptService;