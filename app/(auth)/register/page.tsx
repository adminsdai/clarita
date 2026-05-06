import Link from "next/link";
import { RegisterForm } from "@/components/forms/RegisterForm";

export const metadata = { title: "Registro — CDT" };

export default function RegisterPage() {
  return (
    <div className="card p-8">
      <h1 className="text-2xl font-semibold mb-2">Crear cuenta</h1>
      <p className="text-sm text-ink-muted mb-6">
        Completa tus datos. Validamos tu RUT con dígito verificador.
      </p>
      <RegisterForm />
      <p className="text-sm text-ink-muted mt-6 text-center">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-brand hover:text-brand-hover">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
