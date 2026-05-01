// app/(store)/account/page.tsx
// Redirect /account to the orders subpage

import { redirect } from "next/navigation";

export default function AccountPage() {
  redirect("/account/orders");
}
