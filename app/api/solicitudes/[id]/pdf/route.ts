import { prisma } from "@/lib/prisma";
import { ReporteDocument } from "@/lib/pdf/ReporteDocument";
import { renderToBuffer } from "@react-pdf/renderer";
import { headers } from "next/headers";
import React from "react";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const h = await headers();
  const userId = h.get("x-user-id");
  if (!userId) return new Response("No autenticado", { status: 401 });

  const { id } = await ctx.params;
  const solicitud = await prisma.solicitud.findUnique({
    where: { id },
    include: {
      reporte: { select: { textoReporte: true, createdAt: true } },
      user: { select: { name: true } },
    },
  });

  if (!solicitud) return new Response("No encontrada", { status: 404 });
  if (solicitud.userId !== userId) return new Response("Sin permiso", { status: 403 });
  if (!solicitud.reporte) {
    return new Response("Reporte aún no disponible", { status: 409 });
  }

  // El typing de @react-pdf/renderer es estricto con ReactElement<DocumentProps>.
  // ReporteDocument retorna <Document>, así que el cast es runtime-safe.
  const render = renderToBuffer as (e: React.ReactElement) => Promise<Buffer>;
  const buffer = await render(
    React.createElement(ReporteDocument, {
      glosa: solicitud.glosa,
      reporteMarkdown: solicitud.reporte.textoReporte,
      fecha: solicitud.reporte.createdAt,
      userName: solicitud.user.name,
    }),
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="reporte-${solicitud.id.slice(0, 8)}.pdf"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
