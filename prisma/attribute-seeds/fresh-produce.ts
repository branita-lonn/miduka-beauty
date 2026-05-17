// prisma/attribute-seeds/fresh-produce.ts
// Purpose: Seeds Fresh Produce store attribute definitions.
// Run: npx tsx prisma/attribute-seeds/fresh-produce.ts

import { PrismaClient, AttributeInputType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const definitions = [
    { key: "weight", label: "Weight", unit: "kg", inputType: AttributeInputType.SELECT, isFilterable: true, sortOrder: 0, allowedValues: ["0.25", "0.5", "1", "2", "5", "10"] },
    { key: "grade", label: "Grade", unit: null, inputType: AttributeInputType.SELECT, isFilterable: false, sortOrder: 1, allowedValues: ["Premium", "Grade A", "Grade B", "Grade C"] },
    { key: "origin", label: "Origin", unit: null, inputType: AttributeInputType.TEXT, isFilterable: false, sortOrder: 2, allowedValues: [] },
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
