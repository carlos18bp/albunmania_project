import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <section className="border-b border-border bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-background via-muted to-background">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <p className="inline-flex items-center text-xs font-medium text-foreground bg-card border border-border rounded-full px-3 py-1">
                Mundial 26 · faltan pocas semanas
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-4">
                Albunmanía — la comunidad colombiana de intercambio de cromos
              </h1>
              <p className="mt-4 text-muted-foreground max-w-2xl">
                Llená tu álbum con match dual: swipe por proximidad o QR cara a cara.
                Catálogo precargado, reseñas con reputación y cierre directo por WhatsApp.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="bg-primary text-primary-foreground rounded-full px-5 py-3 hover:bg-primary/90 shadow-sm"
                  href="/sign-up"
                >
                  Registrarme con Google
                </Link>
                <Link
                  className="border border-border rounded-full px-5 py-3 hover:bg-accent hover:text-accent-foreground shadow-sm"
                  href="/manual"
                >
                  ¿Cómo funciona?
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-card border border-border p-4">
                  <p className="text-xs text-muted-foreground">Match</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">Por proximidad y QR</p>
                </div>
                <div className="rounded-2xl bg-card border border-border p-4">
                  <p className="text-xs text-muted-foreground">Reputación</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">Reseñas post-trade</p>
                </div>
                <div className="rounded-2xl bg-card border border-border p-4">
                  <p className="text-xs text-muted-foreground">Cierre</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">WhatsApp opt-in</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-border bg-gradient-to-br from-card to-muted p-6 shadow-sm">
                <p className="text-xs font-medium text-foreground">Próximamente</p>
                <p className="mt-2 text-lg font-semibold tracking-tight">Catálogo Mundial 26</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Carga inicial completa, ediciones especiales destacadas y filtros por equipo, número y rareza.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
