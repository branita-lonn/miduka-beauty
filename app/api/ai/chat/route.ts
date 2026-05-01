/**
 * file: app/api/ai/chat/route.ts
 * purpose: Public streaming AI chat assistant with store context
 */

import { generateTextStreaming } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

// In-memory rate limit: 20 requests per IP per hour
// Resets on server restart. Upgrade to Redis for production.
const ipLimits = new Map<string, { count: number; reset: number }>();

// Cleanup routine for rate limits
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [ip, limit] of ipLimits.entries()) {
            if (now > limit.reset) {
                ipLimits.delete(ip);
            }
        }
    }, 3600000); // Hourly cleanup
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const limit = ipLimits.get(ip);

    if (limit && now < limit.reset) {
      if (limit.count >= 20) {
        return new Response("Too many requests. Please try again in an hour.", { status: 429 });
      }
      limit.count++;
    } else {
      ipLimits.set(ip, { count: 1, reset: now + 3600000 });
    }

    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    // Fetch store settings for context
    const store = await prisma.storeSettings.findFirst();
    const storeName = store?.storeName || "MiDuka";
    const returnPolicy = store?.returnPolicy || "Please contact us for returns.";

    // Fetch product context if provided (customer viewing specific product)
    let productDetails = "";
    if (context?.productSlug) {
      const product = await prisma.product.findUnique({
        where: { slug: context.productSlug },
        include: { category: true, variants: true }
      });
      if (product) {
        productDetails = `The customer is currently viewing: ${product.name} (Price: KES ${product.price}, Category: ${product.category?.name}, Stock: ${product.stockQuantity}). 
        Description: ${product.description || "N/A"}. 
        Variants: ${JSON.stringify(product.variants.map(v => ({ size: v.size, colour: v.colour, stock: v.stockQuantity })))}`;
      }
    }

    // Fetch top 10 featured products for recommendations
    const featuredProducts = await prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      take: 10,
      select: { name: true, price: true, slug: true }
    });

    const featuredInfo = featuredProducts.map(p => `${p.name} (KES ${p.price}, slug: ${p.slug})`).join(", ");

    // Fetch active promotions
    const onSaleProducts = await prisma.product.findMany({
        where: { isOnSale: true, isActive: true },
        take: 5,
        select: { name: true, price: true, slug: true }
    });
    const saleInfo = onSaleProducts.map(p => `${p.name} (KES ${p.price}, slug: ${p.slug})`).join(", ");

    const systemPrompt = `
      Act as a friendly shopping assistant for ${storeName}.
      
      Store Context:
      - Store Name: ${storeName}
      - Return Policy: ${returnPolicy}
      - Available Featured Products: ${featuredInfo}
      ${saleInfo ? `- Active Promotions: ${saleInfo}` : ""}
      ${productDetails ? `- Current Product Details: ${productDetails}` : ""}

      Instructions:
      - Answer questions about products, sizing, availability, delivery, and return policy.
      - When recommending a product, always include its slug so the client can render a clickable link or card.
      - Keep responses concise (2–4 sentences typically).
      - Politely redirect off-topic questions back to relevant products.
      - Never fabricate products not in the catalogue.
      - Respond in the same language the customer writes in (English and Swahili supported).
    `;

    // Format message history for the AI prompt
    const fullPrompt = messages.map((m: any) => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.content}`).join("\n");
    const finalPrompt = `System: ${systemPrompt}\n\n${fullPrompt}\nAssistant:`;

    const encoder = new TextEncoder();
    
    // We start the stream. If generateTextStreaming fails immediately, it might throw before returning the response.
    // However, it's async, so we wrap it in a try-catch for the initial call if possible.
    
    try {
        const stream = new ReadableStream({
          async start(controller) {
            try {
              await generateTextStreaming(finalPrompt, (chunk) => {
                controller.enqueue(encoder.encode(chunk));
              });
              controller.close();
            } catch (error) {
              console.error("[AI_CHAT_STREAM_ERROR]", error);
              // We can't change the status code here as the headers are already sent
              controller.enqueue(encoder.encode("\n\n[ERROR: AI_ALL_PROVIDERS_FAILED]"));
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
    } catch (err) {
        console.error("[AI_CHAT_INIT_ERROR]", err);
        return new Response(JSON.stringify({ error: "AI_ALL_PROVIDERS_FAILED" }), { status: 503 });
    }
    
  } catch (error: unknown) {
    console.error("[AI_CHAT_ERROR]", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
