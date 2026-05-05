// components/dashboard/hero-slide-manager.tsx
// Client component for managing hero slides list, drag-to-reorder, and global settings

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HeroSlideData, StoreSettingsData } from "@/types";
import { HeroSlideForm } from "./hero-slide-form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  LayoutTemplate, 
  Plus, 
  GripVertical, 
  Pencil, 
  Trash2, 
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface HeroSlideManagerProps {
  slides: HeroSlideData[];
  settings: {
    heroCarouselInterval: number;
    heroCarouselAutoplay: boolean;
  } | null;
}

export function HeroSlideManager({ slides, settings }: HeroSlideManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlideData | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Local state for settings to show immediate feedback
  const [autoplay, setAutoplay] = useState(settings?.heroCarouselAutoplay ?? true);
  const [interval, setInterval] = useState(settings?.heroCarouselInterval ?? 5000);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);

  const updateSettings = async (newAutoplay: boolean, newInterval: number) => {
    setIsSavingSettings(true);
    try {
      const response = await fetch("/api/dashboard/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroCarouselAutoplay: newAutoplay,
          heroCarouselInterval: newInterval,
        }),
      });

      if (!response.ok) throw new Error("Failed to save settings");
      
      setShowSavedIndicator(true);
      setTimeout(() => setShowSavedIndicator(false), 2000);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update settings");
      // Revert local state
      setAutoplay(settings?.heroCarouselAutoplay ?? true);
      setInterval(settings?.heroCarouselInterval ?? 5000);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAutoplayChange = (val: boolean) => {
    setAutoplay(val);
    updateSettings(val, interval);
  };

  const handleIntervalChange = (val: string) => {
    const numVal = parseInt(val);
    setInterval(numVal);
    updateSettings(autoplay, numVal);
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const response = await fetch(`/api/dashboard/hero-slides/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });

      if (!response.ok) throw new Error();
      toast.success(current ? "Slide deactivated" : "Slide activated");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update slide status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/dashboard/hero-slides/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error();
      toast.success("Slide deleted");
      setDeletingId(null);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete slide");
    }
  };

  // Drag and Drop Logic
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [localSlides, setLocalSlides] = useState(slides);

  // Sync local slides when server slides change
  useState(() => {
    setLocalSlides(slides);
  });

  const onDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSlides = [...localSlides];
    const draggedItem = newSlides[draggedIndex];
    newSlides.splice(draggedIndex, 1);
    newSlides.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setLocalSlides(newSlides);
  };

  const onDrop = async () => {
    setDraggedIndex(null);
    // Optimistically update, but now we must save to DB
    try {
      const reorderedSlides = localSlides.map((slide, index) => ({
        id: slide.id,
        sortOrder: index,
      }));

      const response = await fetch("/api/dashboard/hero-slides/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides: reorderedSlides }),
      });

      if (!response.ok) throw new Error();
      router.refresh();
    } catch (error) {
      toast.error("Failed to save new order");
      setLocalSlides(slides); // revert
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Hero Carousel</h1>
          <p className="text-sm text-muted-foreground">
            Manage the slides shown at the top of your store. Drag to reorder.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={slides.length >= 8 ? "destructive" : "secondary"} className="rounded-full">
            {slides.length} / 8 slides
          </Badge>
          <Button 
            onClick={() => {
              setEditingSlide(undefined);
              setIsFormOpen(true);
            }} 
            disabled={slides.length >= 8}
            className="rounded-4xl gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Add Slide
          </Button>
        </div>
      </div>

      {/* Global Config Row */}
      <div className="flex flex-wrap items-center gap-6 p-4 rounded-3xl border bg-card/50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Auto-play</span>
          <Switch 
            checked={autoplay} 
            onCheckedChange={handleAutoplayChange} 
            disabled={isSavingSettings}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Auto-advance every</span>
          <Select 
            value={interval.toString()} 
            onValueChange={(val) => handleIntervalChange(val || "5000")}
            disabled={isSavingSettings}
          >
            <SelectTrigger className="w-[120px] rounded-xl h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3000">3 seconds</SelectItem>
              <SelectItem value="4000">4 seconds</SelectItem>
              <SelectItem value="5000">5 seconds</SelectItem>
              <SelectItem value="7000">7 seconds</SelectItem>
              <SelectItem value="10000">10 seconds</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showSavedIndicator && (
          <span className="text-xs text-green-500 font-medium animate-in fade-in slide-in-from-left-2">
            ✓ Saved
          </span>
        )}
      </div>

      {/* Slide List */}
      <div className="grid gap-4">
        {localSlides.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed text-center space-y-4">
            <div className="bg-muted p-4 rounded-full">
              <LayoutTemplate className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold">No hero slides yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Add your first slide to create a beautiful rotating banner for your store.
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={() => {
                setEditingSlide(undefined);
                setIsFormOpen(true);
              }}
              className="rounded-full"
            >
              Add Your First Slide
            </Button>
          </div>
        ) : (
          localSlides.map((slide, index) => (
            <div
              key={slide.id}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDrop={onDrop}
              className={cn(
                "group relative flex items-center gap-4 p-4 rounded-3xl border bg-card shadow-sm transition-all duration-200",
                draggedIndex === index ? "opacity-50 border-primary" : "hover:shadow-md hover:border-primary/20",
                !slide.isActive && "bg-muted/30 opacity-75 grayscale-[0.5]"
              )}
            >
              {/* Drag Handle */}
              <div className="flex items-center gap-2">
                <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors p-1">
                  <GripVertical className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 text-[10px] font-bold">
                  {index + 1}
                </Badge>
              </div>

              {/* Thumbnails */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1 items-center">
                  <div className="relative aspect-[16/5] w-32 rounded-xl overflow-hidden border bg-muted">
                    <Image src={slide.desktopImageUrl} alt="Desktop" fill className="object-cover" sizes="128px" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Desktop</span>
                </div>
                <div className="flex flex-col gap-1 items-center">
                  <div className="relative aspect-[4/5] w-12 rounded-xl overflow-hidden border bg-muted">
                    <Image src={slide.mobileImageUrl} alt="Mobile" fill className="object-cover" sizes="48px" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Mobile</span>
                </div>
              </div>

              {/* Content Summary */}
              <div className="flex-1 min-w-0 px-2">
                {slide.headline || slide.subheadline ? (
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-sm truncate">{slide.headline || "No headline"}</h4>
                    <p className="text-xs text-muted-foreground truncate">{slide.subheadline || "No subheadline"}</p>
                    {slide.ctaText && (
                      <Badge variant="outline" className="mt-1 text-[10px] h-5 rounded-full border-primary/20 bg-primary/5 text-primary">
                        {slide.ctaText}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-xs italic text-muted-foreground">No text overlay</span>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 px-2">
                <div className="flex items-center gap-2 pr-4 border-r">
                  <span className="text-[10px] font-medium uppercase text-muted-foreground">Active</span>
                  <Switch 
                    checked={slide.isActive} 
                    onCheckedChange={() => toggleActive(slide.id, slide.isActive)}
                  />
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setEditingSlide(slide);
                    setIsFormOpen(true);
                  }}
                  className="h-9 w-9 rounded-full hover:bg-primary/5 hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                {deletingId === slide.id ? (
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="rounded-full h-8 px-3 text-xs"
                      onClick={() => handleDelete(slide.id)}
                    >
                      Confirm?
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full"
                      onClick={() => setDeletingId(null)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setDeletingId(slide.id)}
                    className="h-9 w-9 rounded-full hover:bg-destructive/5 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <HeroSlideForm 
        open={isFormOpen}
        slide={editingSlide}
        onClose={() => {
          setIsFormOpen(false);
          setEditingSlide(undefined);
        }}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
