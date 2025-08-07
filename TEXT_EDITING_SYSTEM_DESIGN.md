# Text Editing System Design
## Enhanced Social Media Content Creation Platform

> **Date**: 2025-08-04  
> **Status**: Design Phase  
> **Context**: Task #12 - Plan text editing system with font, color, and position controls

---

## Executive Summary

This document designs an enhanced text editing system that builds upon OpenCut's existing comprehensive text editing foundation. The system provides professional-grade typography controls optimized for social media content creation, including advanced styling, positioning, animations, and AI-powered text generation integration.

---

## Current OpenCut Text System Analysis

### Existing Implementation Strengths
**Already Implemented in OpenCut:**

1. **Text Element Data Structure** (`types/timeline.ts`):
   ```typescript
   interface TextElement extends BaseTimelineElement {
     type: "text";
     content: string;
     fontSize: number;
     fontFamily: string;
     color: string;
     backgroundColor: string;
     textAlign: "left" | "center" | "right";
     fontWeight: "normal" | "bold";
     fontStyle: "normal" | "italic";
     textDecoration: "none" | "underline" | "line-through";
     x: number; // Position relative to canvas center
     y: number; // Position relative to canvas center
     rotation: number; // in degrees
     opacity: number; // 0-1
   }
   ```

2. **Text Properties Panel** (`text-properties.tsx`):
   - ✅ Text content editing with textarea
   - ✅ Font family picker (system + Google fonts)
   - ✅ Style controls: Bold, Italic, Underline, Strikethrough
   - ✅ Font size: Slider + numeric input (8-300px)
   - ✅ Color picker for text color
   - ✅ Background color picker
   - ✅ Opacity control: Slider + numeric input (0-100%)

3. **Font System** (`font-constants.ts`):
   - ✅ System fonts: Arial, Helvetica, Times New Roman, Georgia
   - ✅ Google fonts: Inter, Roboto, Open Sans, Playfair Display, Comic Neue
   - ✅ Font categorization and weight support
   - ✅ Type-safe font family system

4. **Preview & Positioning** (`preview-panel.tsx`):
   - ✅ Real-time text rendering in preview
   - ✅ Drag-and-drop positioning system
   - ✅ Font class mapping for Google fonts
   - ✅ Text alignment, rotation, opacity support
   - ✅ Canvas boundary constraints

---

## Enhanced Text Editing System Design

### 1. Extended Text Element Data Structure

```typescript
// Enhanced TextElement extending existing OpenCut structure
interface EnhancedTextElement extends TextElement {
  // Existing OpenCut properties remain unchanged for compatibility
  
  // NEW: Advanced Typography
  letterSpacing: number; // in px
  lineHeight: number; // multiplier (1.0 = normal)
  wordSpacing: number; // in px
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
  
  // NEW: Text Effects
  textStroke: {
    width: number; // in px
    color: string;
    enabled: boolean;
  };
  textShadow: {
    offsetX: number; // in px
    offsetY: number; // in px
    blurRadius: number; // in px
    color: string;
    enabled: boolean;
  };
  
  // NEW: Advanced Positioning & Transform
  scaleX: number; // horizontal scale (1.0 = normal)
  scaleY: number; // vertical scale (1.0 = normal)
  skewX: number; // horizontal skew in degrees
  skewY: number; // vertical skew in degrees
  zIndex: number; // layer depth
  
  // NEW: Animation Support
  animations: TextAnimation[];
  
  // NEW: AI Integration
  aiGenerated: boolean;
  aiPrompt?: string; // Original prompt used to generate this text
  aiProvider?: "openai" | "anthropic" | "custom";
  
  // NEW: Style Presets
  stylePreset?: string; // Reference to saved text style
  
  // NEW: Social Media Optimization
  platforms: SocialMediaPlatform[]; // Platforms this text is optimized for
  readabilityScore?: number; // AI-calculated readability score
  hashtagPositions?: number[]; // Character positions of hashtags
  mentionPositions?: number[]; // Character positions of mentions
}

interface TextAnimation {
  id: string;
  type: "fadeIn" | "fadeOut" | "slideIn" | "slideOut" | "typewriter" | "bounce" | "pulse" | "rotate";
  direction?: "left" | "right" | "up" | "down";
  duration: number; // in seconds
  delay: number; // in seconds
  easing: "linear" | "ease-in" | "ease-out" | "ease-in-out" | "bounce";
  loop: boolean;
  startTime: number; // When animation starts relative to element start
}

interface SocialMediaPlatform {
  name: "instagram" | "tiktok" | "facebook" | "youtube" | "twitter";
  maxCharacters?: number;
  recommendedFontSize?: number;
  safeArea?: { x: number; y: number; width: number; height: number };
}
```

### 2. Enhanced Font System

