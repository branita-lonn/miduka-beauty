-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "imageBlurDataUrl" TEXT;

-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "heroBlurDataUrl" TEXT,
ADD COLUMN     "logoBlurDataUrl" TEXT;
