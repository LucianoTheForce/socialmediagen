"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Wand2, Loader2, Images, Palette, AlertCircle } from "lucide-react";
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
  const [isCanvasCountOverridden, setIsCanvasCountOverridden] = useState(false);
  
  // Use real carousel store instead of local state
  const { startGeneration, resetGeneration } = useCarouselStore();
  const generationProgress = useGenerationProgress();

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
      }
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
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Instagram Carousel Generator</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Generate AI-powered Instagram carousels with custom content and backgrounds
        </p>
      </div>

      {/* Prompt Input */}
      <div className="space-y-3">
        <Label htmlFor="carousel-prompt" className="text-sm font-medium">
          Carousel Prompt
        </Label>
        <Textarea
          id="carousel-prompt"
          placeholder="Describe your Instagram carousel... (e.g., '5 tips for better photography with minimalist backgrounds')"
          value={prompt}
          onChange={handlePromptChange}
          className="min-h-[100px] resize-none"
          disabled={generationProgress.isGenerating}
        />
        <p className="text-xs text-muted-foreground">
          Pro tip: Mention the number of slides in your prompt to automatically set the canvas count
          {parsePromptForCanvasCount(prompt) && (
            <span className="text-primary font-medium"> • Auto-detected: {parsePromptForCanvasCount(prompt)} canvases</span>
          )}
        </p>
      </div>

      {/* Canvas Count Selector */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Canvas Count</Label>
        <Select
          value={canvasCount}
          onValueChange={handleCanvasCountChange}
          disabled={generationProgress.isGenerating}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select number of canvases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 canvases</SelectItem>
            <SelectItem value="3">3 canvases</SelectItem>
            <SelectItem value="4">4 canvases</SelectItem>
            <SelectItem value="5">5 canvases</SelectItem>
            <SelectItem value="6">6 canvases</SelectItem>
            <SelectItem value="7">7 canvases</SelectItem>
            <SelectItem value="8">8 canvases</SelectItem>
            <SelectItem value="9">9 canvases</SelectItem>
            <SelectItem value="10">10 canvases</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Background Strategy */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Background Strategy</Label>
        <RadioGroup
          value={backgroundStrategy}
          onValueChange={(value) => setBackgroundStrategy(value as BackgroundStrategy)}
          className="grid grid-cols-1 gap-4"
          disabled={generationProgress.isGenerating}
        >
          <div className="flex items-center space-x-3 rounded-md border p-3 hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="unique" id="unique" />
            <div className="flex-1">
              <label
                htmlFor="unique"
                className="cursor-pointer flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <Images className="h-4 w-4" />
                Unique Backgrounds
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Generate completely different backgrounds for each canvas
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 rounded-md border p-3 hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="thematic" id="thematic" />
            <div className="flex-1">
              <label
                htmlFor="thematic"
                className="cursor-pointer flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <Palette className="h-4 w-4" />
                Thematic Backgrounds
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Create cohesive backgrounds with consistent style and color palette
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Generation Progress */}
      {generationProgress.isGenerating && (
        <div className="space-y-3 p-4 bg-accent/30 rounded-md border">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Generating Carousel</span>
            {generationProgress.totalSlides && (
              <span className="text-xs text-muted-foreground">
                ({generationProgress.currentSlide || 1}/{generationProgress.totalSlides})
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {generationProgress.currentStep === 'text' && 'Generating content structure...'}
                {generationProgress.currentStep === 'images' && 'Creating backgrounds...'}
                {generationProgress.currentStep === 'canvases' && 'Building carousel canvases...'}
                {generationProgress.currentStep === 'complete' && 'Carousel completed!'}
              </span>
              <span>{Math.round(generationProgress.totalProgress)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress.totalProgress}%` }}
              />
            </div>
            {generationProgress.estimatedTimeRemaining && (
              <div className="text-xs text-muted-foreground text-center">
                Est. {Math.ceil(generationProgress.estimatedTimeRemaining / 1000)}s remaining
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {generationProgress.error && !generationProgress.isGenerating && (
        <div className="space-y-2 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Generation Failed</span>
          </div>
          <p className="text-sm text-muted-foreground">{generationProgress.error}</p>
          <Button
            onClick={() => resetGeneration()}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!prompt.trim() || generationProgress.isGenerating}
        className="w-full"
        size="lg"
      >
        {generationProgress.isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {generationProgress.currentStep === 'text' && 'Analyzing content...'}
            {generationProgress.currentStep === 'images' && 'Generating images...'}
            {generationProgress.currentStep === 'canvases' && 'Creating canvases...'}
            {generationProgress.currentStep === 'complete' && 'Finalizing...'}
            {!generationProgress.currentStep && 'Generating...'}
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" />
            Generate Instagram Carousel
          </>
        )}
      </Button>

      {/* Usage Tips */}
      <div className="space-y-3 p-4 bg-muted/30 rounded-md">
        <h3 className="text-sm font-medium">Usage Tips</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Be specific about your content (tips, facts, steps, etc.)</li>
          <li>• Mention style preferences (minimalist, colorful, professional)</li>
          <li>• Include your target audience context</li>
          <li>• Specify if you want text overlay or clean backgrounds</li>
        </ul>
      </div>
    </div>
  );
}