```typescript
// Extended font constants
interface EnhancedFontOption extends FontOption {
  // Existing properties from OpenCut
  value: string;
  label: string;
  category: "system" | "google" | "custom";
  weights?: number[];
  hasClassName?: boolean;
  
  // NEW: Enhanced properties
  styles?: FontStyle[];
  characterSet?: "latin" | "latin-ext" | "cyrillic" | "arabic" | "chinese";
  socialMediaOptimized?: boolean; // Best for social media content
  readabilityScore?: number; // 1-10 scale
  trending?: boolean; // Currently trending font
  premium?: boolean; // Requires subscription
}

interface FontStyle {
  weight: number;
  style: "normal" | "italic";
  displayName: string; // e.g., "Light", "Bold Italic"
}

// Expanded font library for social media
const ENHANCED_FONT_OPTIONS: EnhancedFontOption[] = [
  // Existing OpenCut fonts remain...
  
  // NEW: Social Media Optimized Fonts
  {
    value: "Poppins",
    label: "Poppins",
    category: "google",
    weights: [300, 400, 500, 600, 700, 800, 900],
    styles: [
      { weight: 300, style: "normal", displayName: "Light" },
      { weight: 400, style: "normal", displayName: "Regular" },
      { weight: 600, style: "normal", displayName: "SemiBold" },
      { weight: 700, style: "normal", displayName: "Bold" },
    ],
    socialMediaOptimized: true,
    readabilityScore: 9,
    trending: true,
    hasClassName: true,
  },
  {
    value: "Montserrat",
    label: "Montserrat",
    category: "google",
    socialMediaOptimized: true,
    readabilityScore: 8,
    hasClassName: true,
  },
  {
    value: "Bebas Neue",
    label: "Bebas Neue",
    category: "google",
    socialMediaOptimized: true,
    readabilityScore: 7,
    trending: true,
    hasClassName: true,
  },
  {
    value: "Oswald",
    label: "Oswald",
    category: "google",
    socialMediaOptimized: true,
    readabilityScore: 8,
    hasClassName: true,
  },
];
```

### 3. Enhanced Text Properties Panel

```typescript
// Enhanced text properties component
interface EnhancedTextPropertiesProps {
  element: EnhancedTextElement;
  trackId: string;
  canvasFormat: "instagram-story" | "instagram-post" | "tiktok" | "facebook" | "youtube";
}

// Component structure:
function EnhancedTextProperties({ element, trackId, canvasFormat }: EnhancedTextPropertiesProps) {
  return (
    <div className="space-y-6 p-5">
      {/* Existing OpenCut controls remain unchanged */}
      <TextContentEditor />
      <FontSelector />
      <BasicStyleControls />
      <FontSizeControl />
      <ColorControls />
      <OpacityControl />
      
      {/* NEW: Enhanced Controls */}
      <TextAlignmentControls />
      <AdvancedTypographyControls />
      <TextEffectsControls />
      <TransformControls />
      <AnimationControls />
      <StylePresetsPanel />
      <SocialMediaOptimization />
      <AITextGeneration />
    </div>
  );
}
```

### 4. New UI Components

#### 4.1 Text Alignment Controls
```typescript
function TextAlignmentControls({ element, onUpdate }: TextControlProps) {
  return (
    <PropertyItem direction="row">
      <PropertyItemLabel>Alignment</PropertyItemLabel>
      <PropertyItemValue>
        <div className="flex items-center gap-1">
          <Button
            variant={element.textAlign === "left" ? "default" : "outline"}
            size="sm"
            onClick={() => onUpdate({ textAlign: "left" })}
            className="h-8 px-3"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={element.textAlign === "center" ? "default" : "outline"}
            size="sm"
            onClick={() => onUpdate({ textAlign: "center" })}
            className="h-8 px-3"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant={element.textAlign === "right" ? "default" : "outline"}
            size="sm"
            onClick={() => onUpdate({ textAlign: "right" })}
            className="h-8 px-3"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
      </PropertyItemValue>
    </PropertyItem>
  );
}
```

#### 4.2 Advanced Typography Controls
```typescript
function AdvancedTypographyControls({ element, onUpdate }: TextControlProps) {
  return (
    <PropertyItem direction="column">
      <PropertyItemLabel>Typography</PropertyItemLabel>
      
      {/* Letter Spacing */}
      <PropertyItem direction="row">
        <PropertyItemLabel>Letter Spacing</PropertyItemLabel>
        <PropertyItemValue>
          <div className="flex items-center gap-2">
            <Slider
              value={[element.letterSpacing || 0]}
              min={-5}
              max={10}
              step={0.1}
              onValueChange={([value]) => onUpdate({ letterSpacing: value })}
              className="w-full"
            />
            <Input
              type="number"
              value={element.letterSpacing || 0}
              step={0.1}
              onChange={(e) => onUpdate({ letterSpacing: parseFloat(e.target.value) })}
              className="w-16 text-xs h-7"
            />
          </div>
        </PropertyItemValue>
      </PropertyItem>
      
      {/* Line Height */}
      <PropertyItem direction="row">
        <PropertyItemLabel>Line Height</PropertyItemLabel>
        <PropertyItemValue>
          <div className="flex items-center gap-2">
            <Slider
              value={[element.lineHeight || 1.2]}
              min={0.8}
              max={3.0}
              step={0.1}
              onValueChange={([value]) => onUpdate({ lineHeight: value })}
              className="w-full"
            />
            <Input
              type="number"
              value={element.lineHeight || 1.2}
              step={0.1}
              onChange={(e) => onUpdate({ lineHeight: parseFloat(e.target.value) })}
              className="w-16 text-xs h-7"
            />
          </div>
        </PropertyItemValue>
      </PropertyItem>
      
      {/* Text Transform */}
      <PropertyItem direction="row">
        <PropertyItemLabel>Case</PropertyItemLabel>
        <PropertyItemValue>
          <Select
            value={element.textTransform || "none"}
            onValueChange={(value) => onUpdate({ textTransform: value })}
          >
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Normal</SelectItem>
              <SelectItem value="uppercase">UPPERCASE</SelectItem>
              <SelectItem value="lowercase">lowercase</SelectItem>
              <SelectItem value="capitalize">Capitalize</SelectItem>
            </SelectContent>
          </Select>
        </PropertyItemValue>
      </PropertyItem>
    </PropertyItem>
  );
}
```

