import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-brand text-sm font-medium mb-2">404</p>
        <h1 className="text-3xl font-semibold mb-3">Página no encontrada</h1>
        <p className="text-ink-muted mb-6">El recurso que buscas no existe.</p>
        <Link href="/" className="btn-primary">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
