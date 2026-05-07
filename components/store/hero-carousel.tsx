// components/store/hero-carousel.tsx
// Responsive, auto-scrolling hero carousel for the storefront homepage

"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { HeroSlideData } from "@/types";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroCarouselProps {
  slides: HeroSlideData[];
  autoplayInterval?: number;
  enableAutoplay?: boolean;
}

export function HeroCarousel({ 
  slides, 
  autoplayInterval = 5000, 
  enableAutoplay = true 
}: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 25 },
    enableAutoplay ? [Autoplay({ delay: autoplayInterval, stopOnInteraction: false })] : []
  );

  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);

  const scrollPrev = React.useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = React.useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = React.useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const onInit = React.useCallback((emblaApi: any) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = React.useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  React.useEffect(() => {
    if (!emblaApi) return;

    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on("reInit", onInit);
    emblaApi.on("select", onSelect);
  }, [emblaApi, onInit, onSelect]);

  if (slides.length === 0) return null;

  return (
    <section className="relative group overflow-hidden rounded-3xl mx-4 md:mx-8 mt-4">
      {/* Embla Container */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => (
            <div key={slide.id} className="relative flex-[0_0_100%] min-w-0">
              {/* Aspect Ratio Container (16:6 Desktop, 4:5 Mobile) */}
              <div className="relative aspect-[4/5] md:aspect-[16/6] w-full overflow-hidden">
                {/* Background Media */}
                {slide.videoUrl ? (
                  <div className="absolute inset-0">
                    <video
                      src={slide.videoUrl}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  </div>
                ) : (
                  <>
                    {/* Desktop Image */}
                    <div className="hidden md:block absolute inset-0">
                      <Image
                        src={slide.desktopImageUrl}
                        alt={slide.headline || "Hero Slide"}
                        fill
                        priority={index === 0}
                        loading={index === 0 ? "eager" : "lazy"}
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 1440px"
                      />
                    </div>
                    {/* Mobile Image */}
                    <div className="block md:hidden absolute inset-0">
                      <Image
                        src={slide.mobileImageUrl}
                        alt={slide.headline || "Hero Slide"}
                        fill
                        priority={index === 0}
                        loading={index === 0 ? "eager" : "lazy"}
                        className="object-cover"
                        sizes="100vw"
                      />
                    </div>
                  </>
                )}

                {/* Overlay Tint */}
                <div 
                  className="absolute inset-0" 
                  style={{ backgroundColor: slide.overlayColor || "rgba(0,0,0,0.35)" }} 
                />

                {/* Content Overlay */}
                <div className={cn(
                  "absolute inset-0 flex flex-col p-8 md:p-20 text-white transition-all duration-700 delay-100 ease-out",
                  selectedIndex === index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
                  // Horizontal Alignment
                  slide.textAlign === "center" ? "items-center text-center" : 
                  slide.textAlign === "right" ? "items-end text-right" : 
                  "items-start text-left",
                  // Vertical Alignment
                  slide.verticalAlign === "top" ? "justify-start pt-16 md:pt-32" :
                  slide.verticalAlign === "bottom" ? "justify-end pb-16 md:pb-32" :
                  "justify-center"
                )}>
                  <div className="max-w-2xl space-y-4">
                    {slide.headline && (
                      <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-xl leading-tight">
                        {slide.headline}
                      </h2>
                    )}
                    {slide.subheadline && (
                      <p className="text-lg md:text-xl font-medium opacity-90 drop-shadow-lg max-w-xl">
                        {slide.subheadline}
                      </p>
                    )}
                    {slide.ctaText && slide.ctaLink && (
                      <div className="pt-4">
                        <Link href={slide.ctaLink}>
                          <Button size="lg" className="rounded-full px-8 h-12 md:h-14 md:text-lg shadow-2xl hover:scale-105 transition-transform">
                            {slide.ctaText}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-black z-20"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-black z-20"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "h-1.5 transition-all duration-500 rounded-full",
                selectedIndex === index ? "w-8 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