#### 4.3 Text Effects Controls
```typescript
function TextEffectsControls({ element, onUpdate }: TextControlProps) {
  return (
    <PropertyItem direction="column">
      <PropertyItemLabel>Effects</PropertyItemLabel>
      
      {/* Text Stroke */}
      <PropertyItem direction="column">
        <div className="flex items-center gap-2">
          <Switch
            checked={element.textStroke?.enabled || false}
            onCheckedChange={(enabled) => 
              onUpdate({ 
                textStroke: { ...element.textStroke, enabled } 
              })
            }
          />
          <PropertyItemLabel>Text Stroke</PropertyItemLabel>
        </div>
        
        {element.textStroke?.enabled && (
          <div className="space-y-2 ml-6">
            <PropertyItem direction="row">
              <PropertyItemLabel>Width</PropertyItemLabel>
              <Slider
                value={[element.textStroke.width || 1]}
                min={0}
                max={10}
                step={0.5}
                onValueChange={([value]) => 
                  onUpdate({ 
                    textStroke: { ...element.textStroke, width: value } 
                  })
                }
                className="flex-1"
              />
            </PropertyItem>
            <PropertyItem direction="row">
              <PropertyItemLabel>Color</PropertyItemLabel>
              <Input
                type="color"
                value={element.textStroke.color || "#000000"}
                onChange={(e) => 
                  onUpdate({ 
                    textStroke: { ...element.textStroke, color: e.target.value } 
                  })
                }
                className="w-full cursor-pointer"
              />
            </PropertyItem>
          </div>
        )}
      </PropertyItem>
      
      {/* Text Shadow */}
      <PropertyItem direction="column">
        <div className="flex items-center gap-2">
          <Switch
            checked={element.textShadow?.enabled || false}
            onCheckedChange={(enabled) => 
              onUpdate({ 
                textShadow: { ...element.textShadow, enabled } 
              })
            }
          />
          <PropertyItemLabel>Text Shadow</PropertyItemLabel>
        </div>
        
        {element.textShadow?.enabled && (
          <div className="space-y-2 ml-6">
            <PropertyItem direction="row">
              <PropertyItemLabel>Offset X</PropertyItemLabel>
              <Slider
                value={[element.textShadow.offsetX || 2]}
                min={-20}
                max={20}
                step={1}
                onValueChange={([value]) => 
                  onUpdate({ 
                    textShadow: { ...element.textShadow, offsetX: value } 
                  })
                }
                className="flex-1"
              />
            </PropertyItem>
            <PropertyItem direction="row">
              <PropertyItemLabel>Offset Y</PropertyItemLabel>
              <Slider
                value={[element.textShadow.offsetY || 2]}
                min={-20}
                max={20}
                step={1}
                onValueChange={([value]) => 
                  onUpdate({ 
                    textShadow: { ...element.textShadow, offsetY: value } 
                  })
                }
                className="flex-1"
              />
            </PropertyItem>
            <PropertyItem direction="row">
              <PropertyItemLabel>Blur</PropertyItemLabel>
              <Slider
                value={[element.textShadow.blurRadius || 4]}
                min={0}
                max={20}
                step={1}
                onValueChange={([value]) => 
                  onUpdate({ 
                    textShadow: { ...element.textShadow, blurRadius: value } 
                  })
                }
                className="flex-1"
              />
            </PropertyItem>
            <PropertyItem direction="row">
              <PropertyItemLabel>Color</PropertyItemLabel>
              <Input
                type="color"
                value={element.textShadow.color || "#000000"}
                onChange={(e) => 
                  onUpdate({ 
                    textShadow: { ...element.textShadow, color: e.target.value } 
                  })
                }
                className="w-full cursor-pointer"
              />
            </PropertyItem>
          </div>
        )}
      </PropertyItem>
    </PropertyItem>
  );
}
```

