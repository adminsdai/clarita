import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-3xl w-full">
        <div className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-bg-card text-xs text-ink-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-brand" />
          MVP — Ley 19.628 + 21.719
        </div>
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6 leading-[1.05]">
          De objeto pasivo<br />
          <span className="text-ink-muted">a sujeto con derecho.</span>
        </h1>
        <p className="text-lg text-ink-muted max-w-2xl mb-10 leading-relaxed">
          Si te negaron un crédito, encarecieron tu seguro, filtraron tu CV o
          rechazaron un beneficio sin explicación, tienes derecho a entender por
          qué. CDT analiza tu caso contra la Ley de Protección de Datos
          Personales y genera un reporte accionable.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/register" className="btn-primary">
            Crear cuenta
          </Link>
          <Link href="/login" className="btn-outline">
            Ya tengo cuenta
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16">
          <Feature
            title="1. Cuéntanos el caso"
            body="Describe la decisión que te afectó y adjunta documentos relevantes."
          />
          <Feature
            title="2. Análisis legal"
            body="Un agente especializado revisa tu caso contra la LPDP chilena."
          />
          <Feature
            title="3. Reporte accionable"
            body="Recibe un PDF con tus derechos, fundamentos y próximos pasos."
          />
        </div>
      </div>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-5">
      <h3 className="font-medium mb-1.5">{title}</h3>
      <p className="text-sm text-ink-muted leading-relaxed">{body}</p>
    </div>
  );
}
