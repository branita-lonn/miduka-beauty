// lib/cloudinary-blur.ts
// Utility for generating base64 blur placeholders for images

import { getPlaiceholder } from "plaiceholder";

/**
 * Generates a base64 blurDataURL for a given image URL.
 * Uses plaiceholder to process the image and return a small base64 string.
 */
export async function generateBlurDataUrl(url: string): Promise<string | null> {
  if (!url) return null;

  try {
    // We need to fetch the image first because plaiceholder requires a buffer/arrayBuffer
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`[BLUR_GEN] Failed to fetch image: ${url} (${response.status})`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const { base64 } = await getPlaiceholder(buffer, { size: 10 });
    
    return base64;
  } catch (error) {
    console.error(`[BLUR_GEN_ERROR] ${url}:`, error);
    return null;
  }
}
