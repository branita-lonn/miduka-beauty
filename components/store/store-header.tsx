// components/store/store-header.tsx
// Client Component — renders header with cart badge/drawer toggle using CartContext.
// Store name/logo are passed as props from StoreHeaderServer (RSC).

"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import StoreSearchBar from "@/components/store/store-search-bar";
import { useCart } from "@/components/store/cart-provider";

interface StoreHeaderProps {
  storeName: string;
  logoUrl: string | null;
}

export default function StoreHeader({ storeName, logoUrl }: StoreHeaderProps) {
  const { itemCount, setIsOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full bg-card border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center gap-3 relative">
        {/* Logo / Store Name */}
        <Link
          href="/"
          id="store-logo-link"
          className="flex items-center gap-2 flex-shrink-0 mr-2"
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={storeName}
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
          ) : (
            <span className="text-xl font-extrabold tracking-tight text-primary">
              {storeName}
            </span>
          )}
        </Link>

        {/* Search bar (desktop center + mobile icon) */}
        <StoreSearchBar />

        {/* Right actions */}
        <div className="flex items-center gap-1 ml-auto flex-shrink-0">
          <Link href="/account/wishlist" aria-label="Wishlist">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>

          {/* Cart icon — opens drawer */}
          <Button
            id="header-cart-button"
            variant="ghost"
            size="icon"
            className="rounded-full relative"
            aria-label="Open cart"
            onClick={() => setIsOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
