import { DraggableMediaItem } from "@/components/ui/draggable-item";
import { TIMELINE_CONSTANTS } from "@/constants/timeline-constants";
import { useTimelineStore } from "@/stores/timeline-store";
import { type TextElement } from "@/types/timeline";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useCarouselStore } from "@/stores/carousel";

const textData: TextElement = {
  id: "default-text",
  type: "text",
  name: "Default text",
  content: "Default text",
  fontSize: 48,
  fontFamily: "Arial",
  color: "#ffffff",
  backgroundColor: "transparent",
  textAlign: "center" as const,
  fontWeight: "normal" as const,
  fontStyle: "normal" as const,
  textDecoration: "none" as const,
  x: 0,
  y: 0,
  rotation: 0,
  opacity: 1,
  duration: TIMELINE_CONSTANTS.DEFAULT_TEXT_DURATION,
  startTime: 0,
  trimStart: 0,
  trimEnd: 0,
};

export function TextView() {
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    // Load templates JSON from public folder
    fetch("/templates/brandsdecoded_ui_per_slide.json")
      .then((r) => r.json())
      .then((data) => setTemplates(Array.isArray(data.slides) ? data.slides : []))
      .catch(() => setTemplates([]));
  }, []);

  const handleAddTemplate = (slide: any) => {
    useCarouselStore.getState().addCanvasFromTemplate({
      title: slide?.components?.find((c: any) => c.type === "headline")?.text || "Slide",
      content: slide?.components?.find((c: any) => c.type === "body")?.text || "",
      backgroundImage: slide?.image_ref || undefined,
      backgroundPrompt: "Template background",
    });
  };

  const templateItems = useMemo(() => templates.slice(0, 20), [templates]);

  return (
    <div className="p-4 space-y-4">
      {/* Default text draggable */}
      <DraggableMediaItem
        name="Default text"
        preview={
          <div className="flex items-center justify-center w-full h-full bg-panel-accent rounded">
            <span className="text-xs select-none">Default text</span>
          </div>
        }
        dragData={{
          id: textData.id,
          type: textData.type,
          name: textData.name,
          content: textData.content,
        }}
        aspectRatio={1}
        onAddToTimeline={(currentTime) =>
          useTimelineStore.getState().addTextAtTime(textData, currentTime)
        }
        showLabel={false}
      />

      {/* Templates grid */}
      {templateItems.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {templateItems.map((slide, idx) => (
            <DraggableMediaItem
              key={slide.id || idx}
              name={slide.id || `Template ${idx + 1}`}
              preview={
                <div className="relative w-full h-full">
                  <Image
                    src={typeof slide.image_ref === "string" ? slide.image_ref : "/open-graph/default.jpg"}
                    alt={slide.id || `Template ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              }
              dragData={{
                type: "template-slide",
                id: slide.id || `template_${idx}`,
              }}
              aspectRatio={1}
              showLabel={false}
              onAddToTimeline={() => handleAddTemplate(slide)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
