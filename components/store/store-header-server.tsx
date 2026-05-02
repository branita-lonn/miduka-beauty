// components/store/store-header-server.tsx
// Server Component — fetches StoreSettings and passes props to StoreHeader (Client)

import { prisma } from "@/lib/prisma";
import StoreHeader from "@/components/store/store-header";
import { auth } from "@/auth";

export default async function StoreHeaderServer() {
  const settings = await prisma.storeSettings.findFirst({
    select: {
      storeName: true,
      logoUrl: true,
      logoBlurDataUrl: true,
    },
  });

  const session = await auth();

  return (
    <StoreHeader
      storeName={settings?.storeName ?? "MiDuka"}
      logoUrl={settings?.logoUrl ?? null}
      logoBlurDataUrl={settings?.logoBlurDataUrl ?? null}
      user={session?.user}
    />
  );
}
