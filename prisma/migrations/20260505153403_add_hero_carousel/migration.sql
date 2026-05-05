-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "heroCarouselAutoplay" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "heroCarouselInterval" INTEGER NOT NULL DEFAULT 5000;

-- CreateTable
CREATE TABLE "hero_slides" (
    "id" TEXT NOT NULL,
    "headline" TEXT,
    "subheadline" TEXT,
    "ctaText" TEXT,
    "ctaLink" TEXT,
    "desktopImageUrl" TEXT NOT NULL,
    "mobileImageUrl" TEXT NOT NULL,
    "desktopPublicId" TEXT,
    "mobilePublicId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "overlayColor" TEXT DEFAULT 'rgba(0,0,0,0.35)',
    "textAlign" TEXT DEFAULT 'left',
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_slides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hero_slides_sortOrder_idx" ON "hero_slides"("sortOrder");

-- CreateIndex
CREATE INDEX "hero_slides_isActive_idx" ON "hero_slides"("isActive");
