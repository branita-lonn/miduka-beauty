// app/dashboard/hero/page.tsx
// Dashboard page for managing the storefront hero carousel slides

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { HeroSlideManager } from "@/components/dashboard/hero-slide-manager";

export const metadata = {
  title: "Hero Carousel Manager | Dashboard",
  description: "Manage your storefront hero slides and carousel settings.",
};

export default async function HeroPage() {
  const session = await auth();

  if (!session || session.user?.role !== UserRole.STORE_OWNER) {
    redirect("/auth/login");
  }

  // Fetch slides ordered by sortOrder
  const slides = await prisma.heroSlide.findMany({
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "asc" }
    ],
  });

  // Fetch global carousel settings
  const settings = await prisma.storeSettings.findFirst({
    select: {
      heroCarouselInterval: true,
      heroCarouselAutoplay: true,
    }
  });

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <HeroSlideManager 
        slides={JSON.parse(JSON.stringify(slides))} 
        settings={settings} 
      />
    </div>
  );
}
