// file: app/manifest.ts
// purpose: Dynamically generate web app manifest using live database store settings

import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // Fetch live store settings from your database
  const settings = await prisma.storeSettings.findFirst();
  
  const storeName = settings?.storeName || "MiDuka";
  const tagline = settings?.storeTagline || "Your online shopping partner";
  const dynamicLogo = settings?.logoUrl || "/icons/icon-512.png";

  return {
    name: storeName,
    short_name: storeName,
    description: tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3B82F6", // Synced to match the themeColor in RootLayout viewport config
    orientation: "portrait",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-72.png",
        sizes: "72x72",
        type: "image/png"
      },
      {
        src: "/icons/icon-96.png",
        sizes: "96x96",
        type: "image/png"
      },
      {
        src: "/icons/icon-128.png",
        sizes: "128x128",
        type: "image/png"
      },
      {
        src: "/icons/icon-144.png",
        sizes: "144x144",
        type: "image/png"
      },
      {
        src: "/icons/icon-152.png",
        sizes: "152x152",
        type: "image/png"
      },
      // If the user uploaded a custom logo via admin panel, it can be injected it here as the main icons
      {
        src: dynamicLogo,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icons/icon-384.png",
        sizes: "384x384",
        type: "image/png"
      },
      {
        src: dynamicLogo,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    screenshots: [
      {
        src: "/screenshots/narrow.png",
        sizes: "750x1334",
        type: "image/png",
        form_factor: "narrow"
      },
      {
        src: "/screenshots/wide.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide"
      }
    ]
  };
}