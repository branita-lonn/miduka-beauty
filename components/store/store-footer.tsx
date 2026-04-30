// components/store/store-footer.tsx
// Server component — fetches StoreSettings; renders social links, copyright

import Link from "next/link";
import { Globe, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { SocialLinks } from "@/types";

// Simple TikTok icon (not in lucide)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.26 8.26 0 004.83 1.55V6.79a4.85 4.85 0 01-1.06-.1z" />
    </svg>
  );
}

export default async function StoreFooter() {
  const settings = await prisma.storeSettings.findFirst({
    select: {
      storeName: true,
      storeTagline: true,
      socialLinks: true,
      returnPolicy: true,
    },
  });

  const storeName = settings?.storeName ?? "MiDuka";
  const tagline = settings?.storeTagline ?? "Your neighbourhood store, online.";
  const socialLinks = (settings?.socialLinks ?? null) as SocialLinks | null;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-2">
            <span className="text-xl font-extrabold text-primary">{storeName}</span>
            {tagline && (
              <p className="text-sm text-muted-foreground max-w-xs">{tagline}</p>
            )}

            {/* Social links */}
            {socialLinks && (
              <div className="flex items-center gap-3 mt-2">
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
                {socialLinks.tiktok && (
                  <a
                    href={socialLinks.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <TikTokIcon className="h-5 w-5" />
                  </a>
                )}
                {socialLinks.whatsapp && (
                  <a
                    href={`https://wa.me/${socialLinks.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-semibold text-foreground mb-1">Shop</span>
            <Link href="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
              All Categories
            </Link>
            <Link href="/search" className="text-muted-foreground hover:text-foreground transition-colors">
              Search
            </Link>
            {settings?.returnPolicy && (
              <Link href="/return-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                Return Policy
              </Link>
            )}
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center text-xs text-muted-foreground">
          © {year} {storeName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
