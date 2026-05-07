"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";

export function FollowUpInput({ solicitudId }: { solicitudId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/solicitudes/${solicitudId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al enviar el mensaje");
        return;
      }
      setMessage("");
      router.refresh();
    } catch {
      setError("Error de red. Reintenta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-3">
      <input
        type="text"
        className="input flex-1"
        placeholder="Escribe tu respuesta..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={loading}
        maxLength={8000}
      />
      <button
        type="submit"
        className="btn-primary whitespace-nowrap"
        disabled={loading || !message.trim()}
      >
        {loading ? <Spinner /> : "Enviar"}
      </button>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </form>
  );
}
