// app/api/account/addresses/[id]/route.ts
// API route for individual address operations

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const { id } = params;

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

    // Verify ownership
    const existingAddress = await prisma.address.findUnique({
      where: { id, customerId: session.user.id },
    });

    if (!existingAddress) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const address = await prisma.$transaction(async (tx) => {
      if (isDefault && !existingAddress.isDefault) {
        // Set this as default, unset others
        await tx.address.updateMany({
          where: { customerId: session.user.id },
          data: { isDefault: false },
        });
      }

      return await tx.address.update({
        where: { id },
        data: {
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
    console.error("[ADDRESS_PUT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const { id } = params;

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify ownership
    const existingAddress = await prisma.address.findUnique({
      where: { id, customerId: session.user.id },
    });

    if (!existingAddress) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.address.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[ADDRESS_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const { id } = params;

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { isDefault } = body;

    if (isDefault !== true) {
      return new NextResponse("Only setting default is supported via PATCH", { status: 400 });
    }

    // Verify ownership
    const existingAddress = await prisma.address.findUnique({
      where: { id, customerId: session.user.id },
    });

    if (!existingAddress) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const address = await prisma.$transaction(async (tx) => {
      // Unset isDefault for all other addresses
      await tx.address.updateMany({
        where: { customerId: session.user.id },
        data: { isDefault: false },
      });

      // Set this one as default
      return await tx.address.update({
        where: { id },
        data: { isDefault: true },
      });
    });

    return NextResponse.json(address);
  } catch (error) {
    console.error("[ADDRESS_PATCH]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
