"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MAX_FILES } from "@/lib/validators";

export function SolicitudForm() {
  const router = useRouter();
  const [glosa, setGlosa] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onFilesPicked(picked: FileList | null) {
    if (!picked) return;
    setError(null);
    const incoming = Array.from(picked);
    if (files.length + incoming.length > MAX_FILES) {
      setError(`Máximo ${MAX_FILES} archivos`);
      return;
    }
    for (const f of incoming) {
      if (!ALLOWED_MIME_TYPES.includes(f.type as (typeof ALLOWED_MIME_TYPES)[number])) {
        setError(`Tipo no permitido: ${f.name}`);
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        setError(`${f.name} supera 10MB`);
        return;
      }
    }
    setFiles((prev) => [...prev, ...incoming]);
  }

  function removeAt(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("glosa", glosa);
      for (const f of files) fd.append("files", f);

      const res = await fetch("/api/solicitudes", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al procesar la solicitud");
        return;
      }
      router.push(`/solicitudes/${data.id}`);
      router.refresh();
    } catch {
      setError("Error de red. Reintenta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <Alert variant="error">{error}</Alert>}

      <div>
        <label className="label" htmlFor="glosa">
          Describe tu caso
        </label>
        <textarea
          id="glosa"
          required
          minLength={20}
          maxLength={8000}
          rows={10}
          className="input resize-y"
          placeholder="Ejemplo: Postulé a un crédito hipotecario en el banco X y me lo negaron sin explicación detallada. Solicité acceso a los datos que usaron para la decisión y no obtuve respuesta en 14 días…"
          value={glosa}
          onChange={(e) => setGlosa(e.target.value)}
        />
        <p className="text-xs text-ink-dim mt-1.5">
          {glosa.length}/8000 — Mientras más contexto entregues, mejor el análisis.
        </p>
      </div>

      <div>
        <label className="label">Adjuntos (opcional)</label>
        <div className="card p-4">
          <input
            id="files"
            type="file"
            multiple
            accept={ALLOWED_MIME_TYPES.join(",")}
            onChange={(e) => {
              onFilesPicked(e.target.files);
              e.target.value = "";
            }}
            className="hidden"
          />
          <label
            htmlFor="files"
            className="btn-outline cursor-pointer w-full justify-center mb-3"
          >
            Seleccionar archivos
          </label>
          <p className="text-xs text-ink-dim mb-3">
            PDF, imágenes, TXT, DOCX. Máx {MAX_FILES} archivos, 10MB c/u, 25MB total.
          </p>
          {files.length > 0 && (
            <ul className="space-y-2 mt-3">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between bg-bg-subtle rounded-lg px-3 py-2 text-sm"
                >
                  <span className="truncate text-ink-muted">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="text-ink-dim hover:text-danger ml-3 text-xs"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? (
          <>
            <Spinner /> Analizando con Claude…
          </>
        ) : (
          "Enviar solicitud"
        )}
      </button>
      {loading && (
        <p className="text-xs text-ink-dim text-center">
          El análisis puede tomar 30-90 segundos. No cierres esta pestaña.
        </p>
      )}
    </form>
  );
}
