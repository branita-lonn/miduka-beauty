// prisma/attribute-seeds/electronics.ts
// Purpose: Seeds Electronics store attribute definitions.
// Run: npx tsx prisma/attribute-seeds/electronics.ts

import { PrismaClient, AttributeInputType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const definitions = [
    { key: "colour", label: "Colour", unit: null, inputType: AttributeInputType.COLOR, isFilterable: true, sortOrder: 0, allowedValues: [] },
    { key: "capacity", label: "Capacity", unit: "L", inputType: AttributeInputType.NUMBER, isFilterable: true, sortOrder: 1, allowedValues: [] },
    { key: "energy_rating", label: "Energy Rating", unit: null, inputType: AttributeInputType.SELECT, isFilterable: true, sortOrder: 2, allowedValues: ["A+++", "A++", "A+", "A", "B", "C", "D"] },
    { key: "screen_size", label: "Screen Size", unit: "inches", inputType: AttributeInputType.NUMBER, isFilterable: true, sortOrder: 3, allowedValues: [] },
    { key: "door_type", label: "Door Type", unit: null, inputType: AttributeInputType.SELECT, isFilterable: false, sortOrder: 4, allowedValues: ["Single Door", "Double Door", "French Door", "Side by Side"] },
    { key: "load_type", label: "Load Type", unit: null, inputType: AttributeInputType.SELECT, isFilterable: false, sortOrder: 5, allowedValues: ["Top Load", "Front Load"] },
    { key: "noise_level", label: "Noise Level", unit: "dB", inputType: AttributeInputType.NUMBER, isFilterable: false, sortOrder: 6, allowedValues: [] },
    { key: "connectivity", label: "Connectivity", unit: null, inputType: AttributeInputType.SELECT, isFilterable: false, sortOrder: 7, allowedValues: ["Wi-Fi", "Bluetooth", "Wi-Fi + Bluetooth", "None"] },
    { key: "has_inverter", label: "Inverter", unit: null, inputType: AttributeInputType.BOOLEAN, isFilterable: false, sortOrder: 8, allowedValues: [] },
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
