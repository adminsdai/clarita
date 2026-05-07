import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { EstadoBadge } from "@/components/dashboard/EstadoBadge";
import { ChatThread } from "@/components/chat/ChatThread";
import { FollowUpInput } from "@/components/chat/FollowUpInput";

export const metadata = { title: "Detalle de solicitud — Clarita" };
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
      mensajes: {
        orderBy: { createdAt: "asc" },
        select: { id: true, rol: true, contenido: true, createdAt: true },
      },
      reporte: { select: { id: true, textoReporte: true, createdAt: true } },
    },
  });

  if (!solicitud) notFound();
  if (solicitud.userId !== userId) redirect("/dashboard");

  const hasMensajes = solicitud.mensajes.length > 0;
  const canReply = solicitud.estado === "ACTIVA" && solicitud.mensajes.length < 20;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/dashboard" className="text-sm text-ink-muted hover:text-ink mb-6 inline-block">
        &larr; Volver al dashboard
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
        <div className="flex items-center gap-3">
          <EstadoBadge estado={solicitud.estado} />
          {solicitud.reporte && (
            <a
              href={`/api/solicitudes/${solicitud.id}/pdf`}
              className="btn-primary text-sm"
              download={`solicitud-${solicitud.id.slice(0, 8)}.pdf`}
            >
              Descargar PDF
            </a>
          )}
        </div>
      </div>

      {solicitud.adjuntos.length > 0 && (
        <section className="card p-4 mb-4">
          <h3 className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-2">
            Adjuntos
          </h3>
          <ul className="text-sm text-ink-muted space-y-1">
            {solicitud.adjuntos.map((a) => (
              <li key={a.id}>
                &middot; {a.filename}{" "}
                <span className="text-ink-dim">({formatSize(a.size)})</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasMensajes && (
        <section className="card p-6 mb-4">
          <h2 className="text-sm font-medium text-ink-muted uppercase tracking-wide mb-4">
            Conversación
          </h2>
          <ChatThread
            mensajes={solicitud.mensajes.map((m) => ({
              ...m,
              createdAt: m.createdAt.toISOString(),
            }))}
          />
        </section>
      )}

      {solicitud.estado === "EN_PROCESO" && (
        <section className="card p-6 mb-4 text-center">
          <p className="text-ink-muted">Clarita está analizando tu caso...</p>
          <p className="text-xs text-ink-dim mt-2">Recarga la página en unos segundos.</p>
        </section>
      )}

      {canReply && (
        <section className="card p-4 mb-4">
          <FollowUpInput solicitudId={solicitud.id} />
        </section>
      )}

      {solicitud.estado === "CERRADA" && solicitud.reporte && (
        <section className="card p-5 mb-4 border-brand/30 bg-brand/5">
          <p className="text-sm text-ink">
            Caso cerrado. La solicitud formal está lista para descargar como PDF.
          </p>
        </section>
      )}

      {solicitud.estado === "ACTIVA" && !hasMensajes && (
        <section className="card p-6 mb-4">
          <p className="text-ink-muted text-sm">
            Esta solicitud quedó en estado activo sin respuesta del asistente.
            Si el procesamiento falló, vuelve a intentarlo desde una nueva solicitud.
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
