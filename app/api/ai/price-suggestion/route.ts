/**
 * file: app/api/ai/price-suggestion/route.ts
 * purpose: AI-powered price suggestions for sellers based on store data or market estimates
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateText } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/store-settings-cache";

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Check authorization: STORE_OWNER only
    if (!session || session.user?.role !== "STORE_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, categoryId, variants } = body;

    if (!categoryId || categoryId === "none") {
      return new NextResponse("Category is required for price suggestions", { status: 400 });
    }

    // Support category lookup by ID (UUID/CUID) or slug
    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { id: categoryId },
          { slug: categoryId },
        ],
      },
      select: { id: true, name: true }
    });

    if (!category) {
      return new NextResponse("Category not found", { status: 404 });
    }

    const categoryIdResolved = category.id;
    const { storeVertical, currency } = await getStoreSettings();

    // 1. Check store data first (priority)
    const categoryProducts = await prisma.product.findMany({
      where: { categoryId: categoryIdResolved, isActive: true },
      select: { price: true },
    });

    if (categoryProducts.length >= 3) {
      const prices = categoryProducts.map(p => Number(p.price));
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

      return NextResponse.json({
        min,
        max,
        avg,
        source: "store_data",
        message: `Similar products in your store sell for ${currency} ${min.toLocaleString()} – ${currency} ${max.toLocaleString()}`,
      });
    }

    // 2. Fallback to AI estimate if store data is insufficient
    const prompt = `
      Provide a rough market price range (in ${currency}) for a product with the following details in the context of a ${storeVertical} store:
      - Name: ${name || "Unknown Product"}
      - Category: ${category.name}
      ${variants ? `- Variants: ${JSON.stringify(variants.map((v: any) => v.attributes ? v.attributes.map((a: any) => `${a.key}: ${a.value}`) : []))}` : ""}

      Respond with ONLY a JSON object: { "min": number, "max": number, "reasoning": string }.
      The reasoning should be a brief 1-sentence explanation of why this range is suggested in the local market for the ${storeVertical} vertical.
      Example: { "min": 1500, "max": 2500, "reasoning": "Standard pricing for these items in typical retail stores." }
    `;

    const aiResponse = await generateText(prompt, 300);
    const cleanJson = aiResponse.replace(/```json|```/g, "").trim();
    const estimate = JSON.parse(cleanJson);

    return NextResponse.json({
      min: estimate.min,
      max: estimate.max,
      source: "ai_estimate",
      reasoning: estimate.reasoning,
      message: `Market estimate: ${currency} ${estimate.min.toLocaleString()} – ${currency} ${estimate.max.toLocaleString()}`,
    });
  } catch (error) {
    console.error("[PRICE_SUGGESTION_ERROR]", error);
    // Fail silently in the UI, but log on server
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
