import { SolicitudForm } from "@/components/forms/SolicitudForm";

export const metadata = { title: "Nueva solicitud — CDT" };

export default function NuevaSolicitudPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Nueva solicitud</h1>
      <p className="text-sm text-ink-muted mb-8">
        Cuéntanos el caso y adjunta documentos. El asistente lo analizará contra
        la Ley 19.628 y la nueva Ley 21.719 de protección de datos.
      </p>
      <SolicitudForm />
    </div>
  );
}
