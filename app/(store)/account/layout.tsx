// file: app/(store)/account/layout.tsx
// purpose: Provide SEO metadata for the account route to prevent indexing

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account | MiDuka",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