#### 4.4 Transform Controls
```typescript
function TransformControls({ element, onUpdate }: TextControlProps) {
  return (
    <PropertyItem direction="column">
      <PropertyItemLabel>Transform</PropertyItemLabel>
      
      {/* Rotation */}
      <PropertyItem direction="row">
        <PropertyItemLabel>Rotation</PropertyItemLabel>
        <PropertyItemValue>
          <div className="flex items-center gap-2">
            <Slider
              value={[element.rotation || 0]}
              min={-180}
              max={180}
              step={1}
              onValueChange={([value]) => onUpdate({ rotation: value })}
              className="w-full"
            />
            <Input
              type="number"
              value={element.rotation || 0}
              onChange={(e) => onUpdate({ rotation: parseInt(e.target.value) })}
              className="w-16 text-xs h-7"
            />
            <span className="text-xs text-muted-foreground">°</span>
          </div>
        </PropertyItemValue>
      </PropertyItem>
      
      {/* Scale */}
      <PropertyItem direction="row">
        <PropertyItemLabel>Scale X</PropertyItemLabel>
        <PropertyItemValue>
          <Slider
            value={[element.scaleX || 1]}
            min={0.1}
            max={3}
            step={0.1}
            onValueChange={([value]) => onUpdate({ scaleX: value })}
            className="w-full"
          />
        </PropertyItemValue>
      </PropertyItem>
      
      <PropertyItem direction="row">
        <PropertyItemLabel>Scale Y</PropertyItemLabel>
        <PropertyItemValue>
          <Slider
            value={[element.scaleY || 1]}
            min={0.1}
            max={3}
            step={0.1}
            onValueChange={([value]) => onUpdate({ scaleY: value })}
            className="w-full"
          />
        </PropertyItemValue>
      </PropertyItem>
      
      {/* Z-Index */}
      <PropertyItem direction="row">
        <PropertyItemLabel>Layer</PropertyItemLabel>
        <PropertyItemValue>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdate({ zIndex: (element.zIndex || 0) + 1 })}
              className="h-7 px-2"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Input
              type="number"
              value={element.zIndex || 0}
              onChange={(e) => onUpdate({ zIndex: parseInt(e.target.value) })}
              className="w-16 text-xs h-7 text-center"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdate({ zIndex: (element.zIndex || 0) - 1 })}
              className="h-7 px-2"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        </PropertyItemValue>
      </PropertyItem>
    </PropertyItem>
  );
}
```

### 5. Text Animation System

```typescript
interface TextAnimationPanel {
  element: EnhancedTextElement;
  onUpdate: (updates: Partial<EnhancedTextElement>) => void;
}

function AnimationControls({ element, onUpdate }: TextAnimationPanel) {
  const [selectedAnimation, setSelectedAnimation] = useState<string | null>(null);
  
  const addAnimation = (type: TextAnimation['type']) => {
    const newAnimation: TextAnimation = {
      id: generateUUID(),
      type,
      duration: 1,
      delay: 0,
      easing: "ease-in-out",
      loop: false,
      startTime: 0,
    };
    
    onUpdate({
      animations: [...(element.animations || []), newAnimation]
    });
  };
  
  return (
    <PropertyItem direction="column">
      <PropertyItemLabel>Animations</PropertyItemLabel>
      
      {/* Animation List */}
      <div className="space-y-2">
        {element.animations?.map((animation) => (
          <div key={animation.id} className="flex items-center gap-2 p-2 border rounded">
            <div className="flex-1">
              <div className="text-xs font-medium capitalize">{animation.type}</div>
              <div className="text-xs text-muted-foreground">
                {animation.duration}s delay {animation.delay}s
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedAnimation(animation.id)}
              className="h-6 px-2 text-xs"
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeAnimation(animation.id)}
              className="h-6 px-2 text-xs"
            >
              <Trash className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
      
      {/* Add Animation */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="h-3 w-3 mr-1" />
            Add Animation
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => addAnimation("fadeIn")}>
            Fade In
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addAnimation("slideIn")}>
            Slide In
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addAnimation("typewriter")}>
            Typewriter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addAnimation("bounce")}>
            Bounce
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addAnimation("pulse")}>
            Pulse
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </PropertyItem>
  );
}
```

### 6. Style Presets System

```typescript
interface TextStylePreset {
  id: string;
  name: string;
  thumbnail: string; // Base64 or URL
  category: "heading" | "body" | "caption" | "quote" | "custom";
  platform: "all" | "instagram" | "tiktok" | "facebook" | "youtube";
  isPremium: boolean;
  style: Partial<EnhancedTextElement>;
}

const DEFAULT_TEXT_PRESETS: TextStylePreset[] = [
  {
    id: "bold-heading",
    name: "Bold Heading",
    thumbnail: "data:image/...",
    category: "heading",
    platform: "all",
    isPremium: false,
    style: {
      fontFamily: "Poppins",
      fontSize: 48,
      fontWeight: "bold",
      color: "#ffffff",
      textStroke: { width: 2, color: "#000000", enabled: true },
      textShadow: { offsetX: 2, offsetY: 2, blurRadius: 4, color: "#00000080", enabled: true },
    }
  },
  {
    id: "instagram-caption",
    name: "Instagram Caption",
    thumbnail: "data:image/...",
    category: "caption",
    platform: "instagram",
    isPremium: false,
    style: {
      fontFamily: "Inter",
      fontSize: 24,
      fontWeight: "normal",
      color: "#ffffff",
      backgroundColor: "#00000080",
      textAlign: "center",
    }
  },
  {
    id: "tiktok-viral",
    name: "TikTok Viral",
    thumbnail: "data:image/...",
    category: "heading",
    platform: "tiktok",
    isPremium: true,
    style: {
      fontFamily: "Bebas Neue",
      fontSize: 64,
      fontWeight: "normal",
      color: "#ff0050",
      textStroke: { width: 3, color: "#ffffff", enabled: true },
      textTransform: "uppercase",
      animations: [{
        id: "bounce-in",
        type: "bounce",
        duration: 0.8,
        delay: 0,
        easing: "ease-out",
        loop: false,
        startTime: 0,
      }]
    }
  }
];

function StylePresetsPanel({ element, onUpdate }: TextControlProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredPresets = DEFAULT_TEXT_PRESETS.filter(preset => {
    const matchesCategory = selectedCategory === "all" || preset.category === selectedCategory;
    const matchesSearch = preset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  const applyPreset = (preset: TextStylePreset) => {
    onUpdate(preset.style);
  };
  
  return (
    <PropertyItem direction="column">
      <PropertyItemLabel>Style Presets</PropertyItemLabel>
      
      {/* Search & Filter */}
      <div className="space-y-2">
        <Input
          placeholder="Search presets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-xs"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Styles</SelectItem>
            <SelectItem value="heading">Headings</SelectItem>
            <SelectItem value="body">Body Text</SelectItem>
            <SelectItem value="caption">Captions</SelectItem>
            <SelectItem value="quote">Quotes</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Preset Grid */}
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {filteredPresets.map((preset) => (
          <div
            key={preset.id}
            className={`relative p-2 border rounded cursor-pointer hover:bg-accent transition-colors ${
              preset.isPremium ? 'border-yellow-400' : ''
            }`}
            onClick={() => applyPreset(preset)}
          >
            <div className="aspect-video bg-gray-100 rounded mb-1 overflow-hidden">
              <img 
                src={preset.thumbnail} 
                alt={preset.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-xs font-medium truncate">{preset.name}</div>
            {preset.isPremium && (
              <div className="absolute top-1 right-1">
                <Crown className="h-3 w-3 text-yellow-500" />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Save Current Style */}
      <Button variant="outline" size="sm" className="w-full text-xs">
        <Save className="h-3 w-3 mr-1" />
        Save Current Style
      </Button>
    </PropertyItem>
  );
}
```

