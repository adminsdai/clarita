import Anthropic from "@anthropic-ai/sdk";
import { loadKnowledgeBase, loadSystemPrompt } from "./kb";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no configurado");
  _client = new Anthropic({ apiKey });
  return _client;
}

export type AgentInput = {
  glosa: string;
  adjuntos: { filename: string; mimeType: string; size: number }[];
};

export async function analyzeSolicitud(input: AgentInput): Promise<string> {
  const [systemPrompt, kb] = await Promise.all([
    loadSystemPrompt(),
    loadKnowledgeBase(),
  ]);
  const client = getClient();

  const adjuntosBlock =
    input.adjuntos.length > 0
      ? `\n\nDocumentos adjuntados por el ciudadano:\n${input.adjuntos
          .map((a, i) => `  ${i + 1}. ${a.filename} (${a.mimeType}, ${formatBytes(a.size)})`)
          .join("\n")}\n\nNota: solo recibes los nombres y tipos de los archivos, no su contenido. Si el análisis depende del contenido, indícalo en "Información que falta".`
      : "";

  const stream = await client.messages.stream({
    model: "claude-opus-4-7",
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    system: [
      { type: "text", text: systemPrompt },
      {
        type: "text",
        text: `\n\nBASE DE CONOCIMIENTO NORMATIVA CHILE\n\n${kb}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Caso del ciudadano:\n\n${input.glosa}${adjuntosBlock}\n\nAnaliza el caso, diagnostica los derechos aplicables, y genera la solicitud formal completa siguiendo el flujo definido en el system prompt.`,
      },
    ],
  });

  const finalMessage = await stream.finalMessage();

  const text = finalMessage.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n\n")
    .trim();

  if (!text) throw new Error("El agente no devolvió contenido textual");
  return text;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
