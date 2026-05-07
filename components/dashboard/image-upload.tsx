// components/dashboard/image-upload.tsx
// Multi-image upload component with drag-to-reorder and colour assignment

"use client";

import React, { useState, DragEvent } from "react";
import Image from "next/image";
import { Upload, GripVertical, X, Loader2, Palette } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImageData {
  url: string;
  publicId?: string | null;
  colour?: string | null;
  blurDataUrl?: string | null;
}

interface ImageUploadProps {
  value: ImageData[];
  onChange: (images: ImageData[]) => void;
  onRemove: (url: string) => void;
  maxImages?: number;
  folder?: string;
  availableColours?: string[];
  resourceType?: "image" | "video";
}

export function ImageUpload({
  value = [],
  onChange,
  onRemove,
  maxImages = 8,
  folder = "miduka/products",
  availableColours = [],
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
        newImages.push({ url: data.url, publicId: data.publicId || null, colour: null, blurDataUrl: data.blurDataUrl });
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

  const updateImageColour = (index: number, colour: string) => {
    const newValues = [...value];
    newValues[index] = { 
      ...newValues[index], 
      colour: colour === "none" ? null : colour 
    };
    onChange(newValues);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {value.map((img, index) => (
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

            {/* Colour Assignment */}
            {availableColours.length > 0 && (
              <div className="px-1 py-1">
                <Select
                  value={img.colour || "none"}
                  onValueChange={(val) => updateImageColour(index, val || "none")}
                >
                  <SelectTrigger className="h-8 text-[10px] bg-background/50 border-none shadow-none focus:ring-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Palette className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                      <SelectValue placeholder="Assign colour" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific colour</SelectItem>
                    {availableColours.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ))}
        
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
