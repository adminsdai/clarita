import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="text-sm text-ink-muted hover:text-ink mb-6 inline-block transition-colors"
        >
          ← Volver
        </Link>
        {children}
      </div>
    </main>
  );
}
