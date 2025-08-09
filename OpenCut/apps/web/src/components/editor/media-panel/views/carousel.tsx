"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Wand2,
  Loader2,
  Images,
  Palette,
  AlertCircle,
  Plus,
  Sparkles,
  Target,
  Layout,
  Settings,
  Lightbulb,
  Zap,
  Camera
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCarouselStore, useGenerationProgress } from "@/stores/carousel";
import { CarouselGenerationOptions } from "@/types/ai-timeline";

type BackgroundStrategy = "unique" | "thematic";

// Intelligent prompt parsing utility
const parsePromptForCanvasCount = (prompt: string): string | null => {
  const text = prompt.toLowerCase();
  
  // Pattern 1: Direct numbers (e.g., "5 tips", "10 steps", "7 ways")
  const directNumberMatch = text.match(/(\d+)\s*(tip|step|way|point|fact|idea|method|strategy|reason|benefit|mistake|secret|hack|trick)/);
  if (directNumberMatch) {
    const count = parseInt(directNumberMatch[1]);
    if (count >= 2 && count <= 10) {
      return count.toString();
    }
  }
  
  // Pattern 2: Written numbers (e.g., "five tips", "ten steps")
  const writtenNumbers: { [key: string]: string } = {
    'two': '2', 'three': '3', 'four': '4', 'five': '5', 'six': '6',
    'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
  };
  
  for (const [written, digit] of Object.entries(writtenNumbers)) {
    const pattern = new RegExp(`${written}\\s*(tip|step|way|point|fact|idea|method|strategy|reason|benefit|mistake|secret|hack|trick)`, 'i');
    if (pattern.test(text)) {
      return digit;
    }
  }
  
  // Pattern 3: Explicit canvas mention (e.g., "create 4 slides", "make 6 canvases")
  const canvasMatch = text.match(/(\d+)\s*(slide|canvas|frame|panel|page)/);
  if (canvasMatch) {
    const count = parseInt(canvasMatch[1]);
    if (count >= 2 && count <= 10) {
      return count.toString();
    }
  }
  
  return null;
};

