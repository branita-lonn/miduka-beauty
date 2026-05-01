// app/api/account/addresses/route.ts
// API route for managing customer addresses

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { customerId: session.user.id },
      orderBy: { isDefault: "desc" },
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("[ADDRESSES_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { 
      fullName, 
      phone, 
      addressLine1, 
      addressLine2, 
      city, 
      county, 
      postalCode, 
      isDefault 
    } = body;

    if (!fullName || !phone || !addressLine1 || !city || !county) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const address = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        // Unset isDefault for all other addresses
        await tx.address.updateMany({
          where: { customerId: session.user.id },
          data: { isDefault: false },
        });
      }

      // Create new address
      return await tx.address.create({
        data: {
          customerId: session.user.id,
          fullName,
          phone,
          addressLine1,
          addressLine2,
          city,
          county,
          postalCode,
          isDefault: !!isDefault,
        },
      });
    });

    return NextResponse.json(address);
  } catch (error) {
    console.error("[ADDRESSES_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
