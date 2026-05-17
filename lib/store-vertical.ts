// file: lib/store-vertical.ts
// purpose: Per-vertical configuration — defines variant dimensions, AI prompt hints,
//          and search expansion context for each store type. This is the single source
//          of truth that drives AI generalisation across the platform.
//          Imported by: lib/ai-prompts.ts, prisma/attribute-seeds/, app/api/products/route.ts

import { StoreVertical } from "@prisma/client";

export interface VerticalConfig {
  /** Human-readable store type name, e.g. "Fashion Store" */
  label: string;
  /**
   * The attribute keys that define variant dimensions for this vertical.
   * These are the keys that, when combined, uniquely identify a SKU.
   * The order determines display order in variant builders and on the PDP.
   * Each key must correspond to an AttributeDefinition.key that has been seeded.
   */
  variantDimensionKeys: string[];
  /**
   * Injected into the AI smart-search expansion prompt when the store's
   * storeVertical matches this entry. Write it as a noun phrase that completes
   * "...for a {searchExpansionContext}."
   */
  searchExpansionContext: string;
  /**
   * Injected into the AI product description prompt as an additional instruction.
   * Write it as an imperative sentence.
   */
  aiDescriptionInstruction: string;
  /**
   * Injected into the AI price suggestion prompt.
   * Write it as an imperative sentence.
   */
  aiPriceInstruction: string;
}

export const VERTICAL_CONFIG: Record<StoreVertical, VerticalConfig> = {
  FASHION: {
    label: "Fashion Store",
    variantDimensionKeys: ["colour", "size", "material"],
    searchExpansionContext:
      "fashion and lifestyle e-commerce store selling clothing, shoes, and accessories",
    aiDescriptionInstruction:
      "Focus on style, occasion suitability, fit, and material quality. Avoid generic phrases.",
    aiPriceInstruction:
      "Consider fabric quality, brand positioning, and seasonal demand in the local market.",
  },

  ELECTRONICS: {
    label: "Electronics Store",
    variantDimensionKeys: ["colour", "capacity", "energy_rating"],
    searchExpansionContext:
      "home electronics store selling TVs, fridges, washing machines, and sound systems",
    aiDescriptionInstruction:
      "Highlight energy efficiency, capacity, key features, and warranty length. Be factual.",
    aiPriceInstruction:
      "Consider energy rating, brand tier, and capacity relative to comparable models locally.",
  },

  GADGETS: {
    label: "Gadgets Store",
    variantDimensionKeys: ["colour", "ram", "storage"],
    searchExpansionContext:
      "tech and gadgets store selling smartphones, laptops, headphones, and accessories",
    aiDescriptionInstruction:
      "Emphasise performance, camera quality, battery life, and ecosystem compatibility.",
    aiPriceInstruction:
      "Consider RAM, storage tier, processor generation, and brand compared to local market rates.",
  },

  BEAUTY: {
    label: "Beauty Store",
    variantDimensionKeys: ["colour", "hair_type", "length"],
    searchExpansionContext:
      "beauty store selling wigs, skincare products, cosmetics, and haircare",
    aiDescriptionInstruction:
      "Highlight benefits, skin or hair type suitability, key ingredients, and expected results.",
    aiPriceInstruction:
      "Consider hair type, length, brand origin, and ingredient quality in the local market.",
  },

  JEWELLERY: {
    label: "Jewellery Store",
    variantDimensionKeys: ["metal", "colour", "size"],
    searchExpansionContext:
      "jewellery store selling rings, necklaces, bracelets, and earrings",
    aiDescriptionInstruction:
      "Emphasise craftsmanship, metal type, gemstone quality, and occasion suitability.",
    aiPriceInstruction:
      "Consider metal purity, stone quality, carat weight, and certification in pricing.",
  },

  FRESH_PRODUCE: {
    label: "Fresh Produce Vendor",
    variantDimensionKeys: ["weight", "grade"],
    searchExpansionContext:
      "fresh fruits and vegetables vendor selling farm-fresh produce and groceries",
    aiDescriptionInstruction:
      "Highlight freshness, farm origin, nutritional value, and storage or preparation tips.",
    aiPriceInstruction:
      "Consider seasonal availability, farm origin, grade, and current local market prices.",
  },

  GENERAL: {
    label: "General Store",
    variantDimensionKeys: ["colour", "size"],
    searchExpansionContext: "general e-commerce store",
    aiDescriptionInstruction:
      "Be factual and clearly state the key value proposition for the buyer.",
    aiPriceInstruction:
      "Consider product category, brand, and comparable items in the local market.",
  },
};

/**
 * Returns the VerticalConfig for a given StoreVertical.
 * Throws at runtime if a new enum value is added without a corresponding config entry,
 * acting as a completeness guard.
 */
export function getVerticalConfig(vertical: StoreVertical): VerticalConfig {
  const config = VERTICAL_CONFIG[vertical];
  if (!config) {
    throw new Error(
      `[STORE_VERTICAL] No config found for vertical "${vertical}". ` +
      `Add an entry to VERTICAL_CONFIG in lib/store-vertical.ts.`
    );
  }
  return config;
}

/**
 * Returns the attribute keys that create distinct variant SKUs for this vertical.
 * Used by the product form to label variant dimension inputs correctly.
 */
export function getVariantDimensionKeys(vertical: StoreVertical): string[] {
  return getVerticalConfig(vertical).variantDimensionKeys;
}
