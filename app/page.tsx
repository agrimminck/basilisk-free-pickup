import Link from "next/link";
import { Gift, Truck, Package, MapPin, Clock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-background py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Heart className="h-4 w-4" />
            Comunidad que comparte
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Lo que sobra para ti,{" "}
            <span className="text-primary">puede servirle a otro</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Conectamos personas que quieren regalar cosas con fleteros que las
            llevan a quien las necesita. Sin costo, sin complicaciones.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/items/new">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                <Gift className="h-5 w-5" />
                Quiero regalar algo
              </Button>
            </Link>
            <Link href="/items">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2"
              >
                <Truck className="h-5 w-5" />
                Soy fletero
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-4 top-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -right-4 bottom-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Como funciona
            </h2>
            <p className="text-muted-foreground md:text-lg">
              Tres pasos simples para que nada se desperdicie
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="relative rounded-xl border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-7 w-7 text-primary" />
              </div>
              <div className="mb-2 text-sm font-medium text-primary">
                Paso 1
              </div>
              <h3 className="mb-2 text-xl font-semibold">Publica tu item</h3>
              <p className="text-muted-foreground">
                Saca fotos, describe lo que regalas y publica tu ubicacion. Todo
                gratis, sin registro complicado.
              </p>
            </div>

            <div className="relative rounded-xl border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Truck className="h-7 w-7 text-primary" />
              </div>
              <div className="mb-2 text-sm font-medium text-primary">
                Paso 2
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                Un fletero lo recoge
              </h3>
              <p className="text-muted-foreground">
                Fleteros de la zona reservan tu item y pasan a buscarlo. Tu solo
                esperas en casa.
              </p>
            </div>

            <div className="relative rounded-xl border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-7 w-7 text-primary" />
              </div>
              <div className="mb-2 text-sm font-medium text-primary">
                Paso 3
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                Llega a quien lo necesita
              </h3>
              <p className="text-muted-foreground">
                El fletero entrega el item a una fundacion o persona que lo
                necesita. Tu recibes confirmacion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/50 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">2,450+</div>
              <div className="text-sm text-muted-foreground">
                Items regalados
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">180+</div>
              <div className="text-sm text-muted-foreground">Fleteros activos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">15</div>
              <div className="text-sm text-muted-foreground">Ciudades</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">4.8</div>
              <div className="text-sm text-muted-foreground">
                Valoracion promedio
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Empieza hoy a compartir
          </h2>
          <p className="mb-8 text-muted-foreground md:text-lg">
            Ya sea que tengas algo para regalar o un camion con espacio
            disponible, hay alguien que te necesita.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/items/new">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                <Gift className="h-5 w-5" />
                Regalar algo
              </Button>
            </Link>
            <Link href="/items">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2"
              >
                <Clock className="h-5 w-5" />
                Ver items disponibles
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>FreePickup &mdash; Conectando comunidades, reduciendo desperdicio.</p>
        </div>
      </footer>
    </div>
  );
}
