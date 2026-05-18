const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const defs = await prisma.attributeDefinition.findMany({
    include: { allowedValues: true }
  });
  console.log(JSON.stringify(defs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
