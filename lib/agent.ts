import Anthropic from "@anthropic-ai/sdk";
import { loadKnowledgeBase, loadSystemPrompt } from "./kb";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8000;
const THINKING_BUDGET = 10000;
const CLOSING_SIGNAL = "[CASO_CERRADO]";

export const MAX_MENSAJES = 20;

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no configurado");
  _client = new Anthropic({ apiKey });
  return _client;
}

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AgentResult = {
  text: string;
  closed: boolean;
  solicitudFormal: string | null;
};

export async function runAgentTurn(
  messages: ConversationMessage[],
  adjuntos: { filename: string; mimeType: string; size: number }[],
): Promise<AgentResult> {
  const [systemPrompt, kb] = await Promise.all([
    loadSystemPrompt(),
    loadKnowledgeBase(),
  ]);
  const client = getClient();

  const adjuntosNote =
    adjuntos.length > 0
      ? `\n\nDocumentos adjuntados por el ciudadano:\n${adjuntos
          .map(
            (a, i) =>
              `  ${i + 1}. ${a.filename} (${a.mimeType}, ${formatBytes(a.size)})`,
          )
          .join("\n")}\n\nNota: solo recibes los nombres y tipos de los archivos, no su contenido. Si el análisis depende del contenido, indícalo en "Información que falta".`
      : "";

  const stream = await client.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    thinking: { type: "enabled", budget_tokens: THINKING_BUDGET },
    system: [
      { type: "text", text: systemPrompt + adjuntosNote },
      {
        type: "text",
        text: `\n\nBASE DE CONOCIMIENTO NORMATIVA CHILE\n\n${kb}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const finalMessage = await stream.finalMessage();

  const text = finalMessage.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n\n")
    .trim();

  if (!text) throw new Error("El agente no devolvió contenido textual");

  const closed = text.includes(CLOSING_SIGNAL);
  const solicitudFormal = extractSolicitudFormal(text);
  const cleanText = text.replace(CLOSING_SIGNAL, "").trim();

  return { text: cleanText, closed, solicitudFormal };
}

function extractSolicitudFormal(text: string): string | null {
  const match = text.match(/<solicitud_formal>([\s\S]*?)<\/solicitud_formal>/);
  return match ? match[1].trim() : null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
