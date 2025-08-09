"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCarouselStore } from "@/stores/carousel";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface SlideTemplate {
  id?: string;
  image_ref?: string;
  components?: Array<{ type: string; text?: string }>;
}

interface TemplatesJson {
  slides?: SlideTemplate[];
}

export default function TemplatesView() {
  const [data, setData] = useState<TemplatesJson>({ slides: [] });
  const [isLoading, setIsLoading] = useState(false);
  const { addCanvasFromTemplate } = useCarouselStore();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetch("/templates/brandsdecoded_ui_per_slide.json")
      .then((r) => r.json())
      .then((json) => {
        if (!isMounted) return;
        setData({ slides: Array.isArray(json?.slides) ? json.slides : [] });
      })
      .catch(() => setData({ slides: [] }))
      .finally(() => setIsLoading(false));
    return () => {
      isMounted = false;
    };
  }, []);

  const slides = useMemo(() => data.slides ?? [], [data]);

  const handleAddAll = async () => {
    console.log('🎯 Add All Templates clicked - checking carousel project...');
    
    // Ensure we have a carousel project before adding templates
    await ensureCarouselProject();
    
    // Add all slides to the carousel
    slides.forEach((slide, index) => {
      console.log(`📝 Adding template ${index + 1}/${slides.length}: ${slide.id}`);
      handleAddSlide(slide);
    });
    
    console.log(`✅ Successfully added ${slides.length} templates to carousel`);
  };

  const handleAddSlide = async (slide: SlideTemplate) => {
    // Ensure we have a carousel project before adding individual slide
    await ensureCarouselProject();
    
    const title = slide.components?.find((c) => c.type === "headline")?.text ?? "Slide";
    const content = slide.components?.find((c) => c.type === "body")?.text ?? "";
    
    console.log(`🎨 Adding slide to carousel: "${title}"`);
    
    // Pass the full slide data including components for better template integration
    addCanvasFromTemplate({
      title,
      content,
      backgroundImage: slide.image_ref,
      backgroundPrompt: "Template background",
      components: slide.components, // Pass original components from template
    });
  };

  const ensureCarouselProject = async () => {
    const store = useCarouselStore.getState();
    
    // If there's no current carousel project, create one
    if (!store.currentProject) {
      console.log('🚀 Creating new carousel project for templates...');
      const newProject = store.createEmptyProject("Instagram Carousel com Templates");
      console.log(`✅ Created carousel project: ${newProject.id}`);
      return newProject;
    }
    
    return store.currentProject;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b flex items-center gap-2">
        <h2 className="text-lg font-semibold">Templates</h2>
        <div className="flex-1" />
        <Button size="sm" onClick={handleAddAll} disabled={isLoading || slides.length === 0}>
          Adicionar todos como carrossel
        </Button>
      </div>

      {/* Animated thumbnail showing slide-by-slide preview */}
      <div className="p-4">
        <AnimatedDeckPreview images={slides.map((s) => s.image_ref).filter(Boolean) as string[]} />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {slides.map((slide, idx) => (
            <TemplateCard key={slide.id ?? idx} slide={slide} onAdd={() => handleAddSlide(slide)} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function TemplateCard({ slide, onAdd }: { slide: SlideTemplate; onAdd: () => void }) {
  const animRef = useRef<HTMLDivElement>(null);
  // Simple fade/scale loop for thumbnail animation
  useEffect(() => {
    const el = animRef.current;
    if (!el) return;
    el.animate(
      [
        { transform: "scale(1)", opacity: 0.95 },
        { transform: "scale(1.02)", opacity: 1 },
        { transform: "scale(1)", opacity: 0.95 },
      ],
      { duration: 2400, iterations: Infinity }
    );
  }, []);

  const title = slide.components?.find((c) => c.type === "headline")?.text ?? "Slide";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm line-clamp-2">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={animRef} className={cn("relative w-full", "rounded-md overflow-hidden bg-muted")}
             style={{ aspectRatio: "4 / 5" }}>
          {slide.image_ref ? (
            <Image
              src={slide.image_ref}
              alt={title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              className="object-cover"
              priority={false}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
              Preview indisponível
            </div>
          )}
          {/* subtle overlay to mimic animated carousel preview */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <div className="text-white text-xs truncate">{title}</div>
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <Button size="sm" className="flex-1" onClick={onAdd}>Adicionar slide</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AnimatedDeckPreview({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!images.length) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), 1800);
    return () => clearInterval(id);
  }, [images.length]);

  if (images.length === 0) return null;

  const current = images[index];

  return (
    <div className="relative mx-auto w-full max-w-[320px] rounded-md overflow-hidden shadow-sm border" style={{ aspectRatio: "4 / 5" }}>
      <Image src={current} alt="Pré-visualização do carrossel" fill className="object-cover" />
      <div className="absolute top-2 right-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded">preview</div>
    </div>
  );
}


