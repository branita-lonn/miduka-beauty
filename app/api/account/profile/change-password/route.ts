// app/api/account/profile/change-password/route.ts
// API route for secure password updates

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcryptjs from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return new NextResponse("Missing passwords", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.password) {
      return new NextResponse("User not found", { status: 404 });
    }

    const passwordsMatch = await bcryptjs.compare(currentPassword, user.password);

    if (!passwordsMatch) {
      return new NextResponse("Current password is incorrect", { status: 400 });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return new NextResponse("Password updated successfully", { status: 200 });
  } catch (error) {
    console.error("[CHANGE_PASSWORD_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
