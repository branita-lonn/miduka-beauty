// file: lib/variant-label.ts
// purpose: Computes a human-readable variant label from its attributes.
// Used in: order items, cart items, order history pages, email templates,
//          inventory table, and the storefront product info component.
// Pure function — no Prisma, no side effects, safe to import anywhere including
// client components.

import type { VariantAttributePublic } from "@/types";

/**
 * Returns a slash-separated label like "Silver / 128GB / 8GB RAM".
 *
 * Rules:
 * - COLOR attributes are skipped — they render as swatches, not text labels.
 * - BOOLEAN attributes render as the label only when value is "true" (e.g. "Inverter"),
 *   and are omitted entirely when false.
 * - NUMBER attributes append the unit. Short units (≤2 chars, e.g. "GB", "TB", "dB",
 *   "kg", "mAh") are appended without a space ("256GB"). Longer units (e.g. "inches",
 *   "litres") are appended with a space ("6.7 inches"). If the value already ends with
 *   the unit (case-insensitive), the unit is not appended again.
 * - All other types render as the raw value string.
 * - Returns "Default" if no renderable attributes remain after filtering.
 */
export function computeVariantLabel(attributes: VariantAttributePublic[]): string {
  const parts = attributes
    .filter((a) => a.inputType !== "COLOR")
    .map((a) => {
      if (a.inputType === "BOOLEAN") {
        return a.value === "true" ? a.label : null;
      }
      if (a.inputType === "NUMBER" && a.unit) {
        const alreadyHasUnit = a.value.toLowerCase().endsWith(a.unit.toLowerCase());
        if (alreadyHasUnit) return a.value;
        const separator = a.unit.length <= 2 ? "" : " ";
        return `${a.value}${separator}${a.unit}`;
      }
      return a.value;
    })
    .filter((part): part is string => part !== null && part.trim() !== "");

  return parts.join(" / ") || "Default";
}
