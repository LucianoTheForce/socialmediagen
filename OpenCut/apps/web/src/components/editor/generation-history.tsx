"use client";

import React, { useState } from 'react';
import dayjs from 'dayjs';
import { 
  History, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  DollarSign,
  Image,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  useCarouselStore,
  useCurrentProject,
  useActiveCanvas
} from '@/stores/carousel';
import { InstagramCarouselCanvas } from '@/types/ai-timeline';

interface GenerationHistoryEntry {
  id: string;
  timestamp: Date;
  prompt: string;
  type: string;
  result: string;
  cost: number;
  generationNumber: number;
  parameters: Record<string, any>;
}

interface GenerationHistoryProps {
  className?: string;
  maxHeight?: string;
}

export function GenerationHistory({ 
  className,
  maxHeight = "400px" 
}: GenerationHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentProject = useCurrentProject();
  const activeCanvas = useActiveCanvas();
  const { regenerateSlide } = useCarouselStore();

  // Only show for carousel projects
  if (!currentProject || currentProject.type !== 'instagram-carousel' || !activeCanvas) {
    return null;
  }

  // Mock generation history for now - this will be replaced with real data later
  const mockHistory: GenerationHistoryEntry[] = [];
  
  if (activeCanvas.backgroundImage) {
    mockHistory.push({
      id: 'gen1',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      prompt: activeCanvas.slideMetadata.backgroundPrompt,
      type: 'background',
      result: activeCanvas.backgroundImage,
      cost: 0.05,
      generationNumber: 1,
      parameters: { style: 'photorealistic', quality: 'high' }
    });
  }

  const canvasHistory = mockHistory;

  if (canvasHistory.length === 0) {
    return null;
  }

  const handleRestoreGeneration = async (historyId: string) => {
    // For now, just trigger a regeneration
    await regenerateSlide(activeCanvas.id);
  };

  return (
    <Card className={cn("w-full", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-muted-foreground" />
              <div>
                <h3 className="font-medium">Generation History</h3>
                <p className="text-sm text-muted-foreground">
                  {canvasHistory.length} generation{canvasHistory.length !== 1 ? 's' : ''} for {activeCanvas.slideMetadata.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {canvasHistory.length}
              </Badge>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <Separator />
          <div className="p-4">
            <div 
              className="space-y-3 overflow-y-auto"
              style={{ maxHeight }}
            >
              {canvasHistory.map((entry: GenerationHistoryEntry, index: number) => (
                <HistoryEntry
                  key={entry.id}
                  entry={entry}
                  isLatest={index === 0}
                  isCurrent={entry.result === activeCanvas.backgroundImage}
                  onRestore={() => handleRestoreGeneration(entry.id)}
                />
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

interface HistoryEntryProps {
  entry: GenerationHistoryEntry;
  isLatest: boolean;
  isCurrent: boolean;
  onRestore: () => void;
}

function HistoryEntry({ entry, isLatest, isCurrent, onRestore }: HistoryEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={cn(
      "p-3 transition-all",
      isCurrent && "ring-2 ring-primary",
      isLatest && !isCurrent && "ring-1 ring-muted-foreground/30"
    )}>
      <div className="flex items-start justify-between gap-3">
        {/* Generation Preview */}
        <div className="flex items-start gap-3 flex-1">
          <div className="relative">
            {entry.result.startsWith('http') ? (
              <img
                src={entry.result}
                alt="Generation preview"
                className="w-12 h-12 rounded-md object-cover bg-muted"
              />
            ) : (
              <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                <Image className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            
            {isCurrent && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-primary-foreground rounded-full" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">
                Generation #{entry.generationNumber || 1}
              </span>
              {isLatest && (
                <Badge variant="secondary" className="text-xs">Latest</Badge>
              )}
              {isCurrent && (
                <Badge variant="default" className="text-xs">Current</Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {dayjs(entry.timestamp).format('MMM D, HH:mm')}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Generated on {dayjs(entry.timestamp).format('MMMM D, YYYY at HH:mm')}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    ${entry.cost.toFixed(3)}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Generation cost: ${entry.cost.toFixed(4)}
                </TooltipContent>
              </Tooltip>

              <div className="flex items-center gap-1">
                <Image className="w-3 h-3" />
                {entry.type}
              </div>
            </div>

            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <div className="text-sm text-foreground/80 mb-2">
                {entry.prompt.length > 60 && !isExpanded ? (
                  <>
                    {entry.prompt.substring(0, 60)}...
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-xs text-muted-foreground"
                      >
                        show more
                      </Button>
                    </CollapsibleTrigger>
                  </>
                ) : (
                  <span>{entry.prompt}</span>
                )}
              </div>

              <CollapsibleContent>
                {entry.parameters && Object.keys(entry.parameters).length > 0 && (
                  <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                    <div className="font-medium text-muted-foreground mb-1">Parameters:</div>
                    <div className="space-y-1">
                      {Object.entries(entry.parameters).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {entry.prompt.length > 60 && (
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-xs text-muted-foreground mt-1"
                    >
                      show less
                    </Button>
                  </CollapsibleTrigger>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          {!isCurrent && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={onRestore}
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Restore this generation
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </Card>
  );
}

// Hook for accessing generation history from other components
export function useGenerationHistoryForCanvas(canvasId: string) {
  const currentProject = useCurrentProject();
  
  if (!currentProject || currentProject.type !== 'instagram-carousel') {
    return { history: [], hasHistory: false, totalGenerations: 0, totalCost: 0 };
  }

  const canvas = currentProject.canvases.find((c: InstagramCarouselCanvas) => c.id === canvasId);
  const hasBackground = Boolean(canvas?.backgroundImage);
  
  // Mock data for now
  const mockHistory = hasBackground ? [{
    id: 'gen1',
    timestamp: new Date(),
    prompt: canvas?.slideMetadata.backgroundPrompt || '',
    result: canvas?.backgroundImage || '',
    cost: 0.05
  }] : [];

  return {
    history: mockHistory,
    hasHistory: mockHistory.length > 0,
    totalGenerations: mockHistory.length,
    totalCost: mockHistory.reduce((sum, entry) => sum + (entry.cost || 0), 0)
  };
}

// Quick access component for showing history stats
export function GenerationStats({ canvasId, className }: { 
  canvasId: string; 
  className?: string;
}) {
  const { history, totalGenerations, totalCost } = useGenerationHistoryForCanvas(canvasId);

  if (totalGenerations === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <div className="flex items-center gap-1">
        <History className="w-3 h-3" />
        {totalGenerations} gen{totalGenerations !== 1 ? 's' : ''}
      </div>
      <div className="flex items-center gap-1">
        <DollarSign className="w-3 h-3" />
        ${totalCost.toFixed(3)}
      </div>
    </div>
  );
}