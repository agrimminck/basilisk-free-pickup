"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Coins,
  CreditCard,
  Minus,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TOKEN_PRICE_CLP,
  FREE_MATCHES_PER_MONTH,
} from "@/lib/data";
import type { TokenBalance, Profile } from "@/lib/types";

const PRESET_AMOUNTS = [1, 3, 5, 10];

function TokensPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const status = searchParams.get("status");

  const totalCents = quantity * TOKEN_PRICE_CLP * 100;
  const totalFormatted = (quantity * TOKEN_PRICE_CLP).toLocaleString("es-CL");

  useEffect(() => {
    async function loadData() {
      try {
        const [balanceRes, profileRes] = await Promise.all([
          fetch("/api/tokens/balance"),
          fetch("/api/profile"),
        ]);
        if (balanceRes.ok) {
          const b = (await balanceRes.json()) as TokenBalance;
          setBalance(b);
        }
        if (profileRes.ok) {
          const p = (await profileRes.json()) as Profile;
          setProfile(p);
        }
      } catch {
        // ignore
      } finally {
        setDataLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (status === "success") {
      setStatusMessage("Pago aprobado. Verificando tu compra...");
    } else if (status === "failure") {
      setStatusMessage(
        "El pago fue rechazado o cancelado. Intenta nuevamente."
      );
    } else if (status === "pending") {
      setStatusMessage("Tu pago esta pendiente de confirmacion.");
    }
  }, [status]);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tokens/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens: quantity }),
      });
      const data = await res.json();
      if (res.ok && data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        alert(data.error ?? "Error al iniciar el pago");
        setLoading(false);
      }
    } catch {
      alert("Error de red al iniciar el pago");
      setLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-20 text-center">
        <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
        <h1 className="text-2xl font-bold">Pago exitoso</h1>
        <p className="mt-2 text-muted-foreground">
          {statusMessage ?? "Tu compra fue procesada correctamente."}
        </p>
        <Button className="mt-6" onClick={() => router.push("/dashboard")}>
          Ir al dashboard
        </Button>
      </div>
    );
  }

  if (status === "failure") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-20 text-center">
        <XCircle className="mb-4 h-16 w-16 text-red-500" />
        <h1 className="text-2xl font-bold">Pago fallido</h1>
        <p className="mt-2 text-muted-foreground">
          {statusMessage ?? "No se pudo completar el pago."}
        </p>
        <Button className="mt-6" onClick={() => router.push("/tokens")}>
          Intentar de nuevo
        </Button>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-20 text-center">
        <Clock className="mb-4 h-16 w-16 text-yellow-500" />
        <h1 className="text-2xl font-bold">Pago pendiente</h1>
        <p className="mt-2 text-muted-foreground">
          {statusMessage ?? "Tu pago esta siendo procesado."}
        </p>
        <Button className="mt-6" onClick={() => router.push("/dashboard")}>
          Ir al dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Comprar Tokens</h1>
        <p className="mt-2 text-muted-foreground">
          Los tokens te permiten hacer matches con otros usuarios.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        {/* Current balance */}
        <div className="mb-6 flex items-center justify-between rounded-lg bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tu balance</p>
              <p className="text-xl font-bold">
                {dataLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `${balance?.tokensBalance ?? 0} tokens`
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Gratis este mes</p>
            <p className="text-xl font-bold">
              {dataLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `${Math.max(0, FREE_MATCHES_PER_MONTH - (balance?.freeMatchesUsed ?? 0))} / ${FREE_MATCHES_PER_MONTH}`
              )}
            </p>
          </div>
        </div>

        {/* Quantity selector */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">
            Cantidad de tokens
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => setQuantity(amount)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  quantity === amount
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card hover:bg-accent"
                }`}
              >
                {amount} token{amount > 1 ? "s" : ""}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="rounded-lg border p-2 hover:bg-accent"
              aria-label="Disminuir"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[3ch] text-center text-xl font-bold">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="rounded-lg border p-2 hover:bg-accent"
              aria-label="Aumentar"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Price summary */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {quantity} token{quantity > 1 ? "s" : ""} x ${TOKEN_PRICE_CLP.toLocaleString("es-CL")} CLP
            </span>
            <span className="font-medium">${totalFormatted} CLP</span>
          </div>
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>${totalFormatted} CLP</span>
          </div>
        </div>

        {/* CTA */}
        <Button
          className="mt-6 w-full gap-2"
          size="lg"
          onClick={handlePurchase}
          disabled={loading}
        >
          <CreditCard className="h-4 w-4" />
          {loading
            ? "Redirigiendo a MercadoPago..."
            : `Pagar $${totalFormatted} CLP`}
        </Button>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Los tokens no expiran. Puedes usarlos en cualquier momento para
          confirmar matches.
        </p>
      </div>
    </div>
  );
}

export default function TokensPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="rounded-lg border bg-card p-6">
            <p className="text-center text-muted-foreground">Cargando...</p>
          </div>
        </div>
      }
    >
      <TokensPageInner />
    </Suspense>
  );
}
