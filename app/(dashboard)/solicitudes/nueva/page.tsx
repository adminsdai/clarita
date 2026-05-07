import { SolicitudForm } from "@/components/forms/SolicitudForm";

export const metadata = { title: "Nueva solicitud — Clarita" };

export default function NuevaSolicitudPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Nueva solicitud</h1>
      <p className="text-sm text-ink-muted mb-8">
        Cuéntanos tu caso y adjunta documentos si los tienes. Clarita lo
        analizará contra la Ley 19.628 de protección de datos y te ayudará a
        ejercer tus derechos.
      </p>
      <SolicitudForm />
    </div>
  );
}
