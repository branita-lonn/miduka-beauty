// prisma/attribute-seeds/fashion.ts
// Purpose: Seeds Fashion store attribute definitions.
// Run: npx tsx prisma/attribute-seeds/fashion.ts

import { PrismaClient, AttributeInputType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const definitions = [
    { key: "colour", label: "Colour", unit: null, inputType: AttributeInputType.COLOR, isFilterable: true, sortOrder: 0, allowedValues: [] },
    { key: "size", label: "Size", unit: null, inputType: AttributeInputType.SELECT, isFilterable: true, sortOrder: 1, allowedValues: ["XS", "S", "M", "L", "XL", "XXL", "One Size"] },
    { key: "material", label: "Material", unit: null, inputType: AttributeInputType.TEXT, isFilterable: false, sortOrder: 2, allowedValues: [] },
  ];

  for (const def of definitions) {
    let existing = await prisma.attributeDefinition.findFirst({
      where: { key: def.key, categoryId: null },
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
