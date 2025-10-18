import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

const presetColors = [
  { name: "Ροζ Γάμου", color: "#ff6b8a" },
  { name: "Χρυσό", color: "#d4af37" },
  { name: "Κοραλί", color: "#ff7f50" },
  { name: "Λεβάντα", color: "#b19cd9" },
  { name: "Mint", color: "#98d8c8" },
  { name: "Ροζ Χρυσό", color: "#b76e79" },
  { name: "Σομόν", color: "#fa8072" },
  { name: "Μπλε Ουρανού", color: "#87ceeb" },
];

export const ColorPicker = ({ currentColor, onColorChange }: ColorPickerProps) => {
  const [customColor, setCustomColor] = useState(currentColor);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Χρώματα
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Preset Colors */}
        <div>
          <Label className="text-xs mb-2 block">Έτοιμα Θέματα</Label>
          <div className="grid grid-cols-4 gap-2">
            {presetColors.map((preset) => (
              <button
                key={preset.color}
                onClick={() => onColorChange(preset.color)}
                className={`w-full aspect-square rounded-md border-2 transition-all hover:scale-110 ${
                  currentColor === preset.color ? "border-primary ring-2 ring-primary" : "border-muted"
                }`}
                style={{ backgroundColor: preset.color }}
                title={preset.name}
              />
            ))}
          </div>
        </div>

        {/* Custom Color */}
        <div className="space-y-2">
          <Label htmlFor="customColor" className="text-xs">Δικό σου Χρώμα</Label>
          <div className="flex gap-2">
            <input
              id="customColor"
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-12 h-8 rounded cursor-pointer"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => onColorChange(customColor)}
              className="flex-1 h-8 text-xs"
            >
              Εφαρμογή
            </Button>
          </div>
        </div>

        {/* Current Color Display */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Τρέχον:</span>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded border"
                style={{ backgroundColor: currentColor }}
              />
              <code className="text-xs">{currentColor}</code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
