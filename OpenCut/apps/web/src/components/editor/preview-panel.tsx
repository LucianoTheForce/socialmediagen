"use client";

import { useTimelineStore } from "@/stores/timeline-store";
import { TimelineElement, TimelineTrack } from "@/types/timeline";
import { useMediaStore, type MediaItem } from "@/stores/media-store";
import { usePlaybackStore } from "@/stores/playback-store";
import { useEditorStore } from "@/stores/editor-store";
import { VideoPlayer } from "@/components/ui/video-player";
import { AudioPlayer } from "@/components/ui/audio-player";
import { Button } from "@/components/ui/button";
import { Play, Pause, Expand, SkipBack, SkipForward, Plus } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { formatTimeCode } from "@/lib/time";
import { EditableTimecode } from "@/components/ui/editable-timecode";
import { FONT_CLASS_MAP } from "@/lib/font-config";
import { useProjectStore } from "@/stores/project-store";
import { TextElementDragState } from "@/types/editor";
import { CanvasNavigation } from "@/components/editor/canvas-navigation";
import { useCarouselStore } from "@/stores/carousel";
import { isInstagramCarouselProject, getActiveCanvas, addCanvasToCarousel } from "@/types/ai-timeline";

interface ActiveElement {
  element: TimelineElement;
  track: TimelineTrack;
  mediaItem: MediaItem | null;
}

// Helper function to generate correct object-fit and object-position CSS classes
function getObjectFitClasses(
  objectFit: string | undefined,
  alignment: { horizontal?: string; vertical?: string } | undefined
): string {
  const fit = objectFit || 'cover';
  let classes = '';

  // Apply object-fit class
  switch (fit) {
    case 'cover':
      classes += 'object-cover';
      break;
    case 'contain':
      classes += 'object-contain';
      break;
    case 'fill':
      classes += 'object-fill';
      break;
    case 'none':
      classes += 'object-none';
      break;
    case 'scale-down':
      classes += 'object-scale-down';
      break;
    default:
      classes += 'object-cover'; // fallback
  }

  // Apply object-position classes only when they make sense with the object-fit mode
  // Object positioning only works with cover, contain, none, and scale-down
  if (fit === 'cover' || fit === 'contain' || fit === 'none' || fit === 'scale-down') {
    const horizontal = alignment?.horizontal || 'center';
    const vertical = alignment?.vertical || 'middle';

    // Generate object-position class based on alignment
    if (vertical === 'top' && horizontal === 'center') {
      classes += ' object-top';
    } else if (vertical === 'bottom' && horizontal === 'center') {
      classes += ' object-bottom';
    } else if (vertical === 'middle' && horizontal === 'left') {
      classes += ' object-left';
    } else if (vertical === 'middle' && horizontal === 'right') {
      classes += ' object-right';
    } else if (vertical === 'top' && horizontal === 'left') {
      classes += ' object-left-top';
    } else if (vertical === 'top' && horizontal === 'right') {
      classes += ' object-right-top';
    } else if (vertical === 'bottom' && horizontal === 'left') {
      classes += ' object-left-bottom';
    } else if (vertical === 'bottom' && horizontal === 'right') {
      classes += ' object-right-bottom';
    } else {
      classes += ' object-center'; // default center positioning
    }
  }

  return classes;
}

