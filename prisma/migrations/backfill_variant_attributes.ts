// file: prisma/migrations/backfill_variant_attributes.ts
// purpose: One-time script that reads the old colour/size/material columns from
//          ProductVariant and writes them as ProductVariantAttribute rows.
//          Also reads ProductImage.colour and creates ProductImageVariant links
//          by matching the colour value to variant attribute values.
//          Safe to run multiple times — unique constraint violations per row are caught
//          individually and counted as skips, not errors.
// Run: npx tsx prisma/migrations/backfill_variant_attributes.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Check if legacy columns exist first
  const columnCheck = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'ProductVariant' AND column_name = 'colour'
  `;

  if (columnCheck.length === 0) {
    console.log("Legacy 'colour' column not found in ProductVariant table. It has already been dropped.");
    console.log("Variant attributes — processed: 0, created: 0, skipped: 0, errors: 0");
    console.log("Image-variant links — processed: 0, created: 0, skipped: 0, errors: 0");
    return;
  }

  // 1. Fetch fashion attribute definitions
  const fashionKeys = ["colour", "size", "material"];
  const definitions = await prisma.attributeDefinition.findMany({
    where: { key: { in: fashionKeys }, isGlobal: true }
  });

  const defMap = new Map(definitions.map(d => [d.key, d.id]));
  const missingKeys = fashionKeys.filter(k => !defMap.has(k));

  if (missingKeys.length > 0) {
    console.warn(`[WARNING] Missing seeded fashion attribute definitions: ${missingKeys.join(", ")}`);
    console.warn("Please run: npx tsx prisma/attribute-seeds/fashion.ts first.");
    process.exit(1);
  }

  // 2. Fetch all legacy ProductVariant rows
  const legacyVariants = await prisma.$queryRaw<
    { id: string; colour: string | null; size: string | null; material: string | null }[]
  >`SELECT id, colour, size, material FROM "ProductVariant"`;

  let varProcessed = 0;
  let varCreated = 0;
  let varSkipped = 0;
  let varErrors = 0;

  for (const variant of legacyVariants) {
    const fields = [
      { key: "colour", value: variant.colour },
      { key: "size", value: variant.size },
      { key: "material", value: variant.material }
    ];

    for (const field of fields) {
      if (!field.value) continue;
      varProcessed++;

      const defId = defMap.get(field.key)!;

      try {
        const existing = await prisma.productVariantAttribute.findFirst({
          where: { variantId: variant.id, attributeDefinitionId: defId }
        });

        if (!existing) {
          await prisma.productVariantAttribute.create({
            data: {
              variantId: variant.id,
              attributeDefinitionId: defId,
              value: field.value
            }
          });
          varCreated++;
        } else {
          varSkipped++;
        }
      } catch (err) {
        console.error(`[ERROR] Failed backfilling variant ${variant.id} attribute ${field.key}:`, err);
        varErrors++;
      }
    }
  }

  // 3. Fetch all legacy ProductImage rows and link to variants
  let imgProcessed = 0;
  let imgCreated = 0;
  let imgSkipped = 0;
  let imgErrors = 0;

  const imageCheck = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'ProductImage' AND column_name = 'colour'
  `;

  if (imageCheck.length > 0) {
    const legacyImages = await prisma.$queryRaw<
      { id: string; colour: string | null; productId: string }[]
    >`SELECT id, colour, "productId" FROM "ProductImage"`;

    const colourDefId = defMap.get("colour")!;

    for (const img of legacyImages) {
      if (!img.colour) continue;
      imgProcessed++;

      try {
        // Find matching variant attributes under the same product
        const matchingVariants = await prisma.productVariantAttribute.findMany({
          where: {
            attributeDefinitionId: colourDefId,
            value: img.colour,
            variant: {
              productId: img.productId
            }
          },
          select: { variantId: true }
        });

        for (const mv of matchingVariants) {
          const existingLink = await prisma.productImageVariant.findUnique({
            where: {
              imageId_variantId: {
                imageId: img.id,
                variantId: mv.variantId
              }
            }
          });

          if (!existingLink) {
            await prisma.productImageVariant.create({
              data: {
                imageId: img.id,
                variantId: mv.variantId
              }
            });
            imgCreated++;
          } else {
            imgSkipped++;
          }
        }
      } catch (err) {
        console.error(`[ERROR] Failed backfilling image-variant links for image ${img.id}:`, err);
        imgErrors++;
      }
    }
  }

  console.log(`Variant attributes — processed: ${varProcessed}, created: ${varCreated}, skipped: ${varSkipped}, errors: ${varErrors}`);
  console.log(`Image-variant links — processed: ${imgProcessed}, created: ${imgCreated}, skipped: ${imgSkipped}, errors: ${imgErrors}`);
}

main()
  .catch((e) => {
    console.error("[BACKFILL_ERROR]", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
