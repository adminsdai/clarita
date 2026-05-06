import Link from "next/link";
import { VerifyClient } from "./VerifyClient";

export const metadata = { title: "Verificación — CDT" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-semibold mb-2">Verificación de correo</h1>
      {token ? (
        <VerifyClient token={token} />
      ) : (
        <>
          <p className="text-sm text-ink-muted mb-6">
            El enlace de verificación no contiene un token. Revisa el correo que recibiste.
          </p>
          <Link href="/login" className="btn-outline">
            Ir a iniciar sesión
          </Link>
        </>
      )}
    </div>
  );
}
