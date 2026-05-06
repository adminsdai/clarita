import { Resend } from "resend";

let _resend: Resend | null = null;

function getClient(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY no configurado");
    _resend = new Resend(key);
  }
  return _resend;
}

function getFrom(): string {
  return process.env.RESEND_FROM ?? "CDT LPDP <onboarding@resend.dev>";
}

function getAppUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

export async function sendVerifyEmail(to: string, name: string, token: string): Promise<void> {
  const verifyUrl = `${getAppUrl()}/verify?token=${token}`;
  const html = `
<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:32px;background:#0B0D10;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#E6EAF2;">
  <div style="max-width:560px;margin:0 auto;background:#161A22;border:1px solid #1F2530;border-radius:18px;padding:32px;">
    <div style="font-size:14px;color:#7C5CFF;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:8px;">CDT — Asistente LPDP</div>
    <h1 style="font-size:24px;margin:0 0 16px 0;color:#E6EAF2;">Hola ${escapeHtml(name)},</h1>
    <p style="font-size:15px;line-height:1.6;color:#8B93A7;margin:0 0 24px 0;">
      Confirma tu correo para activar tu cuenta y empezar a usar el asistente.
    </p>
    <a href="${verifyUrl}" style="display:inline-block;background:#7C5CFF;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:500;">
      Verificar mi cuenta
    </a>
    <p style="font-size:13px;line-height:1.6;color:#5A6275;margin:24px 0 0 0;">
      O copia este enlace en tu navegador:<br/>
      <span style="color:#8B93A7;word-break:break-all;">${verifyUrl}</span>
    </p>
    <p style="font-size:13px;color:#5A6275;margin-top:24px;border-top:1px solid #1F2530;padding-top:16px;">
      Este enlace expira en 24 horas. Si no solicitaste esta cuenta, puedes ignorar el correo.
    </p>
  </div>
</body>
</html>
  `.trim();

  await getClient().emails.send({
    from: getFrom(),
    to,
    subject: "Verifica tu cuenta CDT",
    html,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
