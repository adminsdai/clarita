import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata = { title: "Iniciar sesión — CDT" };

export default function LoginPage() {
  return (
    <div className="card p-8">
      <h1 className="text-2xl font-semibold mb-2">Iniciar sesión</h1>
      <p className="text-sm text-ink-muted mb-6">Ingresa con tu correo y contraseña.</p>
      <Suspense fallback={<div className="text-ink-muted text-sm">Cargando…</div>}>
        <LoginForm />
      </Suspense>
      <p className="text-sm text-ink-muted mt-6 text-center">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-brand hover:text-brand-hover">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
