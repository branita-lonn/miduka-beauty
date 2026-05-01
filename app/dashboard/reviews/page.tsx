// app/dashboard/reviews/page.tsx
// Dashboard page for managing product reviews

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ReviewsClient } from "@/components/dashboard/reviews-client";

export const metadata: Metadata = {
  title: "Reviews | Dashboard | MiDuka",
  description: "Manage and respond to customer reviews",
};

export default async function DashboardReviewsPage() {
  const session = await auth();

  if (!session || session.user.role !== "STORE_OWNER") {
    redirect("/auth/login");
  }

  const reviews = await prisma.review.findMany({
    include: {
      product: {
        select: {
          name: true,
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
      },
      customer: {
        select: {
          name: true,
          email: true,
        },
      },
      reply: {
        select: {
          id: true,
          body: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <ReviewsClient initialReviews={reviews} />
    </div>
  );
}
