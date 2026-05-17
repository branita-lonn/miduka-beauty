// components/dashboard/variant-attribute-input.tsx
// purpose: Component to render appropriate input field (text, select, boolean, color, number) for a variant's attribute.

"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttributeDefinitionPublic } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface VariantAttributeInputProps {
  definition: AttributeDefinitionPublic;
  value: string;
  onChange: (val: string) => void;
}

export function VariantAttributeInput({
  definition,
  value,
  onChange,
}: VariantAttributeInputProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);

  switch (definition.inputType) {
    case "SELECT":
      return (
        <div className="space-y-1.5 w-full">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            {definition.label}
          </label>
          <Select value={value || ""} onValueChange={(val) => onChange(val || "")}>
            <SelectTrigger className="w-full h-10 rounded-xl border-border/50 bg-background/50">
              <SelectValue placeholder={`Select ${definition.label}`} />
            </SelectTrigger>
            <SelectContent>
              {definition.allowedValues.map((val) => (
                <SelectItem key={val} value={val}>
                  {val}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "NUMBER":
      return (
        <div className="space-y-1.5 w-full">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            {definition.label} {definition.unit ? `(${definition.unit})` : ""}
          </label>
          <div className="relative flex items-center">
            <Input
              type="number"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g. 12"
              className="w-full h-10 rounded-xl border-border/50 bg-background/50 pr-12"
            />
            {definition.unit && (
              <Badge
                variant="secondary"
                className="absolute right-2.5 h-6 rounded-md font-mono text-[10px] px-1.5"
              >
                {definition.unit}
              </Badge>
            )}
          </div>
        </div>
      );

    case "BOOLEAN":
      const isTrue = value === "true";
      return (
        <div className="space-y-1.5 w-full">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            {definition.label}
          </label>
          <div className="flex items-center h-10 px-3 rounded-xl border border-border/50 bg-background/50 justify-between">
            <span className="text-sm font-medium text-foreground">
              {isTrue ? "Yes" : "No"}
            </span>
            <Switch
              checked={isTrue}
              onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
            />
          </div>
        </div>
      );

    case "COLOR":
      return (
        <div className="space-y-1.5 w-full">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            {definition.label}
          </label>
          <div className="flex items-center gap-2">
            {/* Color Swatch / Empty Swatch Picker */}
            <button
              type="button"
              onClick={() => colorInputRef.current?.click()}
              className="h-10 w-10 rounded-xl border border-border/50 flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 overflow-hidden shadow-sm relative group bg-background"
              style={{
                backgroundColor: value || "transparent",
              }}
            >
              {!value && (
                <div className="absolute inset-0 bg-muted/40 flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors">
                  <Plus className="h-4 w-4" />
                </div>
              )}
            </button>
            <div className="flex-1 relative">
              <Input
                type="text"
                value={value}
                placeholder="e.g. #FF5733 or Red"
                onChange={(e) => onChange(e.target.value)}
                className="h-10 rounded-xl border-border/50 bg-background/50 pl-3 pr-10"
              />
              <input
                ref={colorInputRef}
                type="color"
                value={value.startsWith("#") && value.length === 7 ? value : "#ffffff"}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only"
              />
            </div>
          </div>
        </div>
      );

    case "TEXT":
    default:
      return (
        <div className="space-y-1.5 w-full">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            {definition.label}
          </label>
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${definition.label.toLowerCase()}`}
            className="w-full h-10 rounded-xl border-border/50 bg-background/50"
          />
        </div>
      );
  }
}
