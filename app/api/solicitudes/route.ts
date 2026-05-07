import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  solicitudSchema,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
  MAX_FILES,
  sanitizeFilename,
} from "@/lib/validators";
import { uploadFile } from "@/lib/storage";
import { runAgentTurn, type ConversationMessage } from "@/lib/agent";
import { randomUUID } from "crypto";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    return await handlePost(req);
  } catch (err) {
    console.error("[solicitudes] uncaught:", err);
    return NextResponse.json(
      { error: "Error interno", _debug: serializeError(err) },
      { status: 500 },
    );
  }
}

async function handlePost(req: Request) {
  const h = await headers();
  const userId = h.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formato inválido (esperado multipart/form-data)" }, { status: 400 });
  }

  const glosaRaw = formData.get("glosa");
  const parsed = solicitudSchema.safeParse({ glosa: typeof glosaRaw === "string" ? glosaRaw : "" });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const fileEntries = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (fileEntries.length > MAX_FILES) {
    return NextResponse.json({ error: `Máximo ${MAX_FILES} archivos` }, { status: 400 });
  }
  let totalSize = 0;
  for (const f of fileEntries) {
    if (!ALLOWED_MIME_TYPES.includes(f.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return NextResponse.json({ error: `Tipo no permitido: ${f.name} (${f.type})` }, { status: 400 });
    }
    if (f.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `${f.name} supera 10MB` }, { status: 400 });
    }
    totalSize += f.size;
  }
  if (totalSize > MAX_TOTAL_SIZE) {
    return NextResponse.json({ error: "Tamaño total excede 25MB" }, { status: 400 });
  }

  const solicitud = await prisma.solicitud.create({
    data: { userId, glosa: parsed.data.glosa, estado: "ACTIVA" },
    select: { id: true },
  });

  const adjuntos: { filename: string; mimeType: string; size: number }[] = [];
  for (const file of fileEntries) {
    const safe = sanitizeFilename(file.name);
    const storagePath = `solicitudes/${userId}/${solicitud.id}/${randomUUID()}-${safe}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await uploadFile(storagePath, bytes, file.type);
    await prisma.adjunto.create({
      data: {
        solicitudId: solicitud.id,
        filename: safe,
        mimeType: file.type,
        size: file.size,
        storagePath,
      },
    });
    adjuntos.push({ filename: safe, mimeType: file.type, size: file.size });
  }

  await prisma.mensaje.create({
    data: { solicitudId: solicitud.id, rol: "user", contenido: parsed.data.glosa },
  });

  await prisma.solicitud.update({
    where: { id: solicitud.id },
    data: { estado: "EN_PROCESO" },
  });

  try {
    const messages: ConversationMessage[] = [{ role: "user", content: parsed.data.glosa }];
    const result = await runAgentTurn(messages, adjuntos);

    await prisma.mensaje.create({
      data: { solicitudId: solicitud.id, rol: "assistant", contenido: result.text },
    });

    if (result.closed && result.solicitudFormal) {
      await prisma.$transaction([
        prisma.reporte.create({
          data: { solicitudId: solicitud.id, textoReporte: result.solicitudFormal },
        }),
        prisma.solicitud.update({
          where: { id: solicitud.id },
          data: { estado: "CERRADA" },
        }),
      ]);
    } else {
      await prisma.solicitud.update({
        where: { id: solicitud.id },
        data: { estado: "ACTIVA" },
      });
    }
  } catch (err) {
    console.error("[solicitudes] agent failed:", err);
    await prisma.solicitud.update({
      where: { id: solicitud.id },
      data: { estado: "ACTIVA" },
    });
    return NextResponse.json(
      {
        error: "El análisis falló. Intenta nuevamente más tarde.",
        solicitudId: solicitud.id,
        _debug: serializeError(err),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id: solicitud.id });
}

export async function GET() {
  const h = await headers();
  const userId = h.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const solicitudes = await prisma.solicitud.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      glosa: true,
      estado: true,
      fechaSolicitud: true,
      createdAt: true,
      _count: { select: { adjuntos: true } },
      reporte: { select: { id: true } },
    },
  });
  return NextResponse.json({ solicitudes });
}

function serializeError(err: unknown) {
  const envSnapshot = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseSrk: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasSupabaseBucket: !!process.env.SUPABASE_BUCKET,
    bucketValue: process.env.SUPABASE_BUCKET ?? null,
    cwd: process.cwd(),
  };
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      code: (err as Error & { code?: string }).code,
      stack: err.stack?.split("\n").slice(0, 8).join("\n"),
      env: envSnapshot,
    };
  }
  return { raw: String(err), env: envSnapshot };
}
