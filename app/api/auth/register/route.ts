import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { hashPassword, generateVerifyToken } from "@/lib/auth";
import { normalizeRut } from "@/lib/rut";
import { sendVerifyEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
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
          // DEBUG TEMPORAL — borrar después
          _debug: serializeError(err),
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, message: "Revisa tu correo para verificar tu cuenta" });
  } catch (err) {
    console.error("[register] uncaught:", err);
    // DEBUG TEMPORAL — borrar después
    return NextResponse.json(
      {
        error: "Error interno",
        _debug: serializeError(err),
      },
      { status: 500 },
    );
  }
}

function serializeError(err: unknown) {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack?.split("\n").slice(0, 8).join("\n"),
      // Prisma agrega códigos como P1001, P2002, etc.
      code: (err as Error & { code?: string }).code,
      meta: (err as Error & { meta?: unknown }).meta,
    };
  }
  return { raw: String(err) };
}
