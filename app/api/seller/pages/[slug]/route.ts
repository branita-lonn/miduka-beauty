// app/api/seller/pages/[slug]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, content } = await request.json();

    if (!title || !content) {
      return new NextResponse("Missing title or content", { status: 400 });
    }

    const updatedPage = await prisma.staticPage.upsert({
      where: { slug: params.slug },
      update: { title, content },
      create: { slug: params.slug, title, content },
    });

    return NextResponse.json(updatedPage);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("[SELLER_PAGES_PUT]", error.message);
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
