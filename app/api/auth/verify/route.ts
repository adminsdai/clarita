import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { verifyToken: parsed.data.token },
    select: { id: true, verifyTokenExpires: true, emailVerified: true },
  });

  if (!user) return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 });
  if (user.emailVerified) return NextResponse.json({ ok: true, alreadyVerified: true });
  if (!user.verifyTokenExpires || user.verifyTokenExpires < new Date()) {
    return NextResponse.json({ error: "Token expirado" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date(), verifyToken: null, verifyTokenExpires: null },
  });

  return NextResponse.json({ ok: true });
}
