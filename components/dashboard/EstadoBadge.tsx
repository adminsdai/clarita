import type { SolicitudEstado } from "@prisma/client";

const labels: Record<SolicitudEstado, string> = {
  ACTIVA: "Activa",
  EN_PROCESO: "En proceso",
  CERRADA: "Cerrada",
};

export function EstadoBadge({ estado }: { estado: SolicitudEstado }) {
  if (estado === "ACTIVA") return <span className="badge-active">{labels[estado]}</span>;
  if (estado === "EN_PROCESO") return <span className="badge-process">{labels[estado]}</span>;
  return <span className="badge-closed">{labels[estado]}</span>;
}