export function CarouselView() {
  const [prompt, setPrompt] = useState("");
  const [canvasCount, setCanvasCount] = useState("3");
  const [backgroundStrategy, setBackgroundStrategy] = useState<BackgroundStrategy>("unique");
  const [imageProvider, setImageProvider] = useState<"runware">("runware");
  const [layoutPreset, setLayoutPreset] = useState<string>("jitter-mobile-showreel");
  const [isCanvasCountOverridden, setIsCanvasCountOverridden] = useState(false);
  
  // Use real carousel store instead of local state
  const { startGeneration, resetGeneration, createEmptyProject } = useCarouselStore();
  const generationProgress = useGenerationProgress();

  const handleCreateEmpty = () => {
    // Now explicitly creates an empty project on user action (no auto-initialization)
    createEmptyProject();
  };

  // Intelligent prompt parsing effect
  useEffect(() => {
    if (!prompt.trim()) {
      setIsCanvasCountOverridden(false);
      return;
    }
    
    const detectedCount = parsePromptForCanvasCount(prompt);
    if (detectedCount && !isCanvasCountOverridden) {
      setCanvasCount(detectedCount);
    }
  }, [prompt, isCanvasCountOverridden]);

  const handleCanvasCountChange = (value: string) => {
    setCanvasCount(value);
    setIsCanvasCountOverridden(true);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    // Reset override flag when prompt changes significantly
    if (!e.target.value.trim()) {
      setIsCanvasCountOverridden(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Reset any previous generation state
    resetGeneration();

    // Prepare generation options using the correct CarouselGenerationOptions structure
    const options: CarouselGenerationOptions = {
      prompt: prompt.trim(),
      canvasCount: parseInt(canvasCount, 10),
      backgroundStrategy: backgroundStrategy as "unique" | "thematic",
      imageProvider: imageProvider,
      styleOptions: {
        tone: 'friendly',
        targetAudience: 'Instagram users',
        colorScheme: 'modern'
      },
      textOptions: {
        includeHashtags: true,
        includeEmojis: true,
        maxCharactersPerSlide: 150,
        language: 'English'
      },
      imageOptions: {
        style: 'engaging and modern',
        quality: 'high',
        consistency: backgroundStrategy === 'thematic'
      },
      layoutPreset
    };

    console.log("Starting carousel generation with options:", options);

    try {
      // Call the real generation function from carousel store
      await startGeneration(options);
    } catch (error) {
      console.error("Carousel generation failed:", error);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-full">
      {/* Modern Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Instagram Carousel Generator</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform your ideas into engaging Instagram carousels with AI-powered content and stunning visuals
          </p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Badge variant="secondary" className="px-3 py-1">
            <Zap className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            <Camera className="h-3 w-3 mr-1" />
            Instagram Ready
          </Badge>
        </div>
      </div>

      {/* Quick Actions Card */}
      <Card className="border-dashed">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Quick Start
          </CardTitle>
          <CardDescription>
            Jump right in with a blank canvas or generate AI content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleCreateEmpty}
            variant="outline"
            className="w-full h-12 text-base"
            disabled={generationProgress.isGenerating}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Empty Carousel Project
          </Button>
          <p className="text-sm text-muted-foreground mt-3 text-center">
            Start with a blank canvas and manually design your carousel
          </p>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Main Generation Form */}
      <div className="space-y-8">
        {/* Content Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Content & Topic
            </CardTitle>
            <CardDescription>
              Describe your carousel content and let AI create the structure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="carousel-prompt" className="text-base font-medium">
                What's your carousel about?
              </Label>
              <Textarea
                id="carousel-prompt"
                placeholder="e.g., '5 photography tips for beginners with clean, minimal backgrounds' or '7 ways to boost productivity with modern, colorful visuals'"
                value={prompt}
                onChange={handlePromptChange}
                className="min-h-[120px] resize-none text-base leading-relaxed"
                disabled={generationProgress.isGenerating}
              />
              <div className="flex items-center gap-2 text-sm">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span className="text-muted-foreground">
                  Pro tip: Mention the number of slides to auto-detect canvas count
                  {parsePromptForCanvasCount(prompt) && (
                    <Badge variant="outline" className="ml-2 text-primary border-primary/50">
                      Auto-detected: {parsePromptForCanvasCount(prompt)} slides
                    </Badge>
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Number of Slides</Label>
              <Select
                value={canvasCount}
                onValueChange={handleCanvasCountChange}
                disabled={generationProgress.isGenerating}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select number of slides" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 9 }, (_, i) => i + 2).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} slides
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Visual Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Visual Style
            </CardTitle>
            <CardDescription>
              Customize the look and feel of your carousel backgrounds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Provider */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Image Generation Engine</Label>
              <div className="grid gap-3">
                <div className="flex items-center space-x-4 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-primary" />
                        <span className="font-medium">Runware AI</span>
                        <Badge variant="secondary" className="text-xs">Recommended</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Lightning-fast, premium quality images optimized for social media
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Strategy */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Background Approach</Label>
              <RadioGroup
                value={backgroundStrategy}
                onValueChange={(value) => setBackgroundStrategy(value as BackgroundStrategy)}
                className="grid grid-cols-1 gap-4"
                disabled={generationProgress.isGenerating}
              >
                <div className={cn(
                  "flex items-center space-x-4 rounded-lg border-2 p-4 transition-all cursor-pointer hover:border-primary/50",
                  backgroundStrategy === "unique" ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
                )}>
                  <RadioGroupItem value="unique" id="unique" />
                  <div className="flex-1">
                    <label
                      htmlFor="unique"
                      className="cursor-pointer flex items-center gap-2 font-medium leading-none"
                    >
                      <Images className="h-4 w-4 text-blue-500" />
                      Unique Backgrounds
                    </label>
                    <p className="text-sm text-muted-foreground mt-2">
                      Each slide gets a completely different background for maximum variety and visual interest
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center space-x-4 rounded-lg border-2 p-4 transition-all cursor-pointer hover:border-primary/50",
                  backgroundStrategy === "thematic" ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
                )}>
                  <RadioGroupItem value="thematic" id="thematic" />
                  <div className="flex-1">
                    <label
                      htmlFor="thematic"
                      className="cursor-pointer flex items-center gap-2 font-medium leading-none"
                    >
                      <Palette className="h-4 w-4 text-purple-500" />
                      Cohesive Theme
                    </label>
                    <p className="text-sm text-muted-foreground mt-2">
                      All slides share a consistent style and color palette for a unified, professional look
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Layout Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-primary" />
              Layout & Design
            </CardTitle>
            <CardDescription>
              Choose how your content will be arranged and presented
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label className="text-base font-medium">Layout Style</Label>
              <Select
                value={layoutPreset}
                onValueChange={setLayoutPreset}
                disabled={generationProgress.isGenerating}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choose a layout preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jitter-mobile-showreel">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Jitter Mobile Showreel
                    </div>
                  </SelectItem>
                  <SelectItem value="minimal-clean">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Minimal Clean
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Professional layouts with corner rounding and smooth pagination effects
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Generation Progress */}
        {generationProgress.isGenerating && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div className="flex-1">
                    <span className="font-medium">Creating your carousel...</span>
                    {generationProgress.totalSlides && (
                      <span className="text-sm text-muted-foreground ml-2">
                        Slide {generationProgress.currentSlide || 1} of {generationProgress.totalSlides}
                      </span>
                    )}
                  </div>
                  <Badge variant="outline" className="text-primary border-primary/50">
                    {Math.round(generationProgress.totalProgress)}%
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {generationProgress.currentStep === 'text' && '🔍 Analyzing and structuring content...'}
                      {generationProgress.currentStep === 'images' && '🎨 Generating stunning backgrounds...'}
                      {generationProgress.currentStep === 'canvases' && '🚀 Assembling your carousel...'}
                      {generationProgress.currentStep === 'complete' && '✨ Carousel ready!'}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${generationProgress.totalProgress}%` }}
                    />
                  </div>
                  {generationProgress.estimatedTimeRemaining && (
                    <div className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        ~{Math.ceil(generationProgress.estimatedTimeRemaining / 1000)}s remaining
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {generationProgress.error && !generationProgress.isGenerating && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium text-lg">Oops! Something went wrong</span>
                </div>
                <p className="text-muted-foreground">{generationProgress.error}</p>
                <Button
                  onClick={() => resetGeneration()}
                  variant="outline"
                  className="border-destructive/20 hover:bg-destructive/10"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generate Button */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || generationProgress.isGenerating}
              className="w-full h-14 text-lg font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
              size="lg"
            >
              {generationProgress.isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  {generationProgress.currentStep === 'text' && 'Analyzing content...'}
                  {generationProgress.currentStep === 'images' && 'Creating visuals...'}
                  {generationProgress.currentStep === 'canvases' && 'Building carousel...'}
                  {generationProgress.currentStep === 'complete' && 'Almost done...'}
                  {!generationProgress.currentStep && 'Generating...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Instagram Carousel
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Pro Tips */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Lightbulb className="h-5 w-5" />
              Pro Tips for Better Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-700 dark:text-amber-300">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                  <span>Be specific about your content type (tips, steps, facts, etc.)</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                  <span>Include style preferences (minimalist, vibrant, professional)</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                  <span>Mention your target audience for better content</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                  <span>Specify visual preferences for backgrounds</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}