export function PreviewPanel() {
  const { tracks, getTotalDuration, updateTextElement, selectedElements } = useTimelineStore();
  const { mediaItems } = useMediaStore();
  const { currentTime, toggle, setCurrentTime, isPlaying } = usePlaybackStore();
  const { canvasSize } = useEditorStore();
  const { updateProject } = useCarouselStore();
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewDimensions, setPreviewDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const { activeProject } = useProjectStore();
  const { currentProject } = useCarouselStore();

  // Detect canvas selection state (when canvas properties are shown)
  const isCanvasSelected = Boolean(
    selectedElements.length === 0 &&
    currentProject &&
    isInstagramCarouselProject(currentProject)
  );

  const handleAddCanvas = useCallback(() => {
    if (!currentProject || !isInstagramCarouselProject(currentProject)) return;
    
    try {
      const updatedProject = addCanvasToCarousel(currentProject);
      updateProject(updatedProject);
    } catch (error) {
      console.error('Failed to add canvas:', error);
      // Could add toast notification here if needed
    }
  }, [currentProject, updateProject]);
  const [dragState, setDragState] = useState<TextElementDragState>({
    isDragging: false,
    elementId: null,
    trackId: null,
    startX: 0,
    startY: 0,
    initialElementX: 0,
    initialElementY: 0,
    currentX: 0,
    currentY: 0,
    elementWidth: 0,
    elementHeight: 0,
  });

  useEffect(() => {
    const updatePreviewSize = () => {
      if (!containerRef.current) return;

      let availableWidth, availableHeight;

      if (isExpanded) {
        const controlsHeight = 80;
        const marginSpace = 24;
        availableWidth = window.innerWidth - marginSpace;
        availableHeight = window.innerHeight - controlsHeight - marginSpace;
      } else {
        const container = containerRef.current.getBoundingClientRect();
        const computedStyle = getComputedStyle(containerRef.current);
        const paddingTop = parseFloat(computedStyle.paddingTop);
        const paddingBottom = parseFloat(computedStyle.paddingBottom);
        const paddingLeft = parseFloat(computedStyle.paddingLeft);
        const paddingRight = parseFloat(computedStyle.paddingRight);
        const gap = parseFloat(computedStyle.gap) || 16;
        const toolbar = containerRef.current.querySelector("[data-toolbar]");
        const toolbarHeight = toolbar
          ? toolbar.getBoundingClientRect().height
          : 0;

        availableWidth = container.width - paddingLeft - paddingRight;
        availableHeight =
          container.height -
          paddingTop -
          paddingBottom -
          toolbarHeight -
          (toolbarHeight > 0 ? gap : 0);
      }

      const targetRatio = canvasSize.width / canvasSize.height;
      const containerRatio = availableWidth / availableHeight;
      let width, height;

      if (containerRatio > targetRatio) {
        height = availableHeight * (isExpanded ? 0.95 : 1);
        width = height * targetRatio;
      } else {
        width = availableWidth * (isExpanded ? 0.95 : 1);
        height = width / targetRatio;
      }

      setPreviewDimensions({ width, height });
    };

    updatePreviewSize();
    const resizeObserver = new ResizeObserver(updatePreviewSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    if (isExpanded) {
      window.addEventListener("resize", updatePreviewSize);
    }

    return () => {
      resizeObserver.disconnect();
      if (isExpanded) {
        window.removeEventListener("resize", updatePreviewSize);
      }
    };
  }, [canvasSize.width, canvasSize.height, isExpanded]);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.isDragging) return;

      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;

      // Fixed pixel layout: render at canvas pixel size, scaled uniformly to preview
      const scaleRatio = previewDimensions.width / canvasSize.width;
      const newX = dragState.initialElementX + deltaX / scaleRatio;
      const newY = dragState.initialElementY + deltaY / scaleRatio;

      const halfWidth = dragState.elementWidth / scaleRatio / 2;
      const halfHeight = dragState.elementHeight / scaleRatio / 2;

      const constrainedX = Math.max(
        -canvasSize.width / 2 + halfWidth,
        Math.min(canvasSize.width / 2 - halfWidth, newX)
      );
      const constrainedY = Math.max(
        -canvasSize.height / 2 + halfHeight,
        Math.min(canvasSize.height / 2 - halfHeight, newY)
      );

      setDragState((prev) => ({
        ...prev,
        currentX: constrainedX,
        currentY: constrainedY,
      }));
    };

    const handleMouseUp = () => {
      if (dragState.isDragging && dragState.trackId && dragState.elementId) {
        updateTextElement(dragState.trackId, dragState.elementId, {
          x: dragState.currentX,
          y: dragState.currentY,
        });
      }
      setDragState((prev) => ({ ...prev, isDragging: false }));
    };

    if (dragState.isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragState, previewDimensions, canvasSize, updateTextElement]);

  const handleTextMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    element: any,
    trackId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();

    setDragState({
      isDragging: true,
      elementId: element.id,
      trackId,
      startX: e.clientX,
      startY: e.clientY,
      initialElementX: element.x,
      initialElementY: element.y,
      currentX: element.x,
      currentY: element.y,
      elementWidth: rect.width,
      elementHeight: rect.height,
    });
  };

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const hasAnyElements = tracks.some((track) => track.elements.length > 0);
  const getActiveElements = (): ActiveElement[] => {
    const activeElements: ActiveElement[] = [];

    tracks.forEach((track) => {
      track.elements.forEach((element) => {
        if (element.hidden) return;
        const elementStart = element.startTime;
        const elementEnd =
          element.startTime +
          (element.duration - element.trimStart - element.trimEnd);

        if (currentTime >= elementStart && currentTime < elementEnd) {
          let mediaItem = null;
          if (element.type === "media") {
            mediaItem =
              element.mediaId === "test"
                ? null
                : mediaItems.find((item) => item.id === element.mediaId) ||
                  null;
          }
          activeElements.push({ element, track, mediaItem });
        }
      });
    });

    return activeElements;
  };

  const activeElements = getActiveElements();

  // Get media elements for blur background (video/image only)
  const getBlurBackgroundElements = (): ActiveElement[] => {
    return activeElements.filter(
      ({ element, mediaItem }) =>
        element.type === "media" &&
        mediaItem &&
        (mediaItem.type === "video" || mediaItem.type === "image") &&
        element.mediaId !== "test" // Exclude test elements
    );
  };

  const blurBackgroundElements = getBlurBackgroundElements();

  // Render blur background layer
  const renderBlurBackground = () => {
    if (
      !activeProject?.backgroundType ||
      activeProject.backgroundType !== "blur" ||
      blurBackgroundElements.length === 0
    ) {
      return null;
    }

    // Use the first media element for background (could be enhanced to use primary/focused element)
    const backgroundElement = blurBackgroundElements[0];
    const { element, mediaItem } = backgroundElement;

    if (!mediaItem) return null;

    const blurIntensity = activeProject.blurIntensity || 8;

    if (mediaItem.type === "video") {
      return (
        <div
          key={`blur-${element.id}`}
          className="absolute inset-0 overflow-hidden"
          style={{
            filter: `blur(${blurIntensity}px)`,
            transform: "scale(1.1)", // Slightly zoom to avoid blur edge artifacts
            transformOrigin: "center",
          }}
        >
          <VideoPlayer
            src={mediaItem.url!}
            poster={mediaItem.thumbnailUrl}
            clipStartTime={element.startTime}
            trimStart={element.trimStart}
            trimEnd={element.trimEnd}
            clipDuration={element.duration}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    if (mediaItem.type === "image") {
      return (
        <div
          key={`blur-${element.id}`}
          className="absolute inset-0 overflow-hidden"
          style={{
            filter: `blur(${blurIntensity}px)`,
            transform: "scale(1.1)", // Slightly zoom to avoid blur edge artifacts
            transformOrigin: "center",
          }}
        >
          <img
            src={mediaItem.url!}
            alt={mediaItem.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      );
    }

    return null;
  };

  // Render an element
  const renderElement = (elementData: ActiveElement, index: number) => {
    const { element, mediaItem } = elementData;

    // Text elements
    if (element.type === "text") {
      const fontClassName =
        FONT_CLASS_MAP[element.fontFamily as keyof typeof FONT_CLASS_MAP] || "";

      const scaleRatio = previewDimensions.width / canvasSize.width;

      const useFixedBox = element.boxMode === "fixed" && element.boxWidth && element.boxHeight;

      return (
        <div
          key={element.id}
          className="absolute cursor-grab"
          onMouseDown={(e) =>
            handleTextMouseDown(e, element, elementData.track.id)
          }
          style={{
            left: `${
              50 +
              ((dragState.isDragging && dragState.elementId === element.id
                ? dragState.currentX
                : element.x) /
                canvasSize.width) *
                100
            }%`,
            top: `${
              50 +
              ((dragState.isDragging && dragState.elementId === element.id
                ? dragState.currentY
                : element.y) /
                canvasSize.height) *
                100
            }%`,
            transform: `translate(-50%, -50%) rotate(${element.rotation}deg) scale(${scaleRatio})`,
            opacity: element.opacity,
            zIndex: 100 + index, // Text elements on top
          }}
        >
          <div
            className={fontClassName}
            style={{
              fontSize: `${element.fontSize}px`,
              color: element.color,
              backgroundColor: element.backgroundColor,
              textAlign: element.textAlign,
              fontWeight: element.fontWeight,
              fontStyle: element.fontStyle,
              textDecoration: element.textDecoration,
              padding: "4px 8px",
              borderRadius: "2px",
              whiteSpace: useFixedBox ? "pre-wrap" : "pre-wrap",
              width: useFixedBox ? `${element.boxWidth}px` : undefined,
              height: useFixedBox ? `${element.boxHeight}px` : undefined,
              display: useFixedBox ? "flex" : undefined,
              alignItems: useFixedBox
                ? element.verticalAlign === "top"
                  ? "flex-start"
                  : element.verticalAlign === "bottom"
                    ? "flex-end"
                    : "center"
                : undefined,
              overflow: useFixedBox ? "hidden" : undefined,
              wordBreak: useFixedBox ? "break-word" : undefined,
              hyphens: useFixedBox ? "auto" : undefined,
              // Fallback for system fonts that don't have classes
              ...(fontClassName === "" && { fontFamily: element.fontFamily }),
            }}
          >
            {element.content}
          </div>
        </div>
      );
    }

    // Media elements
    if (element.type === "media") {
      // Test elements
      if (!mediaItem || element.mediaId === "test") {
        return (
          <div
            key={element.id}
            className="absolute inset-0 bg-linear-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🎬</div>
              <p className="text-xs text-foreground">{element.name}</p>
            </div>
          </div>
        );
      }

      // Apply visual transformations for media elements
      const applyMediaTransform = (elementId: string) => {
        const scaleRatio = previewDimensions.width / canvasSize.width;
        
        return {
          left: `${50 + (element.x / canvasSize.width) * 100}%`,
          top: `${50 + (element.y / canvasSize.height) * 100}%`,
          transform: `translate(-50%, -50%)
                     rotate(${element.rotation}deg)
                     scale(${(element.scaleX || 1) * scaleRatio}, ${(element.scaleY || 1) * scaleRatio})
                     ${element.flipHorizontal ? 'scaleX(-1)' : ''}
                     ${element.flipVertical ? 'scaleY(-1)' : ''}`,
          opacity: element.opacity || 1,
          zIndex: 50 + index,
        };
      };

      // Video elements
      if (mediaItem.type === "video") {
        return (
          <div
            key={element.id}
            className="absolute"
            style={applyMediaTransform(element.id)}
          >
            <div
              className="relative"
              style={{
                borderRadius: element.borderRadius ? `${element.borderRadius}px` : undefined,
                overflow: 'hidden',
                width: element.boxWidth ? `${element.boxWidth}px` : undefined,
                height: element.boxHeight ? `${element.boxHeight}px` : undefined,
              }}
            >
              <VideoPlayer
                src={mediaItem.url!}
                poster={mediaItem.thumbnailUrl}
                clipStartTime={element.startTime}
                trimStart={element.trimStart}
                trimEnd={element.trimEnd}
                clipDuration={element.duration}
                className={`w-full h-full ${getObjectFitClasses(element.objectFit, element.alignment)}`}
              />
            </div>
          </div>
        );
      }

      // Image elements
      if (mediaItem.type === "image") {
        // Check if this is an AI-generated image with high-resolution metadata
        const isAIImage = (element as any).type === 'ai-image';
        const aiMetadata = isAIImage ? (element as any).aiMetadata : null;
        
        // Use canvas dimensions for display, preserving aspect ratio
        const displayWidth = canvasSize.width;
        const displayHeight = canvasSize.height;
        
        // If we have generation dimensions metadata, we can add quality indicators
        const hasHighRes = aiMetadata?.generationDimensions && (
          aiMetadata.generationDimensions.width > displayWidth ||
          aiMetadata.generationDimensions.height > displayHeight
        );

        return (
          <div
            key={element.id}
            className="absolute"
            style={applyMediaTransform(element.id)}
            title={hasHighRes ?
              `High-resolution AI image (${aiMetadata.generationDimensions.width}×${aiMetadata.generationDimensions.height} → ${displayWidth}×${displayHeight})` :
              undefined
            }
          >
            <div
              className="relative"
              style={{
                borderRadius: element.borderRadius ? `${element.borderRadius}px` : undefined,
                overflow: element.borderRadius ? 'hidden' : 'visible',
              }}
            >
              <img
                src={mediaItem.url!}
                alt={mediaItem.name}
                className={`w-full h-full ${element.objectFit === 'cover' ? 'object-cover' :
                           element.objectFit === 'fill' ? 'object-fill' : 'object-contain'}
                           ${element.alignment?.vertical === 'top' && element.alignment?.horizontal === 'center' ? 'object-top' :
                             element.alignment?.vertical === 'bottom' && element.alignment?.horizontal === 'center' ? 'object-bottom' :
                             element.alignment?.horizontal === 'left' && element.alignment?.vertical === 'middle' ? 'object-left' :
                             element.alignment?.horizontal === 'right' && element.alignment?.vertical === 'middle' ? 'object-right' : 'object-center'}`}
                draggable={false}
                style={{
                  width: `${displayWidth}px`,
                  height: `${displayHeight}px`,
                  // Enable hardware acceleration for smooth high-res image scaling
                  ...(hasHighRes && { transform: 'translateZ(0)' }),
                }}
              />
              
              {/* High-resolution quality indicator (only in development or with debug flag) */}
              {hasHighRes && process.env.NODE_ENV === 'development' && (
                <div className="absolute top-1 right-1 bg-green-500/80 text-white text-xs px-1.5 py-0.5 rounded-sm">
                  HD
                </div>
              )}
            </div>
          </div>
        );
      }

      // Audio elements (no visual representation)
      if (mediaItem.type === "audio") {
        return (
          <div key={element.id} className="absolute inset-0">
            <AudioPlayer
              src={mediaItem.url!}
              clipStartTime={element.startTime}
              trimStart={element.trimStart}
              trimEnd={element.trimEnd}
              clipDuration={element.duration}
              trackMuted={elementData.track.muted}
            />
          </div>
        );
      }
    }

    return null;
  };

  return (
    <>
      <div className="h-full w-full flex flex-col min-h-0 min-w-0 bg-panel rounded-sm relative">
        <div
          ref={containerRef}
          className="flex-1 flex flex-col items-center justify-center min-h-0 min-w-0"
        >
          <div className="flex-1" />
          {hasAnyElements ? (
            <div
              ref={previewRef}
              className={cn(
                "relative overflow-hidden border transition-all duration-200",
                currentProject && isInstagramCarouselProject(currentProject) && "rounded-2xl shadow-lg",
                isCanvasSelected && "border-blue-500 border-2 shadow-blue-500/20 shadow-lg"
              )}
              style={{
                width: previewDimensions.width,
                height: previewDimensions.height,
                background:
                  activeProject?.backgroundType === "blur"
                    ? "transparent"
                    : activeProject?.backgroundColor || "#000000",
              }}
            >
              {renderBlurBackground()}
              {currentProject && isInstagramCarouselProject(currentProject) && (
                <CanvasLoadingOverlay currentProject={currentProject} />
              )}
              {activeElements.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  No elements at current time
                </div>
              ) : (
                activeElements.map((elementData, index) =>
                  renderElement(elementData, index)
                )
              )}
              {currentProject && isInstagramCarouselProject(currentProject) && (
                <CarouselPaginationOverlay currentProject={currentProject} />
              )}
              {activeProject?.backgroundType === "blur" &&
                blurBackgroundElements.length === 0 &&
                activeElements.length > 0 && (
                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-2 rounded">
                    Add a video or image to use blur background
                  </div>
                )}
            </div>
          ) : null}
          
          {/* External Canvas Navigation - positioned outside preview area */}
          {currentProject && isInstagramCarouselProject(currentProject) && (
            <div className="flex items-center justify-center gap-3 mt-3">
              <CanvasNavigation position="external-bottom" />
              <AddCanvasButton onClick={handleAddCanvas} />
            </div>
          )}

          <div className="flex-1" />

          <PreviewToolbar
            hasAnyElements={hasAnyElements}
            onToggleExpanded={toggleExpanded}
            isExpanded={isExpanded}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            toggle={toggle}
            getTotalDuration={getTotalDuration}
          />
        </div>
      </div>

      {isExpanded && (
        <FullscreenPreview
          previewDimensions={previewDimensions}
          activeProject={activeProject}
          currentProject={currentProject}
          renderBlurBackground={renderBlurBackground}
          activeElements={activeElements}
          renderElement={renderElement}
          blurBackgroundElements={blurBackgroundElements}
          hasAnyElements={hasAnyElements}
          toggleExpanded={toggleExpanded}
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          toggle={toggle}
          getTotalDuration={getTotalDuration}
          isCanvasSelected={isCanvasSelected}
        />
      )}
    </>
  );
}

function CarouselPaginationOverlay({
  currentProject,
  variant = "default",
}: {
  currentProject: any;
  variant?: "default" | "fullscreen";
}) {
  if (!isInstagramCarouselProject(currentProject)) return null;
  const activeCanvas = currentProject.canvases.find((c: any) => c.isActive);
  const total = currentProject.canvases.length;
  const activeIndex = activeCanvas
    ? currentProject.canvases.findIndex((c: any) => c.id === activeCanvas.id)
    : 0;

  return (
    <div
      aria-hidden
      className={cn(
        "absolute left-1/2 -translate-x-1/2 flex items-center gap-2",
        variant === "fullscreen" ? "bottom-4" : "bottom-3"
      )}
    >
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "inline-block rounded-full transition-all",
            i === activeIndex ? "w-6 h-1.5 bg-white/90" : "w-1.5 h-1.5 bg-white/40"
          )}
        />
      ))}
    </div>
  );
}