### 7. AI Text Generation Integration

```typescript
interface AITextGenerationProps {
  element: EnhancedTextElement;
  onUpdate: (updates: Partial<EnhancedTextElement>) => void;
  canvasFormat: string;
}

function AITextGeneration({ element, onUpdate, canvasFormat }: AITextGenerationProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOptions, setGeneratedOptions] = useState<string[]>([]);
  const [generationType, setGenerationType] = useState<"caption" | "hashtag" | "cta" | "custom">("caption");
  
  const generateText = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          type: generationType,
          platform: canvasFormat,
          context: {
            existingText: element.content,
            fontSize: element.fontSize,
            style: element.fontFamily,
          }
        })
      });
      
      const { options } = await response.json();
      setGeneratedOptions(options);
    } catch (error) {
      console.error('AI text generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const applyGeneratedText = (text: string) => {
    onUpdate({
      content: text,
      aiGenerated: true,
      aiPrompt: prompt,
      aiProvider: "openai"
    });
    setGeneratedOptions([]);
  };
  
  return (
    <PropertyItem direction="column">
      <PropertyItemLabel>AI Text Generation</PropertyItemLabel>
      
      {/* Generation Type */}
      <Select value={generationType} onValueChange={setGenerationType}>
        <SelectTrigger className="text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="caption">Caption</SelectItem>
          <SelectItem value="hashtag">Hashtags</SelectItem>
          <SelectItem value="cta">Call to Action</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Prompt Input */}
      <Textarea
        placeholder={getPromptPlaceholder(generationType)}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="text-xs resize-none"
        rows={3}
      />
      
      {/* Generate Button */}
      <Button
        onClick={generateText}
        disabled={!prompt.trim() || isGenerating}
        className="w-full text-xs"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-3 w-3 mr-1" />
            Generate Text
          </>
        )}
      </Button>
      
      {/* Generated Options */}
      {generatedOptions.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium">Generated Options:</div>
          {generatedOptions.map((option, index) => (
            <div
              key={index}
              className="p-2 border rounded cursor-pointer hover:bg-accent transition-colors text-xs"
              onClick={() => applyGeneratedText(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
      
      {/* AI Indicator */}
      {element.aiGenerated && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          Generated with AI
        </div>
      )}
    </PropertyItem>
  );
}

function getPromptPlaceholder(type: string): string {
  switch (type) {
    case "caption":
      return "Describe your content and audience for a compelling caption...";
    case "hashtag":
      return "Describe your content for relevant hashtags...";
    case "cta":
      return "Describe your goal for a call-to-action...";
    default:
      return "Describe what text you need...";
  }
}
```

### 8. Social Media Optimization

