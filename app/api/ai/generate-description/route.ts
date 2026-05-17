/**
 * file: app/api/ai/generate-description/route.ts
 * purpose: AI product description generator for sellers with 3-tier fallback
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateText } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/store-settings-cache";
import { getVerticalConfig } from "@/lib/store-vertical";

// In-memory rate limit: 10 calls per server instance
// Resets on server restart. Upgrade to Redis for production environments.
let callCount = 0;
const RATE_LIMIT = 10;

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Check authorization: STORE_OWNER only
    if (!session || session.user?.role !== "STORE_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Rate limiting
    if (callCount >= RATE_LIMIT) {
      return new NextResponse(
        "AI generation limit reached for this session. Please write your description manually.",
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, categoryId, tags, variants, price, compareAtPrice, isOnSale } = body;

    if (!name || !categoryId) {
      return new NextResponse("Product name and category are required", { status: 400 });
    }

    // Fetch category name for better prompt context
    // Support category lookup by ID (UUID/CUID) or slug
    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { id: categoryId },
          { slug: categoryId },
        ],
      },
      select: { name: true }
    });

    const categoryName = category?.name || "General";

    const { storeVertical, currency } = await getStoreSettings();
    const verticalConfig = getVerticalConfig(storeVertical);

    callCount++;

    const prompt = `
      Write a compelling 2–4 sentence product description for an e-commerce store.
      
      Product Details:
      - Name: ${name}
      - Category: ${categoryName}
      ${tags && tags.length > 0 ? `- Tags: ${tags.join(", ")}` : ""}
      ${variants && variants.length > 0 ? `- Variants: ${JSON.stringify(variants.map((v: any) => v.attributes ? v.attributes.map((a: any) => `${a.key}: ${a.value}`) : []))}` : ""}
      - Price: ${currency} ${price}
      ${compareAtPrice ? `- Original Price: ${currency} ${compareAtPrice}` : ""}
      ${isOnSale ? "- Status: On Sale" : ""}

      Instructions:
      - Write a compelling 2–4 sentence product description in plain English.
      - Tone & Style: ${verticalConfig.aiDescriptionInstruction}
      - Include natural keyword incorporation for SEO (product name, category).
      ${isOnSale && compareAtPrice ? "- Mention the sale/discount specifically." : ""}
      - Do NOT use hype words like "amazing", "incredible", "game-changer".
      - Output ONLY the description text — no markdown, no preamble, no quotes.
    `;

    const description = await generateText(prompt);

    return NextResponse.json({ description });
  } catch (error: unknown) {
    console.error("[AI_DESCRIPTION_ERROR]", error);
    
    if (error instanceof Error && error.message === "AI_ALL_PROVIDERS_FAILED") {
      return new NextResponse(
        "AI description generation is temporarily unavailable. Please write your description manually.",
        { status: 503 }
      );
    }
    
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
