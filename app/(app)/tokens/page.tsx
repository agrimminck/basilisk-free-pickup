"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, CreditCard, Minus, Plus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TOKEN_PRICE_CLP,
  MOCK_USER_DONANTE,
  FREE_MATCHES_PER_MONTH,
} from "@/lib/data";

const PRESET_AMOUNTS = [1, 3, 5, 10];

export default function TokensPage() {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const totalCents = quantity * TOKEN_PRICE_CLP * 100;
  const totalFormatted = (quantity * TOKEN_PRICE_CLP).toLocaleString("es-CL");

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tokens/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens: quantity }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        const data = await res.json();
        alert(data.error ?? "Error al comprar tokens");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-20 text-center">
        <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
        <h1 className="text-2xl font-bold">Compra exitosa</h1>
        <p className="mt-2 text-muted-foreground">
          Se agregaron {quantity} tokens a tu cuenta.
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
        {/* Current balance mock */}
        <div className="mb-6 flex items-center justify-between rounded-lg bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tu balance</p>
              <p className="text-xl font-bold">{MOCK_USER_DONANTE.tokensBalance} tokens</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Gratis este mes</p>
            <p className="text-xl font-bold">
              {Math.max(0, FREE_MATCHES_PER_MONTH - MOCK_USER_DONANTE.freeMatchesUsed)} /{" "}
              {FREE_MATCHES_PER_MONTH}
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
          {loading ? "Procesando..." : `Pagar $${totalFormatted} CLP`}
        </Button>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Los tokens no expiran. Puedes usarlos en cualquier momento para
          confirmar matches.
        </p>
      </div>
    </div>
  );
}
