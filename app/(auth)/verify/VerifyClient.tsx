"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";

type State = { kind: "loading" } | { kind: "ok" } | { kind: "error"; message: string };

export function VerifyClient({ token }: { token: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setState({ kind: "error", message: data.error ?? "Verificación fallida" });
          return;
        }
        setState({ kind: "ok" });
      } catch {
        if (!cancelled) setState({ kind: "error", message: "Error de red. Reintenta." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.kind === "loading") {
    return (
      <div className="flex items-center gap-3 text-ink-muted">
        <Spinner size={20} />
        Verificando tu cuenta…
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="space-y-4">
        <Alert variant="error">{state.message}</Alert>
        <Link href="/register" className="btn-outline">
          Volver a registrar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert variant="success">
        <strong>¡Cuenta verificada!</strong> Ya puedes iniciar sesión.
      </Alert>
      <Link href="/login" className="btn-primary">
        Ir a iniciar sesión
      </Link>
    </div>
  );
}
