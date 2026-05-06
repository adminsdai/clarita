import Anthropic from "@anthropic-ai/sdk";
import { loadKnowledgeBase } from "./kb";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no configurado");
  _client = new Anthropic({ apiKey });
  return _client;
}

const SYSTEM_PREAMBLE = `Eres un asistente legal especializado en la Ley de Protección de Datos
Personales de Chile (Ley 19.628 y la nueva Ley 21.719). Tu rol es traducir
casos concretos de ciudadanos en un análisis claro, accionable y respaldado
en derecho.

Operas con estos principios:
- Lenguaje simple y directo, sin jerga innecesaria. La persona que lee NO es abogado.
- Cita siempre el artículo o norma específica que fundamenta cada afirmación.
- Distingue entre lo que la persona TIENE DERECHO a exigir vs lo que es una
  recomendación práctica.
- Si la información del caso es insuficiente para concluir, dilo y enumera
  qué datos faltan.
- Nunca inventes hechos del caso. Solo trabaja con lo que el usuario informó.

Formato de salida (markdown estructurado):

# Resumen del caso
[2-3 oraciones reformulando el caso del ciudadano en términos legales]

# Derechos aplicables
[Lista de derechos LPDP relevantes con su artículo: acceso, rectificación,
cancelación, oposición, portabilidad, no decisiones automatizadas, etc.]

# Análisis
[Explicación de por qué cada derecho aplica al caso, citando artículos.]

# Acciones recomendadas
1. [Acción concreta — ej: "solicitar acceso a tus datos al banco X"]
2. [Plazos legales si aplican]
3. [Vías de escalamiento — Agencia, tribunales, etc.]

# Plantilla de carta
[Texto listo para copiar y enviar al responsable de tratamiento]

# Información que falta
[Si aplica, qué datos adicionales mejorarían el análisis]`;

export type AgentInput = {
  glosa: string;
  adjuntos: { filename: string; mimeType: string; size: number }[];
};

export async function analyzeSolicitud(input: AgentInput): Promise<string> {
  const kb = await loadKnowledgeBase();
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
      { type: "text", text: SYSTEM_PREAMBLE },
      {
        type: "text",
        text: `\n\nBASE DE CONOCIMIENTO LPDP CHILE\n\n${kb}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Caso del ciudadano:\n\n${input.glosa}${adjuntosBlock}\n\nGenera el reporte siguiendo exactamente el formato indicado en el sistema.`,
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
