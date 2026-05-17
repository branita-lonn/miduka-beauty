// components/dashboard/image-upload.tsx
// Multi-image upload component with drag-to-reorder and dynamic variant linking

"use client";

import React, { useState, DragEvent } from "react";
import Image from "next/image";
import { Upload, GripVertical, X, Loader2, Link as LinkIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface ImageData {
  url: string;
  publicId?: string | null;
  blurDataUrl?: string | null;
  variantIndex?: number | null; // For create mode
  variantIds?: string[];        // For edit mode
}

interface ImageUploadProps {
  value: ImageData[];
  onChange: (images: ImageData[]) => void;
  onRemove: (url: string) => void;
  maxImages?: number;
  folder?: string;
  variants?: any[];             // Current product variants
  isEditMode?: boolean;
  resourceType?: "image" | "video";
}

export function ImageUpload({
  value = [],
  onChange,
  onRemove,
  maxImages = 12,
  folder = "miduka/products",
  variants = [],
  isEditMode = false,
  resourceType = "image",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (value.length + files.length > maxImages) {
      toast.error(`You can only upload a maximum of ${maxImages} images.`);
      return;
    }

    setIsUploading(true);

    try {
      const newImages: ImageData[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (resourceType === "image" && !isImage) {
          toast.error(`File ${file.name} is not an image.`);
          continue;
        }
        if (resourceType === "video" && !isVideo) {
          toast.error(`File ${file.name} is not a video.`);
          continue;
        }

        if (file.size > (resourceType === "video" ? 20 : 5) * 1024 * 1024) {
          toast.error(`File ${file.name} exceeds ${resourceType === "video" ? "20MB" : "5MB"}.`);
          continue;
        }

        const base64 = await convertToBase64(file);

        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, folder, resourceType }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to upload");
        }

        const data = await response.json();
        newImages.push({
          url: data.url,
          blurDataUrl: data.blurDataUrl || null,
          variantIndex: null,
          variantIds: [],
        });
      }

      if (newImages.length > 0) {
        onChange([...value, ...newImages]);
        toast.success(`Uploaded ${newImages.length} image(s).`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Upload error";
      toast.error(message);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newValues = [...value];
    const draggedItem = newValues[draggedIndex];
    newValues.splice(draggedIndex, 1);
    newValues.splice(dropIndex, 0, draggedItem);

    onChange(newValues);
    setDraggedIndex(null);
  };

  const getVariantLabel = (variant: any, idx: number) => {
    if (variant.label) return variant.label;
    if (variant.attributes && variant.attributes.length > 0) {
      return variant.attributes.map((a: any) => a.value).filter(Boolean).join(" / ") || `Variant #${idx + 1}`;
    }
    return `Variant #${idx + 1}`;
  };

  // Toggle variant link in EDIT mode (supports checking multiple variants)
  const toggleVariantEditLink = (imgIndex: number, variantId: string) => {
    const newValues = [...value];
    const currentIds = newValues[imgIndex].variantIds || [];
    if (currentIds.includes(variantId)) {
      newValues[imgIndex] = {
        ...newValues[imgIndex],
        variantIds: currentIds.filter((id) => id !== variantId),
      };
    } else {
      newValues[imgIndex] = {
        ...newValues[imgIndex],
        variantIds: [...currentIds, variantId],
      };
    }
    onChange(newValues);
  };

  // Select variant link in CREATE mode (supports checking a single variant or clearing)
  const selectVariantCreateLink = (imgIndex: number, varIdx: number | null) => {
    const newValues = [...value];
    newValues[imgIndex] = {
      ...newValues[imgIndex],
      variantIndex: varIdx,
    };
    onChange(newValues);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {value.map((img, index) => {
          // Identify currently linked variants to show labels
          let linkedLabel = "";
          if (isEditMode) {
            const linkedCount = (img.variantIds || []).length;
            if (linkedCount === 0) linkedLabel = "Global Image";
            else if (linkedCount === 1) {
              const matchedVar = variants.find((v) => v.id === img.variantIds?.[0]);
              linkedLabel = matchedVar ? getVariantLabel(matchedVar, 0) : "1 Variant Linked";
            } else {
              linkedLabel = `${linkedCount} Variants Linked`;
            }
          } else {
            const hasIndex = img.variantIndex !== null && img.variantIndex !== undefined;
            if (!hasIndex) linkedLabel = "Global Image";
            else {
              const matchedVar = variants[img.variantIndex!];
              linkedLabel = matchedVar ? getVariantLabel(matchedVar, img.variantIndex!) : "Global Image";
            }
          }

          return (
            <div
              key={img.url}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e)}
              onDrop={(e) => handleDrop(e, index)}
              className={cn(
                "flex flex-col gap-2 p-2 rounded-2xl border bg-card/50 transition-all duration-300 group",
                draggedIndex === index && "opacity-50"
              )}
            >
              <div className="relative aspect-square rounded-xl overflow-hidden cursor-grab active:cursor-grabbing">
                <div className="absolute top-2 right-2 z-10">
                  <button
                    type="button"
                    onClick={() => onRemove(img.url)}
                    className="bg-destructive/90 text-destructive-foreground p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="absolute top-2 left-2 z-10">
                  <div className="bg-background/80 text-foreground p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm backdrop-blur-sm">
                    <GripVertical className="h-4 w-4" />
                  </div>
                </div>
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 z-10">
                    <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full shadow-sm font-bold uppercase tracking-tight">
                      Cover
                    </span>
                  </div>
                )}
                {resourceType === "image" ? (
                  <Image fill src={img.url} alt={`Upload ${index + 1}`} className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                ) : (
                  <video src={img.url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                )}
              </div>

              {/* Dynamic Variant Linking Popover */}
              {variants.length > 0 && (
                <div className="px-1 py-1 flex items-center justify-between gap-1">
                  <Popover>
                    <PopoverTrigger
                      className="w-full h-8 text-[11px] rounded-lg justify-start gap-1.5 px-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors overflow-hidden flex items-center bg-transparent border border-transparent cursor-pointer"
                    >
                      <LinkIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{linkedLabel}</span>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3 rounded-2xl" align="start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 pb-2 border-b">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <h4 className="font-semibold text-xs text-foreground uppercase tracking-wide">Link Image to Variant</h4>
                        </div>
                        
                        {isEditMode ? (
                          /* Edit Mode: Checkboxes for multiple links */
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1.5">
                            {variants.map((v, varIdx) => {
                              const varId = v.id || `v-${varIdx}`;
                              const isChecked = (img.variantIds || []).includes(varId);
                              return (
                                <label
                                  key={varId}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-muted/50 cursor-pointer text-xs transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleVariantEditLink(index, varId)}
                                    className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                                  />
                                  <span className="font-medium text-foreground truncate">
                                    {getVariantLabel(v, varIdx)}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          /* Create Mode: Single select dropdown */
                          <div className="space-y-1 pt-1.5">
                            <button
                              type="button"
                              onClick={() => selectVariantCreateLink(index, null)}
                              className={cn(
                                "w-full text-left px-2 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors",
                                img.variantIndex === null || img.variantIndex === undefined
                                  ? "bg-primary/10 text-primary"
                                  : "hover:bg-muted"
                              )}
                            >
                              Global (Show for all)
                            </button>
                            {variants.map((v, varIdx) => (
                              <button
                                key={varIdx}
                                type="button"
                                onClick={() => selectVariantCreateLink(index, varIdx)}
                                className={cn(
                                  "w-full text-left px-2 py-1.5 rounded-xl text-xs transition-colors truncate block",
                                  img.variantIndex === varIdx
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "hover:bg-muted"
                                )}
                              >
                                {getVariantLabel(v, varIdx)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Visual indication if linked */}
                  {(isEditMode ? (img.variantIds || []).length > 0 : img.variantIndex !== null && img.variantIndex !== undefined) && (
                    <Badge variant="secondary" className="h-5 px-1.5 rounded-md text-[9px] uppercase tracking-wider flex-shrink-0 text-primary font-bold">
                      Linked
                    </Badge>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {value.length < maxImages && (
          <label className="relative flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-2xl border-muted-foreground/25 hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 cursor-pointer overflow-hidden group">
            {isUploading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            <div className="flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary transition-colors p-4 text-center">
              <div className="bg-muted p-3 rounded-full group-hover:bg-primary/10 transition-colors mb-3">
                <Upload className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold">{resourceType === "image" ? "Add Image" : "Add Video"}</span>
              <span className="text-[10px] mt-1 opacity-70">
                {resourceType === "image" ? "JPEG, PNG, WEBP up to 5MB" : "MP4, WEBM up to 20MB"}
              </span>
            </div>
            <input
              type="file"
              multiple={maxImages > 1}
              accept={resourceType === "image" ? "image/jpeg, image/png, image/webp" : "video/mp4, video/webm, video/ogg, video/quicktime"}
              className="hidden"
              onChange={handleUpload}
              disabled={isUploading}
            />
          </label>
        )}
      </div>
      {value.length > 1 && (
        <p className="text-[10px] text-muted-foreground text-center">
          Drag to reorder. The first image is the default product cover.
        </p>
      )}
    </div>
  );
}
