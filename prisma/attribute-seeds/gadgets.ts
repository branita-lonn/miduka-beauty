// prisma/attribute-seeds/gadgets.ts
// Purpose: Seeds Gadgets store attribute definitions.
// Run: npx tsx prisma/attribute-seeds/gadgets.ts

import { PrismaClient, AttributeInputType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const definitions = [
    { key: "colour", label: "Colour", unit: null, inputType: AttributeInputType.COLOR, isFilterable: true, sortOrder: 0, allowedValues: [] },
    { key: "ram", label: "RAM", unit: "GB", inputType: AttributeInputType.SELECT, isFilterable: true, sortOrder: 1, allowedValues: ["2", "4", "6", "8", "12", "16", "32"] },
    { key: "storage", label: "Storage", unit: "GB", inputType: AttributeInputType.SELECT, isFilterable: true, sortOrder: 2, allowedValues: ["32", "64", "128", "256", "512", "1000"] },
    { key: "processor", label: "Processor", unit: null, inputType: AttributeInputType.TEXT, isFilterable: false, sortOrder: 3, allowedValues: [] },
    { key: "screen_size", label: "Screen Size", unit: "inch", inputType: AttributeInputType.NUMBER, isFilterable: true, sortOrder: 4, allowedValues: [] },
    { key: "battery", label: "Battery", unit: "mAh", inputType: AttributeInputType.NUMBER, isFilterable: false, sortOrder: 5, allowedValues: [] },
    { key: "connectivity", label: "Connectivity", unit: null, inputType: AttributeInputType.SELECT, isFilterable: false, sortOrder: 6, allowedValues: ["Wi-Fi", "4G", "5G", "4G + Wi-Fi", "5G + Wi-Fi"] },
    { key: "os", label: "Operating System", unit: null, inputType: AttributeInputType.SELECT, isFilterable: false, sortOrder: 7, allowedValues: ["Android", "iOS", "Windows", "macOS", "Linux", "HarmonyOS"] },
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