function FullscreenToolbar({
  hasAnyElements,
  onToggleExpanded,
  currentTime,
  setCurrentTime,
  toggle,
  getTotalDuration,
}: {
  hasAnyElements: boolean;
  onToggleExpanded: () => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  toggle: () => void;
  getTotalDuration: () => number;
}) {
  const { isPlaying, seek } = usePlaybackStore();
  const { activeProject } = useProjectStore();
  const [isDragging, setIsDragging] = useState(false);

  const totalDuration = getTotalDuration();
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasAnyElements) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * totalDuration;
    setCurrentTime(Math.max(0, Math.min(newTime, totalDuration)));
  };

  const handleTimelineDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasAnyElements) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const dragX = moveEvent.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, dragX / rect.width));
      const newTime = percentage * totalDuration;
      setCurrentTime(Math.max(0, Math.min(newTime, totalDuration)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };

    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    handleMouseMove(e.nativeEvent);
  };

  const skipBackward = () => {
    const newTime = Math.max(0, currentTime - 1);
    setCurrentTime(newTime);
  };

  const skipForward = () => {
    const newTime = Math.min(totalDuration, currentTime + 1);
    setCurrentTime(newTime);
  };

  return (
    <div
      data-toolbar
      className="flex items-center gap-2 p-1 pt-2 w-full text-foreground relative"
    >
      <div className="flex items-center gap-1 text-[0.70rem] tabular-nums text-foreground/90">
        <EditableTimecode
          time={currentTime}
          duration={totalDuration}
          format="HH:MM:SS:FF"
          fps={activeProject?.fps || 30}
          onTimeChange={seek}
          disabled={!hasAnyElements}
          className="text-foreground/90 hover:bg-white/10"
        />
        <span className="opacity-50">/</span>
        <span>
          {formatTimeCode(
            totalDuration,
            "HH:MM:SS:FF",
            activeProject?.fps || 30
          )}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="text"
          size="icon"
          onClick={skipBackward}
          disabled={!hasAnyElements}
          className="h-auto p-0 text-foreground"
          title="Skip backward 1s"
        >
          <SkipBack className="h-3 w-3" />
        </Button>
        <Button
          variant="text"
          size="icon"
          onClick={toggle}
          disabled={!hasAnyElements}
          className="h-auto p-0 text-foreground hover:text-foreground/80"
        >
          {isPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </Button>
        <Button
          variant="text"
          size="icon"
          onClick={skipForward}
          disabled={!hasAnyElements}
          className="h-auto p-0 text-foreground hover:text-foreground/80"
          title="Skip forward 1s"
        >
          <SkipForward className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex-1 flex items-center gap-2">
        <div
          className={cn(
            "relative h-1 rounded-full cursor-pointer flex-1 bg-foreground/20",
            !hasAnyElements && "opacity-50 cursor-not-allowed"
          )}
          onClick={hasAnyElements ? handleTimelineClick : undefined}
          onMouseDown={hasAnyElements ? handleTimelineDrag : undefined}
          style={{ userSelect: "none" }}
        >
          <div
            className={cn(
              "absolute top-0 left-0 h-full rounded-full bg-foreground",
              !isDragging && "duration-100"
            )}
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 w-3 h-3 rounded-full -translate-y-1/2 -translate-x-1/2 shadow-xs bg-foreground border border-black/20"
            style={{ left: `${progress}%` }}
          />
        </div>
      </div>

      <Button
        variant="text"
        size="icon"
        className="size-4! text-foreground/80 hover:text-foreground"
        onClick={onToggleExpanded}
        title="Exit fullscreen (Esc)"
      >
        <Expand className="size-4!" />
      </Button>
    </div>
  );
}

