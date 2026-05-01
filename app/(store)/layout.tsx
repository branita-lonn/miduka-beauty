// app/(store)/layout.tsx
// Public store layout — wraps all buyer-facing pages with CartProvider, header, footer, and mobile nav

import StoreHeaderServer from "@/components/store/store-header-server";
import StoreFooter from "@/components/store/store-footer";
import MobileBottomNav from "@/components/store/mobile-bottom-nav";
import CartProvider from "@/components/store/cart-provider";
import CartDrawer from "@/components/store/cart-drawer";
import WishlistProvider from "@/components/store/wishlist-provider";
import PwaInstallPrompt from "@/components/store/pwa-install-prompt";
import { ChatWidget } from "@/components/store/chat-widget";
import { prisma } from "@/lib/prisma";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await prisma.storeSettings.findFirst({
    select: { storeName: true }
  });
  return (
    <CartProvider>
      <WishlistProvider>
        <div className="min-h-screen flex flex-col bg-background">
        <StoreHeaderServer />
        <CartDrawer />
        {/* pb-16 on mobile reserves space for the fixed bottom nav */}
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <StoreFooter />
        <MobileBottomNav />
        <PwaInstallPrompt />
        <ChatWidget storeName={settings?.storeName ?? "MiDuka"} />
      </div>
      </WishlistProvider>
    </CartProvider>
  );
}
