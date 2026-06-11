import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ valid: false, error: "Not signed in" }, { status: 401 });
  }

  let password: string;
  try {
    const body = (await req.json()) as { password?: string };
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ valid: false, error: "Bad request" }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ valid: false });
  }

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { password: true, status: true },
  });

  if (!user?.password || user.status !== "active") {
    return NextResponse.json({ valid: false });
  }

  const valid = await bcrypt.compare(password, user.password);
  return NextResponse.json({ valid });
}