```typescript
function SocialMediaOptimization({ element, onUpdate, canvasFormat }: TextControlProps & { canvasFormat: string }) {
  const [analysis, setAnalysis] = useState<TextAnalysis | null>(null);
  
  useEffect(() => {
    if (element.content) {
      analyzeText(element.content, canvasFormat);
    }
  }, [element.content, canvasFormat]);
  
  const analyzeText = async (text: string, platform: string) => {
    try {
      const response = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, platform })
      });
      
      const analysis = await response.json();
      setAnalysis(analysis);
    } catch (error) {
      console.error('Text analysis failed:', error);
    }
  };
  
  const optimizeForPlatform = (platform: string) => {
    const optimization = PLATFORM_OPTIMIZATIONS[platform];
    if (optimization) {
      onUpdate(optimization);
    }
  };
  
  return (
    <PropertyItem direction="column">
      <PropertyItemLabel>Social Media Optimization</PropertyItemLabel>
      
      {/* Platform Quick Optimize */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => optimizeForPlatform("instagram")}
          className="text-xs"
        >
          📸 Instagram
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => optimizeForPlatform("tiktok")}
          className="text-xs"
        >
          🎵 TikTok
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => optimizeForPlatform("facebook")}
          className="text-xs"
        >
          👥 Facebook
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => optimizeForPlatform("youtube")}
          className="text-xs"
        >
          📺 YouTube
        </Button>
      </div>
      
      {/* Text Analysis */}
      {analysis && (
        <div className="space-y-2 p-2 bg-muted/50 rounded text-xs">
          <div className="flex justify-between">
            <span>Character Count:</span>
            <span className={analysis.characterCount > analysis.maxCharacters ? 'text-red-500' : 'text-green-500'}>
              {analysis.characterCount}/{analysis.maxCharacters}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Readability Score:</span>
            <span className={`${getReadabilityColor(analysis.readabilityScore)}`}>
              {analysis.readabilityScore}/10
            </span>
          </div>
          <div className="flex justify-between">
            <span>Hashtags:</span>
            <span>{analysis.hashtagCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Mentions:</span>
            <span>{analysis.mentionCount}</span>
          </div>
          
          {/* Optimization Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="space-y-1">
              <div className="font-medium">Suggestions:</div>
              {analysis.suggestions.map((suggestion, index) => (
                <div key={index} className="text-muted-foreground">
                  • {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PropertyItem>
  );
}

interface TextAnalysis {
  characterCount: number;
  maxCharacters: number;
  readabilityScore: number;
  hashtagCount: number;
  mentionCount: number;
  suggestions: string[];
  keywordDensity: Record<string, number>;
}

const PLATFORM_OPTIMIZATIONS = {
  instagram: {
    fontSize: 28,
    fontFamily: "Poppins",
    color: "#ffffff",
    textStroke: { width: 1, color: "#000000", enabled: true },
    textAlign: "center" as const,
  },
  tiktok: {
    fontSize: 36,
    fontFamily: "Bebas Neue",
    color: "#ffffff",
    textStroke: { width: 2, color: "#000000", enabled: true },
    textTransform: "uppercase" as const,
    textAlign: "center" as const,
  },
  facebook: {
    fontSize: 24,
    fontFamily: "Inter",
    color: "#1877f2",
    textAlign: "left" as const,
  },
  youtube: {
    fontSize: 32,
    fontFamily: "Roboto",
    color: "#ffffff",
    textShadow: { offsetX: 2, offsetY: 2, blurRadius: 6, color: "#000000", enabled: true },
    textAlign: "center" as const,
  },
};
```

### 9. Enhanced Preview System

```typescript
// Extension to existing OpenCut preview-panel.tsx
function renderEnhancedTextElement(elementData: ActiveElement, index: number, canvasSize: any, previewDimensions: any) {
  const { element } = elementData;
  
  if (element.type !== "text") return null;
  
  const enhancedElement = element as EnhancedTextElement;
  const scaleRatio = previewDimensions.width / canvasSize.width;
  
  // Build enhanced styles
  const enhancedStyles: React.CSSProperties = {
    // Existing OpenCut styles
    fontSize: `${enhancedElement.fontSize}px`,
    color: enhancedElement.color,
    backgroundColor: enhancedElement.backgroundColor,
    textAlign: enhancedElement.textAlign,
    fontWeight: enhancedElement.fontWeight,
    fontStyle: enhancedElement.fontStyle,
    textDecoration: enhancedElement.textDecoration,
    opacity: enhancedElement.opacity,
    
    // NEW: Enhanced typography
    letterSpacing: `${enhancedElement.letterSpacing || 0}px`,
    lineHeight: enhancedElement.lineHeight || 1.2,
    wordSpacing: `${enhancedElement.wordSpacing || 0}px`,
    textTransform: enhancedElement.textTransform || "none",
    
    // NEW: Text effects
    ...(enhancedElement.textStroke?.enabled && {
      WebkitTextStroke: `${enhancedElement.textStroke.width}px ${enhancedElement.textStroke.color}`,
    }),
    ...(enhancedElement.textShadow?.enabled && {
      textShadow: `${enhancedElement.textShadow.offsetX}px ${enhancedElement.textShadow.offsetY}px ${enhancedElement.textShadow.blurRadius}px ${enhancedElement.textShadow.color}`,
    }),
  };
  
  // Calculate enhanced transform
  const transform = [
    `translate(-50%, -50%)`,
    `rotate(${enhancedElement.rotation || 0}deg)`,
    `scale(${scaleRatio})`,
    `scaleX(${enhancedElement.scaleX || 1})`,
    `scaleY(${enhancedElement.scaleY || 1})`,
    `skew(${enhancedElement.skewX || 0}deg, ${enhancedElement.skewY || 0}deg)`,
  ].join(' ');
  
  return (
    <div
      key={enhancedElement.id}
      className="absolute flex items-center justify-center cursor-grab"
      style={{
        left: `${50 + (enhancedElement.x / canvasSize.width) * 100}%`,
        top: `${50 + (enhancedElement.y / canvasSize.height) * 100}%`,
        transform,
        zIndex: 100 + (enhancedElement.zIndex || 0) + index,
      }}
      onMouseDown={(e) => handleTextMouseDown(e, enhancedElement, elementData.track.id)}
    >
      <div
        className={getFontClassName(enhancedElement.fontFamily)}
        style={enhancedStyles}
      >
        {enhancedElement.content}
      </div>
      
      {/* AI Generated Indicator */}
      {enhancedElement.aiGenerated && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <Sparkles className="w-2 h-2 text-white" />
        </div>
      )}
    </div>
  );
}
```

