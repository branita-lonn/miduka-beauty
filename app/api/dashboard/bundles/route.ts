// app/api/dashboard/bundles/route.ts
// API route for managing product bundles in the dashboard

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const bundles = await prisma.bundle.findMany({
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      }
    });

    return NextResponse.json(bundles);
  } catch (error) {
    console.error("[BUNDLES_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STORE_OWNER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, discountPrice, productIds } = body;

    if (!name || !discountPrice || !productIds || !Array.isArray(productIds)) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (productIds.length < 2) {
      return new NextResponse("A bundle must have at least 2 products", { status: 400 });
    }

    const bundle = await prisma.bundle.create({
      data: {
        name,
        discountPrice,
        products: {
          connect: productIds.map((id: string) => ({ id })),
        }
      },
      include: {
        products: true
      }
    });

    return NextResponse.json(bundle);
  } catch (error) {
    console.error("[BUNDLES_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
