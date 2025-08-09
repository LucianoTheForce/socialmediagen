"use client";

import React, { useMemo, useEffect, useCallback } from 'react';
import { Plus, MoreHorizontal, Copy, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  useCarouselStore,
  useCurrentProject,
  useActiveCanvas,
  useNavigationState,
  CanvasLoadingState
} from '@/stores/carousel';
import { InstagramCarouselCanvas } from '@/types/ai-timeline';
import { useTimelineStore } from '@/stores/timeline-store';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CanvasNavigationProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'external-left' | 'external-right' | 'external-top' | 'external-bottom';
  className?: string;
}

export function CanvasNavigation({
  position = 'bottom-right',
  className
}: CanvasNavigationProps) {
  const currentProject = useCurrentProject();
  const activeCanvas = useActiveCanvas();
  const navigationState = useNavigationState();
  const {
    setActiveCanvas,
    addCanvas,
    removeCanvas,
    duplicateCanvas,
    regenerateSlide,
    updateNavigation,
    getCanvasLoadingState
  } = useCarouselStore();

  // Only show if we have a carousel project
  if (!currentProject || currentProject.type !== 'instagram-carousel') {
    return null;
  }

  const { canvases } = currentProject;
  const {
    isNavigationVisible,
    thumbnailSize,
    showAddButton,
    maxCanvasCount
  } = navigationState;

  // Don't render if navigation is hidden
  if (!isNavigationVisible) {
    return null;
  }

  const canAddMore = canvases.length < maxCanvasCount;

  // 🚀 Instagram-like keyboard navigation + Canvas Management
  const handleKeyboardNavigation = useCallback((event: KeyboardEvent) => {
    // Only handle if we have canvases and the navigation is visible
    if (!canvases.length || !activeCanvas || !isNavigationVisible) return;
    
    // Don't interfere with form inputs
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.getAttribute('contenteditable') === 'true'
    )) {
      return;
    }

    const currentIndex = canvases.findIndex(c => c.id === activeCanvas.id);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : canvases.length - 1; // Wrap to last
        break;
      case 'ArrowRight':
        event.preventDefault();
        nextIndex = currentIndex < canvases.length - 1 ? currentIndex + 1 : 0; // Wrap to first
        break;
      
      // Canvas Management Shortcuts
      case 'd':
      case 'D':
        // Ctrl+Shift+D or Cmd+Shift+D to duplicate active canvas (avoiding conflict with timeline Ctrl+D)
        if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
          event.preventDefault();
          if (canAddMore) {
            duplicateCanvas(activeCanvas.id);
            console.log(`📋 Keyboard shortcut: Duplicated canvas "${activeCanvas.slideMetadata.title}"`);
          } else {
            console.log('⚠️ Cannot duplicate: Maximum canvas limit reached');
          }
          return;
        }
        break;
      
      case 'Delete':
      case 'Backspace':
        // Delete key to remove active canvas (only if not the last one)
        if (canvases.length > 1) {
          event.preventDefault();
          removeCanvas(activeCanvas.id);
          console.log(`🗑️ Keyboard shortcut: Removed canvas "${activeCanvas.slideMetadata.title}"`);
        } else {
          console.log('⚠️ Cannot remove: Must keep at least one canvas');
        }
        return;
      
      default:
        return; // Don't handle other keys
    }

    // Handle navigation (only for arrow keys)
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const nextCanvas = canvases[nextIndex];
      if (nextCanvas && nextCanvas.id !== activeCanvas.id) {
        setActiveCanvas(nextCanvas.id);
        // Switch timeline context
        useTimelineStore.getState().switchToCanvas(nextCanvas.id);
        console.log(`🎯 Keyboard navigation: Canvas ${nextIndex + 1}/${canvases.length}`);
      }
    }
  }, [canvases, activeCanvas, isNavigationVisible, setActiveCanvas, canAddMore, duplicateCanvas, removeCanvas]);

  // Set up keyboard event listeners
  useEffect(() => {
    // Only add listeners if we have a carousel project
    if (!currentProject || currentProject.type !== 'instagram-carousel') {
      return;
    }

    document.addEventListener('keydown', handleKeyboardNavigation);
    
    return () => {
      document.removeEventListener('keydown', handleKeyboardNavigation);
    };
  }, [currentProject, handleKeyboardNavigation]);

  // Calculate thumbnail dimensions based on size preference
  const thumbnailDimensions = useMemo(() => {
    const baseSize = {
      small: 40,
      medium: 56,
      large: 72
    }[thumbnailSize];

    // Instagram post aspect ratio (1:1)
    return {
      width: baseSize,
      height: baseSize
    };
  }, [thumbnailSize]);

  const handleCanvasClick = (canvasId: string) => {
    setActiveCanvas(canvasId);
    // Switch timeline context when canvas changes
    useTimelineStore.getState().switchToCanvas(canvasId);
  };

  const handleAddCanvas = () => {
    if (canAddMore) {
      addCanvas();
    }
  };

  const handleRemoveCanvas = (canvasId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (canvases.length > 1) { // Don't allow removing the last canvas
      removeCanvas(canvasId);
    }
  };

  const handleDuplicateCanvas = (canvasId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (canAddMore) {
      duplicateCanvas(canvasId);
    }
  };

  const handleRegenerateCanvas = async (canvasId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await regenerateSlide(canvasId);
  };

  // Position classes with external positioning support
  const positionClasses: Record<NonNullable<CanvasNavigationProps['position']>, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    // External positioning - outside the preview bounds
    'external-left': 'top-1/2 left-4 -translate-y-1/2',
    'external-right': 'top-1/2 right-4 -translate-y-1/2',
    'external-top': 'top-4 left-1/2 -translate-x-1/2',
    'external-bottom': 'bottom-4 left-1/2 -translate-x-1/2'
  };

  return (
    <div
      className={cn(
        "absolute z-10 bg-black/80 backdrop-blur-sm rounded-xl border border-white/10 shadow-lg",
        positionClasses[position],
        className,
        // Make responsive based on canvas count
        canvases.length > 6 ? "max-w-[90vw] overflow-x-auto" : "",
        "flex items-center gap-2 p-2"
      )}
    >
      {/* Scrollable Canvas Container */}
      <div className={cn(
        "flex items-center gap-1.5",
        canvases.length > 6 ? "overflow-x-auto scrollbar-thin" : "",
        "min-w-0 scroll-smooth" // Allow shrinking and smooth scrolling
      )}>
        {canvases.map((canvas, index) => {
          const loadingState = getCanvasLoadingState(canvas.id);
          return (
            <CanvasThumbnail
              key={canvas.id}
              canvas={canvas}
              index={index}
              isActive={canvas.id === activeCanvas?.id}
              dimensions={thumbnailDimensions}
              loadingState={loadingState}
              onClick={() => handleCanvasClick(canvas.id)}
              onRemove={canvases.length > 1 ? (e) => handleRemoveCanvas(canvas.id, e) : undefined}
              onDuplicate={canAddMore ? (e) => handleDuplicateCanvas(canvas.id, e) : undefined}
              onRegenerate={(e) => handleRegenerateCanvas(canvas.id, e)}
            />
          );
        })}
        
        {/* Add Canvas Button - Inside scrollable container */}
        {showAddButton && canAddMore && (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-auto p-1 text-white/70 hover:text-white hover:bg-white/20 border-2 border-dashed border-white/30 hover:border-white/50 transition-all shrink-0",
              "animate-pulse hover:animate-none" // Subtle animation to make it more visible
            )}
            style={{
              width: thumbnailDimensions.width,
              height: thumbnailDimensions.height
            }}
            onClick={handleAddCanvas}
            title="Add new canvas"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Navigation Controls - Always visible */}
      <div className="flex items-center gap-1 ml-1 pl-1 border-l border-white/20 shrink-0">
        <Badge
          variant="secondary"
          className="text-xs bg-white/20 text-white border-white/30 whitespace-nowrap"
        >
          {canvases.length}/{maxCanvasCount}
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-6 p-1 text-white/70 hover:text-white hover:bg-white/20"
              title="Canvas navigation settings"
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => updateNavigation({ thumbnailSize: 'small' })}>
              <span className="flex items-center gap-2">
                Small thumbnails
                {thumbnailSize === 'small' && <div className="w-2 h-2 bg-primary rounded-full" />}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateNavigation({ thumbnailSize: 'medium' })}>
              <span className="flex items-center gap-2">
                Medium thumbnails
                {thumbnailSize === 'medium' && <div className="w-2 h-2 bg-primary rounded-full" />}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateNavigation({ thumbnailSize: 'large' })}>
              <span className="flex items-center gap-2">
                Large thumbnails
                {thumbnailSize === 'large' && <div className="w-2 h-2 bg-primary rounded-full" />}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => updateNavigation({ isNavigationVisible: false })}>
              Hide navigation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

