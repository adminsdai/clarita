import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { EstadoBadge } from "@/components/dashboard/EstadoBadge";

export const metadata = { title: "Mis solicitudes — CDT" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const h = await headers();
  const userId = h.get("x-user-id");
  if (!userId) return null;

  const solicitudes = await prisma.solicitud.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      glosa: true,
      estado: true,
      fechaSolicitud: true,
      _count: { select: { adjuntos: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Mis solicitudes</h1>
          <p className="text-sm text-ink-muted">
            Casos LPDP que has consultado al asistente.
          </p>
        </div>
        <Link href="/solicitudes/nueva" className="btn-primary">
          + Nueva solicitud
        </Link>
      </div>

      {solicitudes.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-ink-muted mb-4">Aún no tienes solicitudes registradas.</p>
          <Link href="/solicitudes/nueva" className="btn-primary">
            Crear mi primera solicitud
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {solicitudes.map((s) => (
            <Link
              key={s.id}
              href={`/solicitudes/${s.id}`}
              className="card p-5 block hover:border-border-strong transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-ink line-clamp-2 mb-2">{s.glosa}</p>
                  <div className="flex items-center gap-3 text-xs text-ink-muted">
                    <span>{formatDate(s.fechaSolicitud)}</span>
                    {s._count.adjuntos > 0 && (
                      <span>· {s._count.adjuntos} adjunto{s._count.adjuntos === 1 ? "" : "s"}</span>
                    )}
                  </div>
                </div>
                <EstadoBadge estado={s.estado} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
