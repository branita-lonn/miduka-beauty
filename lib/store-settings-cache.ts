// file: lib/store-settings-cache.ts
// purpose: Module-level cache for StoreSettings. Prevents repeated DB reads
//          on every request in routes that need currency or storeVertical.
//          TTL is 60 seconds. Import and call getStoreSettings() in any server route.
//          This is a SERVER-ONLY module. Never import it in a client component.

import { prisma } from "@/lib/prisma";
import { StoreVertical } from "@prisma/client";

interface CachedStoreSettings {
  storeName: string;
  storeVertical: StoreVertical;
  currency: string;
  currencyLocale: string;
}

let _cache: CachedStoreSettings | null = null;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 60_000;

export async function getStoreSettings(): Promise<CachedStoreSettings> {
  const now = Date.now();
  if (_cache && now < _cacheExpiry) return _cache;

  const settings = await prisma.storeSettings.findFirst({
    select: {
      storeName:      true,
      storeVertical:  true,
      currency:       true,
      currencyLocale: true,
    },
  });

  _cache = settings ?? {
    storeName:      "Store",
    storeVertical:  StoreVertical.GENERAL,
    currency:       "KES",
    currencyLocale: "en-KE",
  };
  _cacheExpiry = now + CACHE_TTL_MS;
  return _cache;
}

/**
 * Call after a successful StoreSettings PUT/PATCH to force a fresh read on the next request.
 * This is SERVER-ONLY — call it inside the API route handler, never in a client component.
 */
export function invalidateStoreSettingsCache(): void {
  _cache = null;
  _cacheExpiry = 0;
}