function FullscreenPreview({
  previewDimensions,
  activeProject,
  currentProject,
  renderBlurBackground,
  activeElements,
  renderElement,
  blurBackgroundElements,
  hasAnyElements,
  toggleExpanded,
  currentTime,
  setCurrentTime,
  toggle,
  getTotalDuration,
  isCanvasSelected,
}: {
  previewDimensions: { width: number; height: number };
  activeProject: any;
  currentProject: any;
  renderBlurBackground: () => React.ReactNode;
  activeElements: ActiveElement[];
  renderElement: (elementData: ActiveElement, index: number) => React.ReactNode;
  blurBackgroundElements: ActiveElement[];
  hasAnyElements: boolean;
  toggleExpanded: () => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  toggle: () => void;
  getTotalDuration: () => number;
  isCanvasSelected: boolean;
}) {
  return (
    <div className="fixed inset-0 z-9999 flex flex-col">
      <div className="flex-1 flex items-center justify-center bg-background">
        <div
          className={cn(
            "relative overflow-hidden border border-border m-3 transition-all duration-200",
            currentProject && isInstagramCarouselProject(currentProject) && "rounded-2xl shadow-xl",
            isCanvasSelected && "border-blue-500 border-2 shadow-blue-500/30 shadow-xl"
          )}
          style={{
            width: previewDimensions.width,
            height: previewDimensions.height,
            background:
              activeProject?.backgroundType === "blur"
                ? "#1a1a1a"
                : activeProject?.backgroundColor || "#1a1a1a",
          }}
        >
          {renderBlurBackground()}
          {currentProject && isInstagramCarouselProject(currentProject) && (
            <CanvasLoadingOverlay currentProject={currentProject} variant="fullscreen" />
          )}
          {activeElements.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-white/60">
              No elements at current time
            </div>
          ) : (
            activeElements.map((elementData, index) =>
              renderElement(elementData, index)
            )
          )}
          {currentProject && isInstagramCarouselProject(currentProject) && (
            <CarouselPaginationOverlay currentProject={currentProject} variant="fullscreen" />
          )}
          {activeProject?.backgroundType === "blur" &&
            blurBackgroundElements.length === 0 &&
            activeElements.length > 0 && (
              <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-2 rounded">
                Add a video or image to use blur background
              </div>
            )}
          
          {/* Canvas Navigation for Instagram Carousel Projects */}
          {currentProject && isInstagramCarouselProject(currentProject) && (
            <CanvasNavigation position="bottom-right" />
          )}
        </div>
      </div>
      <div className="p-4 bg-background">
        <FullscreenToolbar
          hasAnyElements={hasAnyElements}
          onToggleExpanded={toggleExpanded}
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          toggle={toggle}
          getTotalDuration={getTotalDuration}
        />
      </div>
    </div>
  );
}

