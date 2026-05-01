// components/store/store-header-server.tsx
// Server Component — fetches StoreSettings and passes props to StoreHeader (Client)

import { prisma } from "@/lib/prisma";
import StoreHeader from "@/components/store/store-header";

export default async function StoreHeaderServer() {
  const settings = await prisma.storeSettings.findFirst({
    select: {
      storeName: true,
      logoUrl: true,
    },
  });

  return (
    <StoreHeader
      storeName={settings?.storeName ?? "MiDuka"}
      logoUrl={settings?.logoUrl ?? null}
    />
  );
}
