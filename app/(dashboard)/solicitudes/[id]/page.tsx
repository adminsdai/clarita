import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { EstadoBadge } from "@/components/dashboard/EstadoBadge";
import { ReporteView } from "@/components/dashboard/ReporteView";

export const metadata = { title: "Detalle de solicitud — CDT" };
export const dynamic = "force-dynamic";

export default async function SolicitudDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const h = await headers();
  const userId = h.get("x-user-id");
  if (!userId) redirect("/login");

  const solicitud = await prisma.solicitud.findUnique({
    where: { id },
    include: {
      adjuntos: {
        select: { id: true, filename: true, mimeType: true, size: true },
        orderBy: { createdAt: "asc" },
      },
      reporte: { select: { id: true, textoReporte: true, createdAt: true } },
    },
  });

  if (!solicitud) notFound();
  if (solicitud.userId !== userId) redirect("/dashboard");

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/dashboard" className="text-sm text-ink-muted hover:text-ink mb-6 inline-block">
        ← Volver al dashboard
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Solicitud</h1>
          <p className="text-sm text-ink-muted">
            {new Intl.DateTimeFormat("es-CL", {
              dateStyle: "long",
              timeStyle: "short",
            }).format(solicitud.fechaSolicitud)}
          </p>
        </div>
        <EstadoBadge estado={solicitud.estado} />
      </div>

      <section className="card p-6 mb-6">
        <h2 className="text-sm font-medium text-ink-muted uppercase tracking-wide mb-3">
          Caso descrito
        </h2>
        <p className="whitespace-pre-wrap text-ink leading-relaxed">{solicitud.glosa}</p>
        {solicitud.adjuntos.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
              Adjuntos
            </h3>
            <ul className="text-sm text-ink-muted space-y-1">
              {solicitud.adjuntos.map((a) => (
                <li key={a.id}>
                  · {a.filename} <span className="text-ink-dim">({formatSize(a.size)})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {solicitud.estado === "EN_PROCESO" && (
        <section className="card p-6 mb-6 text-center">
          <p className="text-ink-muted">El asistente está analizando tu caso…</p>
          <p className="text-xs text-ink-dim mt-2">Recarga la página en unos segundos.</p>
        </section>
      )}

      {solicitud.reporte && (
        <section className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
            <div>
              <h2 className="text-lg font-semibold">Reporte del asistente</h2>
              <p className="text-xs text-ink-dim">
                Generado el{" "}
                {new Intl.DateTimeFormat("es-CL", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(solicitud.reporte.createdAt)}
              </p>
            </div>
            <a
              href={`/api/solicitudes/${solicitud.id}/pdf`}
              className="btn-primary"
              download={`reporte-${solicitud.id.slice(0, 8)}.pdf`}
            >
              Descargar PDF
            </a>
          </div>
          <ReporteView markdown={solicitud.reporte.textoReporte} />
        </section>
      )}

      {solicitud.estado === "ACTIVA" && !solicitud.reporte && (
        <section className="card p-6 mb-6">
          <p className="text-ink-muted text-sm">
            Esta solicitud quedó en estado activo sin reporte. Si el procesamiento
            falló, vuelve a intentarlo desde una nueva solicitud.
          </p>
        </section>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
