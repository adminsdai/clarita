"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Mensaje = {
  id: string;
  rol: string;
  contenido: string;
  createdAt: string;
};

export function ChatThread({ mensajes }: { mensajes: Mensaje[] }) {
  return (
    <div className="space-y-4">
      {mensajes.map((m) => (
        <div
          key={m.id}
          className={`flex ${m.rol === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-5 py-4 ${
              m.rol === "user"
                ? "bg-brand/10 border border-brand/20"
                : "bg-bg-subtle border border-border"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-ink-muted">
                {m.rol === "user" ? "Tú" : "Clarita"}
              </span>
              <span className="text-xs text-ink-dim">
                {new Intl.DateTimeFormat("es-CL", {
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(m.createdAt))}
              </span>
            </div>
            {m.rol === "assistant" ? (
              <div className="prose-invert max-w-none text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {cleanAssistantMessage(m.contenido)}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-ink whitespace-pre-wrap">{m.contenido}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function cleanAssistantMessage(text: string): string {
  return text
    .replace(/<solicitud_formal>[\s\S]*?<\/solicitud_formal>/g, "")
    .replace(/\[CASO_CERRADO\]/g, "")
    .trim();
}