### 10. Implementation Roadmap

#### Phase 1: Foundation Extensions (Week 1-2)
- **Enhanced Data Structure**: Extend TextElement with new properties
- **Basic UI Extensions**: Add alignment controls, rotation UI, z-index controls
- **Typography Controls**: Letter spacing, line height, text transform
- **Backward Compatibility**: Ensure existing OpenCut functionality remains intact

#### Phase 2: Visual Effects (Week 2-3)
- **Text Effects**: Stroke and shadow controls with live preview
- **Transform Controls**: Scale, skew, enhanced rotation with visual feedback
- **Advanced Positioning**: Improved drag-and-drop with snap guides
- **Preview Enhancements**: Real-time effect rendering

#### Phase 3: Style System (Week 3-4)
- **Style Presets**: Library of predefined text styles for social media
- **Style Manager**: Save, organize, and share custom text styles
- **Platform Optimization**: Quick-apply platform-specific styles
- **Template Integration**: Connect with template system for consistent styling

#### Phase 4: AI Integration (Week 4-5)
- **AI Text Generation**: OpenAI/Anthropic integration for content generation
- **Smart Suggestions**: Context-aware text improvement recommendations
- **Hashtag Generation**: Automatic hashtag suggestions based on content
- **Readability Analysis**: Real-time text analysis and optimization tips

#### Phase 5: Animation & Advanced Features (Week 5-6)
- **Text Animations**: Typewriter, fade, slide, bounce effects with timeline integration
- **Animation Sequencing**: Complex animation chains and timing controls
- **Social Media Analytics**: Text performance tracking and A/B testing
- **Advanced Export**: Platform-specific text rendering optimizations

### 11. Database Schema Extensions

```sql
-- Extend existing text elements table
ALTER TABLE text_elements ADD COLUMN letter_spacing DECIMAL DEFAULT 0;
ALTER TABLE text_elements ADD COLUMN line_height DECIMAL DEFAULT 1.2;
ALTER TABLE text_elements ADD COLUMN word_spacing DECIMAL DEFAULT 0;
ALTER TABLE text_elements ADD COLUMN text_transform VARCHAR(20) DEFAULT 'none';
ALTER TABLE text_elements ADD COLUMN stroke_width DECIMAL DEFAULT 0;
ALTER TABLE text_elements ADD COLUMN stroke_color VARCHAR(7) DEFAULT '#000000';
ALTER TABLE text_elements ADD COLUMN stroke_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE text_elements ADD COLUMN shadow_offset_x DECIMAL DEFAULT 0;
ALTER TABLE text_elements ADD COLUMN shadow_offset_y DECIMAL DEFAULT 0;
ALTER TABLE text_elements ADD COLUMN shadow_blur DECIMAL DEFAULT 0;
ALTER TABLE text_elements ADD COLUMN shadow_color VARCHAR(9) DEFAULT '#00000080';
ALTER TABLE text_elements ADD COLUMN shadow_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE text_elements ADD COLUMN scale_x DECIMAL DEFAULT 1;
ALTER TABLE text_elements ADD COLUMN scale_y DECIMAL DEFAULT 1;
ALTER TABLE text_elements ADD COLUMN skew_x DECIMAL DEFAULT 0;
ALTER TABLE text_elements ADD COLUMN skew_y DECIMAL DEFAULT 0;
ALTER TABLE text_elements ADD COLUMN z_index INTEGER DEFAULT 0;
ALTER TABLE text_elements ADD COLUMN ai_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE text_elements ADD COLUMN ai_prompt TEXT;
ALTER TABLE text_elements ADD COLUMN ai_provider VARCHAR(20);
ALTER TABLE text_elements ADD COLUMN style_preset_id UUID;

-- Text animations table
CREATE TABLE text_animations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    element_id UUID REFERENCES text_elements(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    direction VARCHAR(10),
    duration DECIMAL NOT NULL DEFAULT 1,
    delay DECIMAL NOT NULL DEFAULT 0,
    easing VARCHAR(20) NOT NULL DEFAULT 'ease-in-out',
    loop BOOLEAN DEFAULT FALSE,
    start_time DECIMAL NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Text style presets
CREATE TABLE text_style_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    thumbnail TEXT, -- Base64 encoded thumbnail
    category VARCHAR(20) DEFAULT 'custom',
    platform VARCHAR(20) DEFAULT 'all',
    is_premium BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    style_data JSONB NOT NULL, -- Serialized style properties
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Text analytics
CREATE TABLE text_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    element_id UUID REFERENCES text_elements(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    platform VARCHAR(20),
    character_count INTEGER,
    readability_score DECIMAL,
    hashtag_count INTEGER,
    mention_count INTEGER,
    engagement_prediction DECIMAL,
    analyzed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_text_animations_element_id ON text_animations(element_id);
CREATE INDEX idx_text_style_presets_user_id ON text_style_presets(user_id);
CREATE INDEX idx_text_style_presets_category ON text_style_presets(category);
CREATE INDEX idx_text_style_presets_platform ON text_style_presets(platform);
CREATE INDEX idx_text_analytics_element_id ON text_analytics(element_id);
CREATE INDEX idx_text_analytics_project_id ON text_analytics(project_id);
```

