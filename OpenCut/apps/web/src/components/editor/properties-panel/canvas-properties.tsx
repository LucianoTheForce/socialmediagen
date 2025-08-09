"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useCarouselStore, useActiveCanvas } from "@/stores/carousel";
import { useEditorStore } from "@/stores/editor-store";
import { InstagramCarouselCanvas, CANVAS_FORMATS } from "@/types/ai-timeline";
import { cn } from "@/lib/utils";
import {
  Palette,
  Move,
  Expand,
  Clock,
  Square,
  Layers,
  Settings,
  AlertTriangle
} from "lucide-react";

interface CanvasPropertiesProps {
  className?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

// Validation constants
const CANVAS_LIMITS = {
  MIN_SIZE: 1,
  MAX_SIZE: 8192,
  MIN_POSITION: -10000,
  MAX_POSITION: 10000,
  MIN_DURATION: 0.1,
  MAX_DURATION: 300,
  RECOMMENDED_MAX_SIZE: 4096
};

// Validation functions
const validateCanvasSize = (width: number, height: number): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!Number.isInteger(width) || width < CANVAS_LIMITS.MIN_SIZE) {
    errors.push({ field: 'width', message: `Width must be at least ${CANVAS_LIMITS.MIN_SIZE}px` });
  } else if (width > CANVAS_LIMITS.MAX_SIZE) {
    errors.push({ field: 'width', message: `Width cannot exceed ${CANVAS_LIMITS.MAX_SIZE}px` });
  } else if (width > CANVAS_LIMITS.RECOMMENDED_MAX_SIZE) {
    errors.push({ field: 'width', message: `Warning: Width over ${CANVAS_LIMITS.RECOMMENDED_MAX_SIZE}px may cause performance issues` });
  }
  
  if (!Number.isInteger(height) || height < CANVAS_LIMITS.MIN_SIZE) {
    errors.push({ field: 'height', message: `Height must be at least ${CANVAS_LIMITS.MIN_SIZE}px` });
  } else if (height > CANVAS_LIMITS.MAX_SIZE) {
    errors.push({ field: 'height', message: `Height cannot exceed ${CANVAS_LIMITS.MAX_SIZE}px` });
  } else if (height > CANVAS_LIMITS.RECOMMENDED_MAX_SIZE) {
    errors.push({ field: 'height', message: `Warning: Height over ${CANVAS_LIMITS.RECOMMENDED_MAX_SIZE}px may cause performance issues` });
  }
  
  // Check for extreme aspect ratios
  if (width > 0 && height > 0) {
    const aspectRatio = width / height;
    if (aspectRatio > 10 || aspectRatio < 0.1) {
      errors.push({ field: 'aspect', message: 'Warning: Extreme aspect ratios may not display properly' });
    }
  }
  
  return errors;
};

const validateCanvasPosition = (x: number, y: number): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!Number.isFinite(x)) {
    errors.push({ field: 'x', message: 'X position must be a valid number' });
  } else if (x < CANVAS_LIMITS.MIN_POSITION || x > CANVAS_LIMITS.MAX_POSITION) {
    errors.push({ field: 'x', message: `X position must be between ${CANVAS_LIMITS.MIN_POSITION} and ${CANVAS_LIMITS.MAX_POSITION}` });
  }
  
  if (!Number.isFinite(y)) {
    errors.push({ field: 'y', message: 'Y position must be a valid number' });
  } else if (y < CANVAS_LIMITS.MIN_POSITION || y > CANVAS_LIMITS.MAX_POSITION) {
    errors.push({ field: 'y', message: `Y position must be between ${CANVAS_LIMITS.MIN_POSITION} and ${CANVAS_LIMITS.MAX_POSITION}` });
  }
  
  return errors;
};

const validateCanvasDuration = (duration: number): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!Number.isFinite(duration) || duration <= 0) {
    errors.push({ field: 'duration', message: 'Duration must be a positive number' });
  } else if (duration < CANVAS_LIMITS.MIN_DURATION) {
    errors.push({ field: 'duration', message: `Duration must be at least ${CANVAS_LIMITS.MIN_DURATION} seconds` });
  } else if (duration > CANVAS_LIMITS.MAX_DURATION) {
    errors.push({ field: 'duration', message: `Duration cannot exceed ${CANVAS_LIMITS.MAX_DURATION} seconds` });
  }
  
  return errors;
};

const validateHexColor = (color: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  
  if (!color) {
    errors.push({ field: 'color', message: 'Color is required' });
  } else if (!hexRegex.test(color)) {
    errors.push({ field: 'color', message: 'Color must be a valid hex color (e.g., #FF0000 or #F00)' });
  }
  
  return errors;
};

