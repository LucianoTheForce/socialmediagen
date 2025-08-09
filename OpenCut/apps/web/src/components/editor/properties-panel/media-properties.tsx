import { MediaElement } from "@/types/timeline";
import { useTimelineStore } from "@/stores/timeline-store";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Link, Unlink, FlipHorizontal, FlipVertical, Move, RotateCcw } from "lucide-react";
import {
  PropertyItem,
  PropertyItemLabel,
  PropertyItemValue,
} from "./property-item";

export function MediaProperties({
  element,
  trackId,
}: {
  element: MediaElement;
  trackId: string;
}) {
  const { updateMediaElement } = useTimelineStore();

  // Local state for input values to allow temporary empty/invalid states
  const [xInput, setXInput] = useState(element.x?.toString() || "0");
  const [yInput, setYInput] = useState(element.y?.toString() || "0");
  const [scaleXInput, setScaleXInput] = useState((element.scaleX || 1).toString());
  const [scaleYInput, setScaleYInput] = useState((element.scaleY || 1).toString());
  const [rotationInput, setRotationInput] = useState((element.rotation || 0).toString());
  const [opacityInput, setOpacityInput] = useState(
    Math.round((element.opacity || 1) * 100).toString()
  );
  const [borderRadiusInput, setBorderRadiusInput] = useState((element.borderRadius || 0).toString());
  
  // Scale linking state
  const [scaleLinked, setScaleLinked] = useState(true);

  const parseAndValidateNumber = (
    value: string,
    min: number,
    max: number,
    fallback: number
  ): number => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
  };

  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    if (axis === 'x') {
      setXInput(value);
      if (value.trim() !== "") {
        const x = parseAndValidateNumber(value, -5000, 5000, element.x || 0);
        updateMediaElement(trackId, element.id, { x });
      }
    } else {
      setYInput(value);
      if (value.trim() !== "") {
        const y = parseAndValidateNumber(value, -5000, 5000, element.y || 0);
        updateMediaElement(trackId, element.id, { y });
      }
    }
  };

  const handlePositionBlur = (axis: 'x' | 'y') => {
    if (axis === 'x') {
      const x = parseAndValidateNumber(xInput, -5000, 5000, element.x || 0);
      setXInput(x.toString());
      updateMediaElement(trackId, element.id, { x });
    } else {
      const y = parseAndValidateNumber(yInput, -5000, 5000, element.y || 0);
      setYInput(y.toString());
      updateMediaElement(trackId, element.id, { y });
    }
  };

  const handleScaleChange = (axis: 'x' | 'y', value: string) => {
    if (axis === 'x') {
      setScaleXInput(value);
      if (value.trim() !== "") {
        const scaleX = parseAndValidateNumber(value, 0.1, 10, element.scaleX || 1);
        const updates: Partial<MediaElement> = { scaleX };
        
        if (scaleLinked) {
          const scaleY = scaleX;
          setScaleYInput(scaleY.toString());
          updates.scaleY = scaleY;
        }
        
        updateMediaElement(trackId, element.id, updates);
      }
    } else {
      setScaleYInput(value);
      if (value.trim() !== "") {
        const scaleY = parseAndValidateNumber(value, 0.1, 10, element.scaleY || 1);
        const updates: Partial<MediaElement> = { scaleY };
        
        if (scaleLinked) {
          const scaleX = scaleY;
          setScaleXInput(scaleX.toString());
          updates.scaleX = scaleX;
        }
        
        updateMediaElement(trackId, element.id, updates);
      }
    }
  };

  const handleScaleBlur = (axis: 'x' | 'y') => {
    if (axis === 'x') {
      const scaleX = parseAndValidateNumber(scaleXInput, 0.1, 10, element.scaleX || 1);
      setScaleXInput(scaleX.toString());
      const updates: Partial<MediaElement> = { scaleX };
      
      if (scaleLinked) {
        const scaleY = scaleX;
        setScaleYInput(scaleY.toString());
        updates.scaleY = scaleY;
      }
      
      updateMediaElement(trackId, element.id, updates);
    } else {
      const scaleY = parseAndValidateNumber(scaleYInput, 0.1, 10, element.scaleY || 1);
      setScaleYInput(scaleY.toString());
      const updates: Partial<MediaElement> = { scaleY };
      
      if (scaleLinked) {
        const scaleX = scaleY;
        setScaleXInput(scaleX.toString());
        updates.scaleX = scaleX;
      }
      
      updateMediaElement(trackId, element.id, updates);
    }
  };

  const handleRotationChange = (value: string) => {
    setRotationInput(value);
    if (value.trim() !== "") {
      const rotation = parseAndValidateNumber(value, -360, 360, element.rotation || 0);
      updateMediaElement(trackId, element.id, { rotation });
    }
  };

  const handleRotationBlur = () => {
    const rotation = parseAndValidateNumber(rotationInput, -360, 360, element.rotation || 0);
    setRotationInput(rotation.toString());
    updateMediaElement(trackId, element.id, { rotation });
  };

  const handleOpacityChange = (value: string) => {
    setOpacityInput(value);
    if (value.trim() !== "") {
      const opacityPercent = parseAndValidateNumber(
        value,
        0,
        100,
        Math.round((element.opacity || 1) * 100)
      );
      updateMediaElement(trackId, element.id, { opacity: opacityPercent / 100 });
    }
  };

  const handleOpacityBlur = () => {
    const opacityPercent = parseAndValidateNumber(
      opacityInput,
      0,
      100,
      Math.round((element.opacity || 1) * 100)
    );
    setOpacityInput(opacityPercent.toString());
    updateMediaElement(trackId, element.id, { opacity: opacityPercent / 100 });
  };

  const handleBorderRadiusChange = (value: string) => {
    setBorderRadiusInput(value);
    if (value.trim() !== "") {
      const borderRadius = parseAndValidateNumber(value, 0, 500, element.borderRadius || 0);
      updateMediaElement(trackId, element.id, { borderRadius });
    }
  };

  const handleBorderRadiusBlur = () => {
    const borderRadius = parseAndValidateNumber(borderRadiusInput, 0, 500, element.borderRadius || 0);
    setBorderRadiusInput(borderRadius.toString());
    updateMediaElement(trackId, element.id, { borderRadius });
  };

  return (
    <div className="space-y-6 p-5">
      {/* Position Controls */}
      <PropertyItem direction="column">
        <PropertyItemLabel className="flex items-center gap-2">
          <Move className="w-4 h-4" />
          Position
        </PropertyItemLabel>
        <PropertyItemValue>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground w-4">X</Label>
              <Input
                type="number"
                value={xInput}
                min={-5000}
                max={5000}
                onChange={(e) => handlePositionChange('x', e.target.value)}
                onBlur={() => handlePositionBlur('x')}
                className="h-7 w-full !text-xs"
                placeholder="0"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground w-4">Y</Label>
              <Input
                type="number"
                value={yInput}
                min={-5000}
                max={5000}
                onChange={(e) => handlePositionChange('y', e.target.value)}
                onBlur={() => handlePositionBlur('y')}
                className="h-7 w-full !text-xs"
                placeholder="0"
              />
            </div>
          </div>
        </PropertyItemValue>
      </PropertyItem>

      {/* Scale Controls */}
      <PropertyItem direction="column">
        <PropertyItemLabel>Scale</PropertyItemLabel>
        <PropertyItemValue>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant={scaleLinked ? "default" : "outline"}
                size="sm"
                onClick={() => setScaleLinked(!scaleLinked)}
                className="h-7 w-7 p-0"
              >
                {scaleLinked ? (
                  <Link className="w-3.5 h-3.5" />
                ) : (
                  <Unlink className="w-3.5 h-3.5" />
                )}
              </Button>
              <span className="text-xs text-muted-foreground">
                {scaleLinked ? "Proportional" : "Independent"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground w-4">X</Label>
                <Input
                  type="number"
                  value={scaleXInput}
                  min={0.1}
                  max={10}
                  step={0.1}
                  onChange={(e) => handleScaleChange('x', e.target.value)}
                  onBlur={() => handleScaleBlur('x')}
                  className="h-7 w-full !text-xs"
                  placeholder="1.0"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground w-4">Y</Label>
                <Input
                  type="number"
                  value={scaleYInput}
                  min={0.1}
                  max={10}
                  step={0.1}
                  onChange={(e) => handleScaleChange('y', e.target.value)}
                  onBlur={() => handleScaleBlur('y')}
                  className="h-7 w-full !text-xs"
                  placeholder="1.0"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                value={[parseFloat(scaleXInput) || 1]}
                min={0.1}
                max={5}
                step={0.1}
                onValueChange={([value]) => {
                  const scaleX = value;
                  setScaleXInput(scaleX.toString());
                  const updates: Partial<MediaElement> = { scaleX };
                  
                  if (scaleLinked) {
                    const scaleY = scaleX;
                    setScaleYInput(scaleY.toString());
                    updates.scaleY = scaleY;
                  }
                  
                  updateMediaElement(trackId, element.id, updates);
                }}
                className="w-full"
              />
            </div>
          </div>
        </PropertyItemValue>
      </PropertyItem>

      {/* Rotation Control */}
      <PropertyItem direction="column">
        <PropertyItemLabel className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          Rotation
        </PropertyItemLabel>
        <PropertyItemValue>
          <div className="flex items-center gap-2">
            <Slider
              value={[parseFloat(rotationInput) || 0]}
              min={-180}
              max={180}
              step={1}
              onValueChange={([value]) => {
                const rotation = value;
                setRotationInput(rotation.toString());
                updateMediaElement(trackId, element.id, { rotation });
              }}
              className="w-full"
            />
            <Input
              type="number"
              value={rotationInput}
              min={-360}
              max={360}
              onChange={(e) => handleRotationChange(e.target.value)}
              onBlur={handleRotationBlur}
              className="w-16 !text-xs h-7 rounded-sm text-center
               [appearance:textfield]
               [&::-webkit-outer-spin-button]:appearance-none
               [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
            />
            <span className="text-xs text-muted-foreground">°</span>
          </div>
        </PropertyItemValue>
      </PropertyItem>

      {/* Object Fit Control */}
      <PropertyItem direction="row">
        <PropertyItemLabel>Object Fit</PropertyItemLabel>
        <PropertyItemValue>
          <Select
            value={element.objectFit || "cover"}
            onValueChange={(value: "cover" | "contain" | "fill" | "none" | "scale-down") =>
              updateMediaElement(trackId, element.id, { objectFit: value })
            }
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue placeholder="Select fit mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">Cover</SelectItem>
              <SelectItem value="contain">Contain</SelectItem>
              <SelectItem value="fill">Fill</SelectItem>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="scale-down">Scale Down</SelectItem>
            </SelectContent>
          </Select>
        </PropertyItemValue>
      </PropertyItem>

      {/* Alignment Controls */}
      <PropertyItem direction="column">
        <PropertyItemLabel>Alignment</PropertyItemLabel>
        <PropertyItemValue>
          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Horizontal</Label>
              <div className="flex gap-2">
                <Button
                  variant={element.alignment?.horizontal === "left" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateMediaElement(trackId, element.id, { 
                    alignment: { 
                      ...element.alignment, 
                      horizontal: "left" 
                    } 
                  })}
                >
                  Left
                </Button>
                <Button
                  variant={(element.alignment?.horizontal === "center" || !element.alignment?.horizontal) ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateMediaElement(trackId, element.id, { 
                    alignment: { 
                      ...element.alignment, 
                      horizontal: "center" 
                    } 
                  })}
                >
                  Center
                </Button>
                <Button
                  variant={element.alignment?.horizontal === "right" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateMediaElement(trackId, element.id, { 
                    alignment: { 
                      ...element.alignment, 
                      horizontal: "right" 
                    } 
                  })}
                >
                  Right
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Vertical</Label>
              <div className="flex gap-2">
                <Button
                  variant={element.alignment?.vertical === "top" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateMediaElement(trackId, element.id, { 
                    alignment: { 
                      ...element.alignment, 
                      vertical: "top" 
                    } 
                  })}
                >
                  Top
                </Button>
                <Button
                  variant={(element.alignment?.vertical === "middle" || !element.alignment?.vertical) ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateMediaElement(trackId, element.id, { 
                    alignment: { 
                      ...element.alignment, 
                      vertical: "middle" 
                    } 
                  })}
                >
                  Middle
                </Button>
                <Button
                  variant={element.alignment?.vertical === "bottom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateMediaElement(trackId, element.id, { 
                    alignment: { 
                      ...element.alignment, 
                      vertical: "bottom" 
                    } 
                  })}
                >
                  Bottom
                </Button>
              </div>
            </div>
          </div>
        </PropertyItemValue>
      </PropertyItem>

      {/* Flip Controls */}
      <PropertyItem direction="row">
        <PropertyItemLabel>Flip</PropertyItemLabel>
        <PropertyItemValue>
          <div className="flex gap-2">
            <Button
              variant={element.flipHorizontal ? "default" : "outline"}
              size="sm"
              onClick={() => updateMediaElement(trackId, element.id, { 
                flipHorizontal: !element.flipHorizontal 
              })}
              className="flex items-center gap-2"
            >
              <FlipHorizontal className="w-4 h-4" />
              Horizontal
            </Button>
            <Button
              variant={element.flipVertical ? "default" : "outline"}
              size="sm"
              onClick={() => updateMediaElement(trackId, element.id, { 
                flipVertical: !element.flipVertical 
              })}
              className="flex items-center gap-2"
            >
              <FlipVertical className="w-4 h-4" />
              Vertical
            </Button>
          </div>
        </PropertyItemValue>
      </PropertyItem>

      {/* Border Radius Control */}
      <PropertyItem direction="column">
        <PropertyItemLabel>Border Radius</PropertyItemLabel>
        <PropertyItemValue>
          <div className="flex items-center gap-2">
            <Slider
              value={[parseFloat(borderRadiusInput) || 0]}
              min={0}
              max={500}
              step={1}
              onValueChange={([value]) => {
                const borderRadius = value;
                setBorderRadiusInput(borderRadius.toString());
                updateMediaElement(trackId, element.id, { borderRadius });
              }}
              className="w-full"
            />
            <Input
              type="number"
              value={borderRadiusInput}
              min={0}
              max={500}
              onChange={(e) => handleBorderRadiusChange(e.target.value)}
              onBlur={handleBorderRadiusBlur}
              className="w-16 !text-xs h-7 rounded-sm text-center
               [appearance:textfield]
               [&::-webkit-outer-spin-button]:appearance-none
               [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </PropertyItemValue>
      </PropertyItem>

      {/* Opacity Control */}
      <PropertyItem direction="column">
        <PropertyItemLabel>Opacity</PropertyItemLabel>
        <PropertyItemValue>
          <div className="flex items-center gap-2">
            <Slider
              value={[(element.opacity || 1) * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={([value]) => {
                updateMediaElement(trackId, element.id, {
                  opacity: value / 100,
                });
                setOpacityInput(value.toString());
              }}
              className="w-full"
            />
            <Input
              type="number"
              value={opacityInput}
              min={0}
              max={100}
              onChange={(e) => handleOpacityChange(e.target.value)}
              onBlur={handleOpacityBlur}
              className="w-12 !text-xs h-7 rounded-sm text-center
               [appearance:textfield]
               [&::-webkit-outer-spin-button]:appearance-none
               [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </PropertyItemValue>
      </PropertyItem>
    </div>
  );
}
