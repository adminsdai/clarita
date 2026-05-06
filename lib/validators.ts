import { z } from "zod";
import { isValidRut } from "./rut";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nombre demasiado corto")
    .max(120, "Nombre demasiado largo"),
  rut: z
    .string()
    .trim()
    .refine(isValidRut, { message: "RUT inválido (revisa el dígito verificador)" }),
  email: z.string().trim().toLowerCase().email("Correo inválido").max(180),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(128, "Máximo 128 caracteres")
    .refine((p) => /[A-Za-z]/.test(p) && /[0-9]/.test(p), {
      message: "Debe contener letras y números",
    }),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const verifySchema = z.object({
  token: z.string().trim().length(64, "Token inválido"),
});

export const solicitudSchema = z.object({
  glosa: z
    .string()
    .trim()
    .min(20, "Describe tu caso con al menos 20 caracteres")
    .max(8000, "Máximo 8.000 caracteres"),
});
export type SolicitudInput = z.infer<typeof solicitudSchema>;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
export const MAX_FILES = 5;

export function sanitizeFilename(filename: string): string {
  const dot = filename.lastIndexOf(".");
  const base = (dot > 0 ? filename.slice(0, dot) : filename).replace(/[^a-zA-Z0-9_-]/g, "_");
  const ext = dot > 0 ? filename.slice(dot).replace(/[^a-zA-Z0-9.]/g, "") : "";
  const truncated = base.slice(0, 80) || "archivo";
  return `${truncated}${ext}`;
}
