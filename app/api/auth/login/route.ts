import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";
import { comparePassword, signSession, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Mensaje genérico para no filtrar existencia del usuario
  const invalidCreds = NextResponse.json(
    { error: "Correo o contraseña incorrectos" },
    { status: 401 },
  );

  if (!user) {
    // Hash dummy para igualar timing
    await comparePassword(password, "$2a$12$abcdefghijklmnopqrstuv");
    return invalidCreds;
  }

  const ok = await comparePassword(password, user.password);
  if (!ok) return invalidCreds;

  if (!user.emailVerified) {
    return NextResponse.json(
      { error: "Verifica tu correo antes de iniciar sesión" },
      { status: 403 },
    );
  }

  const token = await signSession({ sub: user.id, email: user.email, name: user.name });
  await setSessionCookie(token);

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