function CanvasLoadingOverlay({
  currentProject,
  variant = "default",
}: {
  currentProject: any;
  variant?: "default" | "fullscreen";
}) {
  const canvasLoadingStates = useCarouselStore((s) => s.canvasLoadingStates);
  const activeCanvas = getActiveCanvas(currentProject);
  if (!activeCanvas) return null;
  const state = canvasLoadingStates[activeCanvas.id];
  if (!state || (!state.hasPlaceholder && !state.isImageLoading && !state.isImageLoaded)) return null;

  const showBar = state.isImageLoading || state.hasPlaceholder;
  const progress = Math.max(0, Math.min(100, state.imageLoadProgress || 0));

  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      {showBar && (
        <div className={cn("absolute bottom-0 left-0 right-0 p-3", variant === "fullscreen" ? "pb-4" : "pb-3") }>
          <div className="mx-auto w-2/3 max-w-[520px] bg-black/40 backdrop-blur-sm rounded-md border border-white/10 text-white px-3 py-2 shadow-sm">
            <div className="flex items-center justify-between text-[11px] opacity-90">
              <span>Generating background…</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-white/20">
              <div
                className="h-1.5 rounded-full bg-white transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddCanvasButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="flex items-center gap-2 bg-background/80 backdrop-blur-sm hover:bg-background"
      title="Add new canvas to carousel"
    >
      <Plus className="w-4 h-4" />
      Canvas
    </Button>
  );
}

function PreviewToolbar({
  hasAnyElements,
  onToggleExpanded,
  isExpanded,
  currentTime,
  setCurrentTime,
  toggle,
  getTotalDuration,
}: {
  hasAnyElements: boolean;
  onToggleExpanded: () => void;
  isExpanded: boolean;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  toggle: () => void;
  getTotalDuration: () => number;
}) {
  const { isPlaying } = usePlaybackStore();

  if (isExpanded) {
    return (
      <FullscreenToolbar
        {...{
          hasAnyElements,
          onToggleExpanded,
          currentTime,
          setCurrentTime,
          toggle,
          getTotalDuration,
        }}
      />
    );
  }

  return (
    <div
      data-toolbar
      className="flex justify-between gap-2 px-1.5 pr-4 py-1.5 border border-border/50 w-auto absolute bottom-4 right-4 bg-black/20 rounded-full backdrop-blur-l text-white"
    >
      <div className="flex items-center gap-2">
        <Button
          variant="text"
          size="icon"
          onClick={toggle}
          disabled={!hasAnyElements}
          className="h-auto p-0"
        >
          {isPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </Button>
        <Button
          variant="text"
          size="icon"
          className="size-4!"
          onClick={onToggleExpanded}
          title="Enter fullscreen"
        >
          <Expand className="size-4!" />
        </Button>
      </div>
    </div>
  );
}
