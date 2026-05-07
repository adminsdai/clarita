import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { hashPassword } from "@/lib/auth";
import { normalizeRut } from "@/lib/rut";

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

  await prisma.user.create({
    data: {
      name,
      rut,
      email,
      password: hashed,
      emailVerified: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Cuenta creada. Ya puedes iniciar sesión.",
  });
}
