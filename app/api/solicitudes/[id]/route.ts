import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const h = await headers();
  const userId = h.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const solicitud = await prisma.solicitud.findUnique({
    where: { id },
    include: {
      adjuntos: {
        select: { id: true, filename: true, mimeType: true, size: true, createdAt: true },
      },
      reporte: { select: { id: true, textoReporte: true, createdAt: true } },
    },
  });

  if (!solicitud) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (solicitud.userId !== userId) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }
  return NextResponse.json({ solicitud });
}
