"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";

type FieldErrors = Partial<Record<"name" | "rut" | "email" | "password", string[]>>;

export function RegisterForm() {
  const [form, setForm] = useState({ name: "", rut: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIssues({});
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al registrar");
        if (data.issues) setIssues(data.issues);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Error de red. Reintenta.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Alert variant="success">
        <strong className="block mb-1">¡Cuenta creada!</strong>
        Te enviamos un correo a <strong>{form.email}</strong> con un enlace para verificar
        tu cuenta. Revisa tu bandeja (y spam).
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      <Field
        label="Nombre completo"
        id="name"
        autoComplete="name"
        value={form.name}
        onChange={(v) => set("name", v)}
        error={issues.name?.[0]}
      />
      <Field
        label="RUT"
        id="rut"
        placeholder="12.345.678-9"
        value={form.rut}
        onChange={(v) => set("rut", v)}
        error={issues.rut?.[0]}
      />
      <Field
        label="Correo electrónico"
        id="email"
        type="email"
        autoComplete="email"
        value={form.email}
        onChange={(v) => set("email", v)}
        error={issues.email?.[0]}
      />
      <Field
        label="Contraseña"
        id="password"
        type="password"
        autoComplete="new-password"
        value={form.password}
        onChange={(v) => set("password", v)}
        error={issues.password?.[0]}
        hint="Mínimo 8 caracteres con letras y números."
      />
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? <Spinner /> : "Crear cuenta"}
      </button>
    </form>
  );
}

function Field({
  label,
  id,
  type = "text",
  placeholder,
  autoComplete,
  value,
  onChange,
  error,
  hint,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="text-xs text-danger mt-1.5">{error}</p>}
      {!error && hint && <p className="text-xs text-ink-dim mt-1.5">{hint}</p>}
    </div>
  );
}
