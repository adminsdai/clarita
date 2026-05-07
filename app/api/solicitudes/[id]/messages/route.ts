import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAgentTurn, MAX_MENSAJES, type ConversationMessage } from "@/lib/agent";
import { headers } from "next/headers";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 300;

const messageSchema = z.object({
  contenido: z.string().min(1, "El mensaje no puede estar vacío").max(8000),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const h = await headers();
  const userId = h.get("x-user-id");
  if (!userId)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await ctx.params;

  const solicitud = await prisma.solicitud.findUnique({
    where: { id },
    include: {
      adjuntos: {
        select: { filename: true, mimeType: true, size: true },
      },
      mensajes: {
        orderBy: { createdAt: "asc" },
        select: { rol: true, contenido: true },
      },
    },
  });

  if (!solicitud)
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (solicitud.userId !== userId)
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  if (solicitud.estado === "CERRADA")
    return NextResponse.json(
      { error: "Esta solicitud ya fue cerrada" },
      { status: 409 },
    );
  if (solicitud.estado === "EN_PROCESO")
    return NextResponse.json(
      { error: "El asistente está procesando. Espera un momento." },
      { status: 409 },
    );
  if (solicitud.mensajes.length >= MAX_MENSAJES)
    return NextResponse.json(
      { error: "Se alcanzó el límite de mensajes para esta solicitud" },
      { status: 409 },
    );

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  await prisma.mensaje.create({
    data: {
      solicitudId: id,
      rol: "user",
      contenido: parsed.data.contenido,
    },
  });

  await prisma.solicitud.update({
    where: { id },
    data: { estado: "EN_PROCESO" },
  });

  try {
    const history: ConversationMessage[] = [
      ...solicitud.mensajes.map((m) => ({
        role: m.rol as "user" | "assistant",
        content: m.contenido,
      })),
      { role: "user" as const, content: parsed.data.contenido },
    ];

    const result = await runAgentTurn(history, solicitud.adjuntos);

    await prisma.mensaje.create({
      data: { solicitudId: id, rol: "assistant", contenido: result.text },
    });

    if (result.closed && result.solicitudFormal) {
      await prisma.$transaction([
        prisma.reporte.create({
          data: { solicitudId: id, textoReporte: result.solicitudFormal },
        }),
        prisma.solicitud.update({
          where: { id },
          data: { estado: "CERRADA" },
        }),
      ]);
    } else {
      await prisma.solicitud.update({
        where: { id },
        data: { estado: "ACTIVA" },
      });
    }

    return NextResponse.json({ ok: true, closed: result.closed });
  } catch (err) {
    console.error("[messages] agent failed:", err);
    await prisma.solicitud.update({
      where: { id },
      data: { estado: "ACTIVA" },
    });
    return NextResponse.json(
      { error: "El análisis falló. Intenta nuevamente." },
      { status: 500 },
    );
  }
}