### 12. Performance Optimizations

#### 12.1 Text Rendering Optimizations
```typescript
// Virtualized text rendering for large projects
const TextRenderer = memo(({ element, canvasSize, scale }: TextRendererProps) => {
  // Memoize expensive style calculations
  const computedStyles = useMemo(() => {
    return calculateTextStyles(element, canvasSize, scale);
  }, [element.id, element.fontSize, element.fontFamily, canvasSize, scale]);
  
  // Use CSS transforms for better performance
  const transform = useMemo(() => {
    return `translate3d(${element.x}px, ${element.y}px, 0) rotate(${element.rotation}deg) scale(${element.scaleX}, ${element.scaleY})`;
  }, [element.x, element.y, element.rotation, element.scaleX, element.scaleY]);
  
  return (
    <div
      className="text-element"
      style={{
        ...computedStyles,
        transform,
        willChange: 'transform', // Optimize for animations
      }}
    >
      {element.content}
    </div>
  );
});
```

#### 12.2 Font Loading Strategy
```typescript
// Preload fonts for better performance
const FontPreloader = () => {
  useEffect(() => {
    // Preload critical Google Fonts
    const criticalFonts = ['Poppins', 'Inter', 'Roboto'];
    criticalFonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = `https://fonts.gstatic.com/s/${font.toLowerCase()}/...`;
      document.head.appendChild(link);
    });
  }, []);
  
  return null;
};

// Font fallback system
const getFontStack = (primaryFont: string): string => {
  const fallbacks = {
    'Poppins': 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'Inter': 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'Bebas Neue': '"Bebas Neue", Arial Black, sans-serif',
  };
  
  return fallbacks[primaryFont] || `${primaryFont}, Arial, sans-serif`;
};
```

### 13. Testing Strategy

#### 13.1 Component Testing
```typescript
// Example test for text properties component
describe('EnhancedTextProperties', () => {
  it('should update text styling properties', () => {
    const mockElement: EnhancedTextElement = {
      // ... mock element data
    };
    const mockOnUpdate = jest.fn();
    
    render(
      <EnhancedTextProperties 
        element={mockElement} 
        trackId="test-track" 
        onUpdate={mockOnUpdate}
      />
    );
    
    // Test font size slider
    const fontSizeSlider = screen.getByRole('slider', { name: /font size/i });
    fireEvent.change(fontSizeSlider, { target: { value: '72' } });
    
    expect(mockOnUpdate).toHaveBeenCalledWith({ fontSize: 72 });
  });
  
  it('should apply style presets correctly', () => {
    // ... preset application tests
  });
  
  it('should generate AI text when prompted', async () => {
    // ... AI generation tests
  });
});
```

#### 13.2 Integration Testing
```typescript
// Test text rendering in preview
describe('Text Preview Integration', () => {
  it('should render text with all styling applied', () => {
    // ... rendering tests
  });
  
  it('should handle drag and drop positioning', () => {
    // ... positioning tests
  });
  
  it('should play animations correctly', () => {
    // ... animation tests
  });
});
```

### 14. Accessibility Considerations

#### 14.1 Keyboard Navigation
```typescript
// Enhanced keyboard support for text editing
const useTextEditorKeyboard = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            toggleBold();
            break;
          case 'i':
            e.preventDefault();
            toggleItalic();
            break;
          case 'u':
            e.preventDefault();
            toggleUnderline();
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};
```

#### 14.2 Screen Reader Support
```typescript
// ARIA labels for text editing controls
const TextControls = () => (
  <div role="group" aria-label="Text formatting controls">
    <Button
      aria-label="Bold text"
      aria-pressed={isBold}
      onClick={toggleBold}
    >
      B
    </Button>
    <Slider
      aria-label="Font size"
      aria-valuemin={8}
      aria-valuemax={300}
      aria-valuenow={fontSize}
      onValueChange={setFontSize}
    />
  </div>
);
```

---

## Conclusion

This enhanced text editing system builds upon OpenCut's solid foundation to provide professional-grade typography controls optimized for social media content creation. The system maintains backward compatibility while adding powerful new features including:

- **Advanced Typography**: Letter spacing, line height, text transforms
- **Visual Effects**: Stroke, shadow, and transform controls
- **AI Integration**: Smart text generation and optimization
- **Style Presets**: Platform-optimized text styling
- **Animation System**: Engaging text animations for social media
- **Social Media Optimization**: Platform-specific recommendations and analysis

The modular design allows for incremental implementation while ensuring scalability and maintainability. The system provides creators with the tools needed to produce engaging, professional social media content efficiently.

**Next Steps**: Begin implementation with Phase 1 (Foundation Extensions) while the enhanced timeline integration (Task #13) runs in parallel.