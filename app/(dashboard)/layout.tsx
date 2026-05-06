import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/components/dashboard/LogoutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-bg-subtle/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-semibold tracking-tight">
              <span className="text-brand">CDT</span>
              <span className="text-ink-muted text-sm font-normal ml-2">Asistente LPDP</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-6 text-sm">
              <Link href="/dashboard" className="text-ink-muted hover:text-ink transition-colors">
                Mis solicitudes
              </Link>
              <Link href="/solicitudes/nueva" className="text-ink-muted hover:text-ink transition-colors">
                Nueva solicitud
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-muted hidden sm:inline">{session.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