interface CanvasThumbnailProps {
  canvas: InstagramCarouselCanvas;
  index: number;
  isActive: boolean;
  dimensions: { width: number; height: number };
  loadingState: CanvasLoadingState | null;
  onClick: () => void;
  onRemove?: (event: React.MouseEvent) => void;
  onDuplicate?: (event: React.MouseEvent) => void;
  onRegenerate?: (event: React.MouseEvent) => void;
}

function CanvasThumbnail({
  canvas,
  index,
  isActive,
  dimensions,
  loadingState,
  onClick,
  onRemove,
  onDuplicate,
  onRegenerate
}: CanvasThumbnailProps) {
  const hasContextMenu = onRemove || onDuplicate || onRegenerate;
  const isLoading = loadingState?.isImageLoading;
  const hasPlaceholder = loadingState?.hasPlaceholder;
  const hasError = loadingState?.error;
  const progress = loadingState?.imageLoadProgress || 0;

  return (
    <div className="relative group">
      {/* Thumbnail Button */}
      <button
        className={cn(
          "relative overflow-hidden rounded-md border-2 transition-all bg-gradient-to-br from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30",
          isActive
            ? "border-white shadow-lg shadow-white/20"
            : "border-white/30 hover:border-white/50",
          hasError && "border-red-500/50",
          isLoading && "animate-pulse"
        )}
        style={dimensions}
        onClick={onClick}
        title={`Canvas ${index + 1}: ${canvas.slideMetadata.title}${isLoading ? ' (Loading...)' : ''}${hasError ? ' (Error)' : ''}`}
      >
        {/* Background Image or Placeholder */}
        {canvas.backgroundImage && !hasPlaceholder ? (
          <img
            src={canvas.backgroundImage}
            alt={`Canvas ${index + 1}`}
            className={cn(
              "w-full h-full object-cover transition-opacity",
              isLoading ? "opacity-70" : "opacity-100"
            )}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800/50 to-gray-700/50">
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-white/70 animate-spin mb-1" />
            ) : hasError ? (
              <div className="w-4 h-4 bg-red-500 rounded mb-1" />
            ) : (
              <div className="w-4 h-4 bg-white/20 rounded mb-1" />
            )}
            <span className="text-white/70 text-xs font-medium">
              {hasError ? 'ERR' : index + 1}
            </span>
          </div>
        )}

        {/* Loading Progress Overlay */}
        {isLoading && progress > 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-8 h-8 relative">
              <div className="absolute inset-0 rounded-full border-2 border-white/20" />
              <div
                className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin"
                style={{
                  transform: `rotate(${(progress / 100) * 360}deg)`
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Overlay for title preview */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1">
          <div className="text-white text-xs font-medium truncate leading-tight">
            {canvas.slideMetadata.title}
          </div>
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-lg" />
        )}
      </button>

      {/* Context Menu */}
      {hasContextMenu && (
        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-1 bg-black/70 backdrop-blur-sm border border-white/30 text-white/70 hover:text-white hover:bg-black/90 rounded-full"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {onDuplicate && (
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="w-3 h-3 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {onRegenerate && (
                <DropdownMenuItem onClick={onRegenerate}>
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Regenerate
                </DropdownMenuItem>
              )}
              {(onDuplicate || onRegenerate) && onRemove && <DropdownMenuSeparator />}
              {onRemove && (
                <DropdownMenuItem onClick={onRemove} className="text-destructive">
                  <Trash2 className="w-3 h-3 mr-2" />
                  Remove
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Generation status indicator */}
      {canvas.slideMetadata.isRegenerating && (
        <div className="absolute top-1 left-1">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" title="Regenerating..." />
        </div>
      )}
    </div>
  );
}

// Hook to toggle navigation visibility from outside
export function useCanvasNavigation() {
  const { updateNavigation, navigation } = useCarouselStore();
  
  const toggleVisibility = () => {
    updateNavigation({ isNavigationVisible: !navigation.isNavigationVisible });
  };

  const setPosition = (position: CanvasNavigationProps['position']) => {
    // This could be extended to store position in navigation state if needed
    console.log('Setting canvas navigation position:', position);
  };

  return {
    isVisible: navigation.isNavigationVisible,
    toggleVisibility,
    setPosition
  };
}