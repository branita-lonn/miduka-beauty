// prisma/attribute-seeds/jewellery.ts
// Purpose: Seeds Jewellery store attribute definitions.
// Run: npx tsx prisma/attribute-seeds/jewellery.ts

import { PrismaClient, AttributeInputType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const definitions = [
    { key: "metal", label: "Metal", unit: null, inputType: AttributeInputType.SELECT, isFilterable: true, sortOrder: 0, allowedValues: ["Gold", "Silver", "Rose Gold", "Platinum", "Stainless Steel", "Copper"] },
    { key: "colour", label: "Colour", unit: null, inputType: AttributeInputType.COLOR, isFilterable: true, sortOrder: 1, allowedValues: [] },
    { key: "size", label: "Size", unit: null, inputType: AttributeInputType.SELECT, isFilterable: true, sortOrder: 2, allowedValues: ["5", "6", "7", "8", "9", "10", "11", "12", "One Size"] },
    { key: "stone", label: "Stone", unit: null, inputType: AttributeInputType.SELECT, isFilterable: false, sortOrder: 3, allowedValues: ["Diamond", "Ruby", "Emerald", "Sapphire", "Pearl", "No Stone"] },
    { key: "weight", label: "Weight", unit: "g", inputType: AttributeInputType.NUMBER, isFilterable: false, sortOrder: 4, allowedValues: [] },
  ];

  for (const def of definitions) {
    let existing = await prisma.attributeDefinition.findFirst({
      where: { key: def.key, isGlobal: true },
    });

    if (!existing) {
      existing = await prisma.attributeDefinition.create({
        data: {
          key: def.key,
          label: def.label,
          unit: def.unit,
          inputType: def.inputType,
          isFilterable: def.isFilterable,
          sortOrder: def.sortOrder,
        },
      });
      console.log(`Created AttributeDefinition: ${def.key}`);
    } else {
      existing = await prisma.attributeDefinition.update({
        where: { id: existing.id },
        data: {
          label: def.label,
          unit: def.unit,
          inputType: def.inputType,
          isFilterable: def.isFilterable,
          sortOrder: def.sortOrder,
        },
      });
      console.log(`Updated AttributeDefinition: ${def.key}`);
    }

    for (let idx = 0; idx < def.allowedValues.length; idx++) {
      const val = def.allowedValues[idx];
      const existingVal = await prisma.attributeAllowedValue.findFirst({
        where: { attributeDefinitionId: existing.id, value: val },
      });

      if (!existingVal) {
        await prisma.attributeAllowedValue.create({
          data: {
            attributeDefinitionId: existing.id,
            value: val,
            sortOrder: idx,
          },
        });
        console.log(`Created Allowed Value: ${val} for ${def.key}`);
      } else {
        await prisma.attributeAllowedValue.update({
          where: { id: existingVal.id },
          data: { sortOrder: idx },
        });
      }
    }
  }
}

main()
  .catch((e) => { console.error("[ATTRIBUTE_SEED_ERROR]", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
