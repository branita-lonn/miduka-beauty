// components/dashboard/hero-slide-form.tsx
// Form for creating and editing a single hero carousel slide — Sheet-based

"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/dashboard/image-upload";
import { HeroSlideData } from "@/types";
import { toast } from "sonner";
import { Loader2, Save, AlignLeft, AlignCenter, AlignRight, ImageIcon, ChevronUp, ChevronDown, MoveVertical } from "lucide-react";
import Image from "next/image";

const slideSchema = z.object({
  headline: z.string().max(120).default(""),
  subheadline: z.string().max(200).default(""),
  ctaText: z.string().max(50).default(""),
  ctaLink: z.string().max(500).default(""),
  desktopImageUrl: z.string().url("Desktop image is required"),
  mobileImageUrl: z.string().url("Mobile image is required"),
  desktopPublicId: z.string().default(""),
  mobilePublicId: z.string().default(""),
  overlayColor: z.string().default("rgba(0,0,0,0.35)"),
  textAlign: z.enum(["left", "center", "right"]).default("left"),
  verticalAlign: z.enum(["top", "center", "bottom"]).default("center"),
  videoUrl: z.string().default(""),
  videoPublicId: z.string().default(""),
  duration: z.number().int().min(2000).max(15000).nullable().default(null),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

type SlideFormValues = z.infer<typeof slideSchema>;

// Helper to extract opacity % from rgba string
function getOpacityFromRgba(rgba?: string | null): number {
  if (!rgba) return 35;
  const match = rgba.match(/rgba\(0,0,0,([\d.]+)\)/);
  return match ? Math.round(parseFloat(match[1]) * 100) : 35;
}

function buildDefaults(slide?: HeroSlideData): SlideFormValues {
  return {
    headline: slide?.headline || "",
    subheadline: slide?.subheadline || "",
    ctaText: slide?.ctaText || "",
    ctaLink: slide?.ctaLink || "",
    desktopImageUrl: slide?.desktopImageUrl || "",
    mobileImageUrl: slide?.mobileImageUrl || "",
    desktopPublicId: slide?.desktopPublicId || "",
    mobilePublicId: slide?.mobilePublicId || "",
    overlayColor: slide?.overlayColor || "rgba(0,0,0,0.35)",
    textAlign: (slide?.textAlign as "left" | "center" | "right") || "left",
    verticalAlign: (slide?.verticalAlign as "top" | "center" | "bottom") || "center",
    videoUrl: slide?.videoUrl || "",
    videoPublicId: slide?.videoPublicId || "",
    duration: slide?.duration ?? null,
    isActive: slide?.isActive ?? true,
    sortOrder: slide?.sortOrder ?? 0,
  };
}

interface HeroSlideFormProps {
  slide?: HeroSlideData;
  onSuccess: () => void;
  onClose: () => void;
  open: boolean;
}

export function HeroSlideForm({ slide, onSuccess, onClose, open }: HeroSlideFormProps) {
  const [loading, setLoading] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(getOpacityFromRgba(slide?.overlayColor));

  const form = useForm<SlideFormValues>({
    resolver: zodResolver(slideSchema) as any,
    defaultValues: buildDefaults(slide),
  });

  // ─── Re-initialise form whenever the slide prop changes (Edit vs. Create) ─
  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(slide) as any);
      setOverlayOpacity(getOpacityFromRgba(slide?.overlayColor));
    }
  }, [open, slide]); // eslint-disable-line react-hooks/exhaustive-deps

  const values = useWatch({ control: form.control });

  // Keep the hidden overlayColor field in sync with the slider
  useEffect(() => {
    form.setValue("overlayColor", `rgba(0,0,0,${overlayOpacity / 100})`);
  }, [overlayOpacity]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: SlideFormValues) => {
    setLoading(true);
    try {
      const url = slide 
        ? `/api/dashboard/hero-slides/${slide.id}` 
        : "/api/dashboard/hero-slides";
      
      const response = await fetch(url, {
        method: slide ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save slide");
      }

      toast.success(slide ? "Slide updated." : "Slide created.");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent className="sm:max-w-xl overflow-y-auto rounded-l-3xl">
        <SheetHeader>
          <SheetTitle>{slide ? "Edit Slide" : "Add New Slide"}</SheetTitle>
          <SheetDescription>
            Configure your hero slide content and images.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8 py-6 px-1">
            <div className="space-y-6">
              {/* Images Section */}
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control as any}
                  name="desktopImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desktop Image — for screens ≥ 768px</FormLabel>
                      <FormDescription>
                        Recommended: 1440 × 600 px, landscape orientation, max 5 MB.
                      </FormDescription>
                      <FormControl>
                        <ImageUpload
                          value={field.value ? [{ url: field.value, publicId: form.getValues("desktopPublicId") }] : []}
                          onChange={(images) => {
                            field.onChange(images[0]?.url || "");
                            form.setValue("desktopPublicId", images[0]?.publicId || "");
                          }}
                          onRemove={() => {
                            field.onChange("");
                            form.setValue("desktopPublicId", "");
                          }}
                          maxImages={1}
                          folder="miduka/hero/desktop"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="mobileImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Image — for screens &lt; 768px</FormLabel>
                      <FormDescription>
                        Recommended: 768 × 900 px, portrait orientation, max 5 MB.
                      </FormDescription>
                      <FormControl>
                        <ImageUpload
                          value={field.value ? [{ url: field.value, publicId: form.getValues("mobilePublicId") }] : []}
                          onChange={(images) => {
                            field.onChange(images[0]?.url || "");
                            form.setValue("mobilePublicId", images[0]?.publicId || "");
                          }}
                          onRemove={() => {
                            field.onChange("");
                            form.setValue("mobilePublicId", "");
                          }}
                          maxImages={1}
                          folder="miduka/hero/mobile"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control as any}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Background Video (Optional)</FormLabel>
                    <FormDescription>
                      Replaces images if present. MP4, WEBM up to 20MB. Short animations only.
                    </FormDescription>
                    <FormControl>
                      <ImageUpload
                        value={field.value ? [{ url: field.value, publicId: form.getValues("videoPublicId") }] : []}
                        onChange={(assets) => {
                          field.onChange(assets[0]?.url || "");
                          form.setValue("videoPublicId", assets[0]?.publicId || "");
                        }}
                        onRemove={() => {
                          field.onChange("");
                          form.setValue("videoPublicId", "");
                        }}
                        maxImages={1}
                        resourceType="video"
                        folder="miduka/hero/videos"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Content Section */}
              <FormField
                control={form.control as any}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between">
                      <FormLabel>Headline</FormLabel>
                      <span className="text-[10px] text-muted-foreground">{(field.value || "").length}/120</span>
                    </div>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="e.g. New Collection Arrived" maxLength={120} className="rounded-2xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="subheadline"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between">
                      <FormLabel>Subheadline</FormLabel>
                      <span className="text-[10px] text-muted-foreground">{(field.value || "").length}/200</span>
                    </div>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} placeholder="e.g. Free delivery on orders over KES 3,000" maxLength={200} className="rounded-2xl resize-none" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="ctaText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CTA Button Text</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="e.g. Shop Now" maxLength={50} className="rounded-2xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {values.ctaText && (
                  <FormField
                    control={form.control as any}
                    name="ctaLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CTA Button Link</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="e.g. /categories/women" maxLength={500} className="rounded-2xl" />
                        </FormControl>
                        <FormDescription className="text-[10px]">
                          Use / for internal pages.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Design Section */}
              <div className="space-y-4">
                <FormLabel>Text Placement</FormLabel>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="textAlign"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <span className="text-[10px] text-muted-foreground font-medium uppercase">Horizontal</span>
                        <FormControl>
                          <ToggleGroup value={[field.value]} onValueChange={(val: string[]) => val[0] && field.onChange(val[0])} className="justify-start">
                            <ToggleGroupItem value="left" aria-label="Align left" className="rounded-l-xl flex-1">
                              <AlignLeft className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem value="center" aria-label="Align center" className="flex-1">
                              <AlignCenter className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem value="right" aria-label="Align right" className="rounded-r-xl flex-1">
                              <AlignRight className="h-4 w-4" />
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="verticalAlign"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <span className="text-[10px] text-muted-foreground font-medium uppercase">Vertical</span>
                        <FormControl>
                          <ToggleGroup value={[field.value]} onValueChange={(val: string[]) => val[0] && field.onChange(val[0])} className="justify-start">
                            <ToggleGroupItem value="top" aria-label="Align top" className="rounded-l-xl flex-1">
                              <ChevronUp className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem value="center" aria-label="Align center" className="flex-1">
                              <MoveVertical className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem value="bottom" aria-label="Align bottom" className="rounded-r-xl flex-1">
                              <ChevronDown className="h-4 w-4" />
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <FormItem>
                  <FormLabel>Overlay Darkness: {overlayOpacity}%</FormLabel>
                  <FormControl>
                    <Slider
                      value={[overlayOpacity]}
                      onValueChange={(val: number | readonly number[]) => setOverlayOpacity(Array.isArray(val) ? val[0] : val)}
                      max={80}
                      step={5}
                      className="py-4"
                    />
                  </FormControl>
                </FormItem>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slide Duration</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val === "default" ? null : parseInt(val))} 
                        value={field.value?.toString() || "default"}
                      >
                        <FormControl>
                          <SelectTrigger className="rounded-2xl">
                            <SelectValue placeholder="Default" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="default">Default (Global)</SelectItem>
                          <SelectItem value="3000">3 seconds</SelectItem>
                          <SelectItem value="4000">4 seconds</SelectItem>
                          <SelectItem value="6000">6 seconds</SelectItem>
                          <SelectItem value="8000">8 seconds</SelectItem>
                          <SelectItem value="10000">10 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-2xl border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription className="text-[10px]">
                          Show on storefront
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Preview Section */}
              <div className="space-y-3">
                <FormLabel>Live Preview</FormLabel>
                <Tabs defaultValue="desktop" className="w-full border rounded-3xl overflow-hidden">
                  <TabsList className="w-full justify-start rounded-none border-b bg-muted/50 h-10 px-4">
                    <TabsTrigger value="desktop" className="text-xs h-8 px-4 rounded-full data-[state=active]:bg-background">Desktop</TabsTrigger>
                    <TabsTrigger value="mobile" className="text-xs h-8 px-4 rounded-full data-[state=active]:bg-background">Mobile</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="desktop" className="m-0 p-0">
                    <div className="relative aspect-[16/5] bg-muted overflow-hidden">
                      {values.videoUrl ? (
                        <video src={values.videoUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                      ) : values.desktopImageUrl ? (
                        <Image src={values.desktopImageUrl} alt="Desktop Preview" fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30"><ImageIcon className="h-8 w-8" /></div>
                      )}
                      <div className="absolute inset-0" style={{ backgroundColor: values.overlayColor }} />
                      <div className={`absolute inset-0 flex flex-col p-6 text-white ${
                        values.textAlign === "left" ? "items-start text-left" : 
                        values.textAlign === "center" ? "items-center text-center" : 
                        "items-end text-right"
                      } ${
                        values.verticalAlign === "top" ? "justify-start pt-8" :
                        values.verticalAlign === "center" ? "justify-center" :
                        "justify-end pb-8"
                      }`}>
                        <h3 className="text-lg font-bold drop-shadow-md leading-tight max-w-xs">{values.headline || "Headline"}</h3>
                        <p className="text-[10px] opacity-90 drop-shadow-sm mt-1 max-w-xs">{values.subheadline || "Subheadline text"}</p>
                        {values.ctaText && (
                          <div className="mt-2 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">{values.ctaText}</div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="mobile" className="m-0 p-0">
                    <div className="relative aspect-[4/5] bg-muted overflow-hidden max-w-[200px] mx-auto">
                      {values.videoUrl ? (
                        <video src={values.videoUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                      ) : values.mobileImageUrl ? (
                        <Image src={values.mobileImageUrl} alt="Mobile Preview" fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30"><ImageIcon className="h-8 w-8" /></div>
                      )}
                      <div className="absolute inset-0" style={{ backgroundColor: values.overlayColor }} />
                      <div className={`absolute inset-0 flex flex-col p-4 text-white ${
                        values.textAlign === "left" ? "items-start text-left" : 
                        values.textAlign === "center" ? "items-center text-center" : 
                        "items-end text-right"
                      } ${
                        values.verticalAlign === "top" ? "justify-start pt-4" :
                        values.verticalAlign === "center" ? "justify-center" :
                        "justify-end pb-4"
                      }`}>
                        <h3 className="text-sm font-bold drop-shadow-md leading-tight">{values.headline || "Headline"}</h3>
                        <p className="text-[8px] opacity-90 drop-shadow-sm mt-1">{values.subheadline || "Subheadline text"}</p>
                        {values.ctaText && (
                          <div className="mt-2 px-2 py-1 bg-primary text-primary-foreground text-[8px] font-bold rounded-full">{values.ctaText}</div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <SheetFooter>
              <Button type="submit" disabled={loading} className="w-full rounded-full h-11 gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {slide ? "Update Slide" : "Create Slide"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
