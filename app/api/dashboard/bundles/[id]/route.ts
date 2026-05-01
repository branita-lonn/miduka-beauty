// app/api/dashboard/bundles/[id]/route.ts
// API route for deleting a product bundle

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    await prisma.bundle.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[BUNDLE_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
