import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { hashPassword, generateVerifyToken } from "@/lib/auth";
import { normalizeRut } from "@/lib/rut";
import { sendVerifyEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;
  const rut = normalizeRut(parsed.data.rut);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { rut }] },
    select: { email: true, rut: true },
  });
  if (existing) {
    const field = existing.email === email ? "correo" : "RUT";
    return NextResponse.json({ error: `Ya existe una cuenta con ese ${field}` }, { status: 409 });
  }

  const hashed = await hashPassword(password);
  const verifyToken = generateVerifyToken();
  const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: { name, rut, email, password: hashed, verifyToken, verifyTokenExpires },
    select: { id: true, email: true, name: true },
  });

  try {
    await sendVerifyEmail(user.email, user.name, verifyToken);
  } catch (err) {
    console.error("[register] sendVerifyEmail failed:", err);
    return NextResponse.json(
      {
        error: "Cuenta creada, pero falló el envío del correo. Contacta soporte o intenta reenviar.",
        userId: user.id,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, message: "Revisa tu correo para verificar tu cuenta" });
}