// Error display component
function ValidationErrorDisplay({ errors, field }: { errors: ValidationError[]; field?: string }) {
  const fieldErrors = field ? errors.filter(e => e.field === field) : errors;
  
  if (fieldErrors.length === 0) return null;
  
  return (
    <div className="space-y-1">
      {fieldErrors.map((error, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center gap-1 text-xs",
            error.message.startsWith('Warning:') ? "text-amber-600" : "text-red-600"
          )}
        >
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span>{error.message}</span>
        </div>
      ))}
    </div>
  );
}

export function CanvasProperties({ className }: CanvasPropertiesProps) {
  const activeCanvas = useActiveCanvas();
  const { updateCanvas } = useCarouselStore();
  const { canvasSize, setCanvasSize } = useEditorStore();

  // Initialize canvas size from persisted customSize or format defaults
  useEffect(() => {
    if (activeCanvas) {
      const persistedSize = activeCanvas.customSize;
      const formatSize = activeCanvas.format?.dimensions;
      
      if (persistedSize) {
        // Load from persisted custom size
        setCanvasSize({
          width: persistedSize.width,
          height: persistedSize.height
        });
      } else if (formatSize) {
        // Fall back to format defaults
        setCanvasSize({
          width: formatSize.width,
          height: formatSize.height
        });
      }
    }
  }, [activeCanvas?.id, activeCanvas?.customSize, activeCanvas?.format, setCanvasSize]);

  if (!activeCanvas) {
    return (
      <div className={cn("p-4 text-center text-muted-foreground", className)}>
        <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No canvas selected</p>
      </div>
    );
  }

  return (
    <div className={cn("h-full", className)}>
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <h3 className="font-medium">Canvas Properties</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {activeCanvas.slideMetadata.title}
        </p>
      </div>

      <Tabs defaultValue="design" className="h-full">
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
          <TabsTrigger value="design" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Design
          </TabsTrigger>
          <TabsTrigger value="animate" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Animate
          </TabsTrigger>
        </TabsList>

        <TabsContent value="design" className="space-y-4 p-4 mt-4">
          <CanvasFormatSection />
          <Separator />
          <CanvasPositionSection />
          <Separator />
          <CanvasSizeSection />
          <Separator />
          <CanvasFillSection />
        </TabsContent>

        <TabsContent value="animate" className="space-y-4 p-4 mt-4">
          <CanvasDurationSection />
          <Separator />
          <CanvasTransitionSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CanvasFormatSection() {
  const activeCanvas = useActiveCanvas();
  const { updateCanvas } = useCarouselStore();
  const { canvasSize, setCanvasSize } = useEditorStore();
  
  const handleFormatChange = (formatId: string) => {
    const format = CANVAS_FORMATS.find(f => f.id === formatId);
    if (format && activeCanvas) {
      // Update viewport display (EditorStore)
      setCanvasSize({ width: format.dimensions.width, height: format.dimensions.height });
      
      // Persist format and custom size to carousel store
      updateCanvas(activeCanvas.id, {
        format: format,
        customSize: {
          width: format.dimensions.width,
          height: format.dimensions.height
        }
      });
    }
  };

  const currentFormat = CANVAS_FORMATS.find(
    f => f.dimensions.width === canvasSize.width && f.dimensions.height === canvasSize.height
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Square className="w-4 h-4" />
          Format
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="canvas-format">Preset</Label>
          <Select
            value={currentFormat?.id || "custom"}
            onValueChange={handleFormatChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {CANVAS_FORMATS.map((format) => (
                <SelectItem key={format.id} value={format.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{format.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {format.dimensions.width} × {format.dimensions.height}
                    </span>
                  </div>
                </SelectItem>
              ))}
              <SelectItem value="custom">
                Custom
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function CanvasPositionSection() {
  const activeCanvas = useActiveCanvas();
  const { updateCanvas } = useCarouselStore();
  const [positionErrors, setPositionErrors] = useState<ValidationError[]>([]);

  const handlePositionChange = useCallback((field: 'x' | 'y', inputValue: string) => {
    if (!activeCanvas) return;
    
    const value = parseInt(inputValue) || 0;
    const currentPosition = activeCanvas.position || { x: 0, y: 0 };
    const newPosition = { ...currentPosition, [field]: value };
    
    // Validate the new position
    const errors = validateCanvasPosition(newPosition.x, newPosition.y);
    setPositionErrors(errors);
    
    // Only apply changes if there are no errors
    if (errors.length === 0) {
      updateCanvas(activeCanvas.id, {
        position: newPosition
      });
    }
  }, [activeCanvas, updateCanvas]);

  const hasErrors = positionErrors.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Move className="w-4 h-4" />
          Position
          {hasErrors && (
            <AlertTriangle className="w-3 h-3 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="canvas-x">X</Label>
            <Input
              id="canvas-x"
              type="number"
              value={activeCanvas?.position?.x || 0}
              onChange={(e) => handlePositionChange('x', e.target.value)}
              className={cn(
                "h-8",
                positionErrors.some(e => e.field === 'x') && "border-red-500"
              )}
              min={CANVAS_LIMITS.MIN_POSITION}
              max={CANVAS_LIMITS.MAX_POSITION}
            />
            <ValidationErrorDisplay errors={positionErrors} field="x" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="canvas-y">Y</Label>
            <Input
              id="canvas-y"
              type="number"
              value={activeCanvas?.position?.y || 0}
              onChange={(e) => handlePositionChange('y', e.target.value)}
              className={cn(
                "h-8",
                positionErrors.some(e => e.field === 'y') && "border-red-500"
              )}
              min={CANVAS_LIMITS.MIN_POSITION}
              max={CANVAS_LIMITS.MAX_POSITION}
            />
            <ValidationErrorDisplay errors={positionErrors} field="y" />
          </div>
        </div>
        {!hasErrors && (
          <div className="text-xs text-green-600 flex items-center gap-1">
            <span>✓</span>
            <span>Canvas position is valid</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CanvasSizeSection() {
  const activeCanvas = useActiveCanvas();
  const { updateCanvas } = useCarouselStore();
  const { canvasSize, setCanvasSize } = useEditorStore();
  const [sizeErrors, setSizeErrors] = useState<ValidationError[]>([]);

  const handleSizeChange = useCallback((field: 'width' | 'height', inputValue: string) => {
    if (!activeCanvas) return;
    
    const value = parseInt(inputValue) || CANVAS_LIMITS.MIN_SIZE;
    const newSize = { ...canvasSize, [field]: value };
    
    // Validate the new size
    const errors = validateCanvasSize(newSize.width, newSize.height);
    setSizeErrors(errors);
    
    // Only apply changes if there are no critical errors (non-warning errors)
    const criticalErrors = errors.filter(e => !e.message.startsWith('Warning:'));
    if (criticalErrors.length === 0) {
      // Update viewport display (EditorStore)
      setCanvasSize(newSize);
      
      // Persist custom size to carousel store
      updateCanvas(activeCanvas.id, {
        customSize: {
          width: newSize.width,
          height: newSize.height
        }
      });
    }
  }, [activeCanvas, updateCanvas, canvasSize, setCanvasSize]);

  const aspectRatio = canvasSize.width / canvasSize.height;
  const hasErrors = sizeErrors.length > 0;
  const hasCriticalErrors = sizeErrors.some(e => !e.message.startsWith('Warning:'));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Expand className="w-4 h-4" />
          Size
          {hasErrors && (
            <AlertTriangle className={cn("w-3 h-3", hasCriticalErrors ? "text-red-500" : "text-amber-500")} />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="canvas-width">Width</Label>
            <Input
              id="canvas-width"
              type="number"
              value={canvasSize.width}
              onChange={(e) => handleSizeChange('width', e.target.value)}
              className={cn(
                "h-8",
                sizeErrors.some(e => e.field === 'width' && !e.message.startsWith('Warning:')) && "border-red-500"
              )}
              min={CANVAS_LIMITS.MIN_SIZE}
              max={CANVAS_LIMITS.MAX_SIZE}
            />
            <ValidationErrorDisplay errors={sizeErrors} field="width" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="canvas-height">Height</Label>
            <Input
              id="canvas-height"
              type="number"
              value={canvasSize.height}
              onChange={(e) => handleSizeChange('height', e.target.value)}
              className={cn(
                "h-8",
                sizeErrors.some(e => e.field === 'height' && !e.message.startsWith('Warning:')) && "border-red-500"
              )}
              min={CANVAS_LIMITS.MIN_SIZE}
              max={CANVAS_LIMITS.MAX_SIZE}
            />
            <ValidationErrorDisplay errors={sizeErrors} field="height" />
          </div>
        </div>
        <div className="text-xs text-muted-foreground text-center">
          Aspect ratio: {aspectRatio.toFixed(2)}:1
        </div>
        <ValidationErrorDisplay errors={sizeErrors} field="aspect" />
        {!hasErrors && (
          <div className="text-xs text-green-600 flex items-center gap-1">
            <span>✓</span>
            <span>Canvas dimensions are valid</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CanvasFillSection() {
  const activeCanvas = useActiveCanvas();
  const { updateCanvas } = useCarouselStore();
  const [colorErrors, setColorErrors] = useState<ValidationError[]>([]);

  const handleFillToggle = useCallback((enabled: boolean) => {
    if (!activeCanvas) return;
    
    const color = activeCanvas.fill?.color || "#000000";
    
    // Validate color when enabling fill
    if (enabled) {
      const errors = validateHexColor(color);
      setColorErrors(errors);
      
      // Only enable if color is valid
      if (errors.length === 0) {
        updateCanvas(activeCanvas.id, {
          fill: { enabled, color }
        });
      }
    } else {
      // Disable fill without validation
      setColorErrors([]);
      updateCanvas(activeCanvas.id, {
        fill: { enabled, color }
      });
    }
  }, [activeCanvas, updateCanvas]);

  const handleColorChange = useCallback((inputColor: string) => {
    if (!activeCanvas) return;
    
    // Validate the color
    const errors = validateHexColor(inputColor);
    setColorErrors(errors);
    
    // Only apply changes if there are no errors
    if (errors.length === 0) {
      updateCanvas(activeCanvas.id, {
        fill: {
          enabled: activeCanvas.fill?.enabled || false,
          color: inputColor
        }
      });
    }
  }, [activeCanvas, updateCanvas]);

  const currentColor = activeCanvas?.fill?.color || "#000000";
  const fillEnabled = activeCanvas?.fill?.enabled || false;
  const hasErrors = colorErrors.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Fill
          {hasErrors && fillEnabled && (
            <AlertTriangle className="w-3 h-3 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="canvas-fill"
            checked={fillEnabled}
            onCheckedChange={handleFillToggle}
          />
          <Label htmlFor="canvas-fill">Enable background fill</Label>
        </div>
        
        {fillEnabled && (
          <div className="space-y-2">
            <Label htmlFor="canvas-color">Background Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="canvas-color"
                type="color"
                value={hasErrors ? "#000000" : currentColor} // Fallback for invalid colors in color picker
                onChange={(e) => handleColorChange(e.target.value)}
                className="h-8 w-16 p-1 border rounded cursor-pointer"
                disabled={hasErrors}
              />
              <Input
                type="text"
                value={currentColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className={cn(
                  "h-8 flex-1 font-mono text-xs",
                  hasErrors && "border-red-500"
                )}
                placeholder="#000000"
              />
            </div>
            <ValidationErrorDisplay errors={colorErrors} field="color" />
            {!hasErrors && (
              <div className="text-xs text-green-600 flex items-center gap-1">
                <span>✓</span>
                <span>Color is valid</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Supports hex colors: #FF0000, #F00, #ff0000
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CanvasDurationSection() {
  const activeCanvas = useActiveCanvas();
  const { updateCanvas } = useCarouselStore();
  const [durationErrors, setDurationErrors] = useState<ValidationError[]>([]);

  const handleDurationChange = useCallback((inputValue: number | string) => {
    if (!activeCanvas) return;
    
    const duration = typeof inputValue === 'string' ? parseFloat(inputValue) : inputValue;
    
    // Validate the duration
    const errors = validateCanvasDuration(duration);
    setDurationErrors(errors);
    
    // Only apply changes if there are no errors
    if (errors.length === 0) {
      updateCanvas(activeCanvas.id, { duration });
    }
  }, [activeCanvas, updateCanvas]);

  const currentDuration = activeCanvas?.duration || 5;
  const hasErrors = durationErrors.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Duration
          {hasErrors && (
            <AlertTriangle className="w-3 h-3 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="canvas-duration">Duration (seconds)</Label>
            <span className="text-sm text-muted-foreground">
              {currentDuration}s
            </span>
          </div>
          <Slider
            value={[currentDuration]}
            onValueChange={([value]) => handleDurationChange(value)}
            min={CANVAS_LIMITS.MIN_DURATION}
            max={Math.min(CANVAS_LIMITS.MAX_DURATION, 30)}
            step={0.1}
            className="w-full"
            disabled={hasErrors}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="canvas-duration-input">Precise Duration</Label>
          <Input
            id="canvas-duration-input"
            type="number"
            value={currentDuration}
            onChange={(e) => handleDurationChange(e.target.value)}
            className={cn(
              "h-8",
              hasErrors && "border-red-500"
            )}
            min={CANVAS_LIMITS.MIN_DURATION}
            max={CANVAS_LIMITS.MAX_DURATION}
            step="0.1"
          />
          <ValidationErrorDisplay errors={durationErrors} field="duration" />
        </div>
        {!hasErrors && (
          <div className="text-xs text-green-600 flex items-center gap-1">
            <span>✓</span>
            <span>Canvas duration is valid</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CanvasTransitionSection() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Transitions</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Canvas transitions coming soon...
        </p>
      </CardContent>
    </Card>
  );
}