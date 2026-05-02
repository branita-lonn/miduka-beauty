// file: app/(store)/checkout/layout.tsx
// purpose: Provide SEO metadata for the checkout route to prevent indexing

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | MiDuka",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
