import Link from "next/link";
import { Gift, Truck, Package, MapPin, Clock, Heart, ArrowRight, Star, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-background py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4 text-center relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
            <Heart className="h-4 w-4" />
            Comunidad que comparte
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Lo que sobra para ti,{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              puede servirle a otro
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed">
            Conectamos personas que quieren regalar cosas con fleteros que las
            llevan a quien las necesita. Sin costo, sin complicaciones.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/items/new">
              <Button size="lg" className="w-full sm:w-auto gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25">
                <Gift className="h-5 w-5" />
                Quiero regalar algo
              </Button>
            </Link>
            <Link href="/items">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2 transition-all duration-200 hover:bg-accent"
              >
                <Truck className="h-5 w-5" />
                Soy fletero
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
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
            <div className="relative rounded-xl border bg-card p-6 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-7 w-7 text-primary" />
              </div>
              <div className="mb-2 text-sm font-medium text-primary">
                Paso 1
              </div>
              <h3 className="mb-2 text-xl font-semibold">Publica tu item</h3>
              <p className="text-muted-foreground leading-relaxed">
                Saca fotos, describe lo que regalas y publica tu ubicacion. Todo
                gratis, sin registro complicado.
              </p>
            </div>

            <div className="relative rounded-xl border bg-card p-6 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Truck className="h-7 w-7 text-primary" />
              </div>
              <div className="mb-2 text-sm font-medium text-primary">
                Paso 2
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                Un fletero lo recoge
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Fleteros de la zona reservan tu item y pasan a buscarlo. Tu solo
                esperas en casa.
              </p>
            </div>

            <div className="relative rounded-xl border bg-card p-6 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-7 w-7 text-primary" />
              </div>
              <div className="mb-2 text-sm font-medium text-primary">
                Paso 3
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                Llega a quien lo necesita
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                El fletero entrega el item a una fundacion o persona que lo
                necesita. Tu recibes confirmacion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Seguro y confiable</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Sistema de reviews y reputacion para que siempre sepas con quien tratas.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Comunidad activa</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Cientos de donantes y fleteros conectados en multiples ciudades.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Sin complicaciones</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Publica en minutos y deja que la comunidad haga el resto.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary md:text-4xl">2,450+</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Items regalados
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary md:text-4xl">180+</div>
              <div className="mt-1 text-sm text-muted-foreground">Fleteros activos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary md:text-4xl">15</div>
              <div className="mt-1 text-sm text-muted-foreground">Ciudades</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary md:text-4xl">4.8</div>
              <div className="mt-1 text-sm text-muted-foreground">
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
          <p className="mb-8 text-muted-foreground md:text-lg leading-relaxed">
            Ya sea que tengas algo para regalar o un camion con espacio
            disponible, hay alguien que te necesita.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/items/new">
              <Button size="lg" className="w-full sm:w-auto gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25">
                <Gift className="h-5 w-5" />
                Regalar algo
              </Button>
            </Link>
            <Link href="/items">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2 transition-all duration-200 hover:bg-accent group"
              >
                <Clock className="h-5 w-5" />
                Ver items disponibles
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 mt-auto">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              FreePickup &mdash; Conectando comunidades, reduciendo desperdicio.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/items" className="hover:text-foreground transition-colors">Items</Link>
              <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
