// app/(store)/layout.tsx
// Public store layout — wraps all buyer-facing pages with CartProvider, header, footer, and mobile nav

import StoreHeaderServer from "@/components/store/store-header-server";
import StoreFooter from "@/components/store/store-footer";
import MobileBottomNav from "@/components/store/mobile-bottom-nav";
import CartProvider from "@/components/store/cart-provider";
import CartDrawer from "@/components/store/cart-drawer";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <StoreHeaderServer />
        <CartDrawer />
        {/* pb-16 on mobile reserves space for the fixed bottom nav */}
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <StoreFooter />
        <MobileBottomNav />
      </div>
    </CartProvider>
  );
}
