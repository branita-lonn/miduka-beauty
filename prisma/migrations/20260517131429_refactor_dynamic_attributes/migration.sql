/*
  Warnings:

  - You are about to drop the column `colour` on the `ProductImage` table. All the data in the column will be lost.
  - You are about to drop the column `colour` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `material` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `ProductVariant` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "StoreVertical" AS ENUM ('FASHION', 'ELECTRONICS', 'GADGETS', 'BEAUTY', 'JEWELLERY', 'FRESH_PRODUCE', 'GENERAL');

-- CreateEnum
CREATE TYPE "AttributeInputType" AS ENUM ('TEXT', 'NUMBER', 'SELECT', 'BOOLEAN', 'COLOR');

-- AlterTable
ALTER TABLE "GiftCard" ADD COLUMN     "mpesaCheckoutRequestId" TEXT,
ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "recipientEmail" TEXT,
ADD COLUMN     "recipientName" TEXT,
ADD COLUMN     "senderName" TEXT;

-- AlterTable
ALTER TABLE "ProductImage" DROP COLUMN "colour";

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "colour",
DROP COLUMN "material",
DROP COLUMN "size";

-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "aboutPage" TEXT,
ADD COLUMN     "contactPage" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'KES',
ADD COLUMN     "currencyLocale" TEXT NOT NULL DEFAULT 'en-KE',
ADD COLUMN     "privacyPolicy" TEXT,
ADD COLUMN     "storeVertical" "StoreVertical" NOT NULL DEFAULT 'FASHION';

-- AlterTable
ALTER TABLE "hero_slides" ADD COLUMN     "verticalAlign" TEXT DEFAULT 'center',
ADD COLUMN     "videoPublicId" TEXT,
ADD COLUMN     "videoUrl" TEXT;

-- CreateTable
CREATE TABLE "AttributeDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit" TEXT,
    "inputType" "AttributeInputType" NOT NULL DEFAULT 'TEXT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFilterable" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttributeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeAllowedValue" (
    "id" TEXT NOT NULL,
    "attributeDefinitionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AttributeAllowedValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariantAttribute" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "attributeDefinitionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ProductVariantAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImageVariant" (
    "imageId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,

    CONSTRAINT "ProductImageVariant_pkey" PRIMARY KEY ("imageId","variantId")
);

-- CreateIndex
CREATE INDEX "AttributeDefinition_categoryId_idx" ON "AttributeDefinition"("categoryId");

-- CreateIndex
CREATE INDEX "AttributeDefinition_isFilterable_idx" ON "AttributeDefinition"("isFilterable");

-- CreateIndex
CREATE INDEX "AttributeDefinition_sortOrder_idx" ON "AttributeDefinition"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeDefinition_key_categoryId_key" ON "AttributeDefinition"("key", "categoryId");

-- CreateIndex
CREATE INDEX "AttributeAllowedValue_attributeDefinitionId_idx" ON "AttributeAllowedValue"("attributeDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeAllowedValue_attributeDefinitionId_value_key" ON "AttributeAllowedValue"("attributeDefinitionId", "value");

-- CreateIndex
CREATE INDEX "ProductVariantAttribute_variantId_idx" ON "ProductVariantAttribute"("variantId");

-- CreateIndex
CREATE INDEX "ProductVariantAttribute_attributeDefinitionId_idx" ON "ProductVariantAttribute"("attributeDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantAttribute_variantId_attributeDefinitionId_key" ON "ProductVariantAttribute"("variantId", "attributeDefinitionId");

-- CreateIndex
CREATE INDEX "ProductImageVariant_variantId_idx" ON "ProductImageVariant"("variantId");

-- CreateIndex
CREATE INDEX "GiftCard_mpesaCheckoutRequestId_idx" ON "GiftCard"("mpesaCheckoutRequestId");

-- AddForeignKey
ALTER TABLE "AttributeDefinition" ADD CONSTRAINT "AttributeDefinition_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeAllowedValue" ADD CONSTRAINT "AttributeAllowedValue_attributeDefinitionId_fkey" FOREIGN KEY ("attributeDefinitionId") REFERENCES "AttributeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantAttribute" ADD CONSTRAINT "ProductVariantAttribute_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantAttribute" ADD CONSTRAINT "ProductVariantAttribute_attributeDefinitionId_fkey" FOREIGN KEY ("attributeDefinitionId") REFERENCES "AttributeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImageVariant" ADD CONSTRAINT "ProductImageVariant_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "ProductImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImageVariant" ADD CONSTRAINT "ProductImageVariant_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
