"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Star,
  Coins,
  Handshake,
  ChevronRight,
  Plus,
  MessageSquare,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FREE_MATCHES_PER_MONTH, TOKEN_PRICE_CLP } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import type {
  Profile,
  TokenBalance,
  Match,
  Review,
  Item,
} from "@/lib/types";

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const [profileRes, balanceRes, matchesRes, reviewsRes, itemsRes] =
          await Promise.all([
            fetch("/api/user/me"),
            fetch("/api/tokens/balance"),
            fetch("/api/matches"),
            fetch("/api/reviews"),
            fetch("/api/items?mine=true"),
          ]);

        if (profileRes.status === 401 || balanceRes.status === 401) {
          setError("Debes iniciar sesion para ver tu dashboard.");
          return;
        }

        if (!profileRes.ok) throw new Error("Error cargando perfil");
        if (!balanceRes.ok) throw new Error("Error cargando balance");
        if (!matchesRes.ok) throw new Error("Error cargando matches");
        if (!reviewsRes.ok) throw new Error("Error cargando reviews");
        if (!itemsRes.ok) throw new Error("Error cargando items");

        const profileData = (await profileRes.json()) as Profile;
        const balanceData = (await balanceRes.json()) as TokenBalance;
        const matchesData = (await matchesRes.json()) as Match[];
        const reviewsData = (await reviewsRes.json()) as Review[];
        const itemsData = (await itemsRes.json()) as Item[];

        setProfile(profileData);
        setBalance(balanceData);
        setMatches(matchesData);
        setReviews(reviewsData);
        setMyItems(itemsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <p className="text-lg text-red-500">{error}</p>
        <Link href="/login">
          <Button className="mt-4">Iniciar sesion</Button>
        </Link>
      </div>
    );
  }

  if (!profile || !balance) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <p className="text-muted-foreground">No se pudo cargar el dashboard.</p>
      </div>
    );
  }

  const completedMatches = matches.filter((m) => m.status === "completed");
  const freeMatchesRemaining = balance.freeMatchesRemaining;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido, {profile.fullName}
          </p>
        </div>
        <Link href="/tokens">
          <Button size="sm" className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            Comprar tokens
          </Button>
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Coins}
          label="Tokens disponibles"
          value={balance.tokensBalance}
        />
        <StatCard
          icon={Handshake}
          label="Matches gratis restantes"
          value={freeMatchesRemaining}
        />
        <StatCard
          icon={Package}
          label={
            profile.role === "fletero" ? "Items reservados" : "Mis items"
          }
          value={
            profile.role === "fletero" ? matches.length : myItems.length
          }
        />
        <StatCard
          icon={TrendingUp}
          label="Matches completados"
          value={completedMatches.length}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <TokensCard
            tokensBalance={balance.tokensBalance}
            freeMatchesUsed={balance.freeMatchesUsed}
            freeMatchesRemaining={freeMatchesRemaining}
          />
          <MatchesCard matches={matches} />
          {profile.role !== "fletero" && <ItemsCard items={myItems} />}
        </div>

        <div className="space-y-6">
          <RatingCard
            rating={
              balance.averageRating
                ? parseFloat(balance.averageRating)
                : undefined
            }
            reviewCount={reviews.length}
          />
          <ReviewsCard reviews={reviews} />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

function TokensCard({
  tokensBalance,
  freeMatchesUsed,
  freeMatchesRemaining,
}: {
  tokensBalance: number;
  freeMatchesUsed: number;
  freeMatchesRemaining: number;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Tokens y Matches</h2>
        <Link href="/tokens">
          <Button size="sm" className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            Comprar tokens
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-2xl font-bold">{tokensBalance}</p>
          <p className="text-sm text-muted-foreground">Tokens disponibles</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{freeMatchesUsed}</p>
          <p className="text-sm text-muted-foreground">
            Matches gratis usados
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold">{freeMatchesRemaining}</p>
          <p className="text-sm text-muted-foreground">Gratis restantes</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Cada match cuesta 1 token. Todos los usuarios tienen{" "}
        {FREE_MATCHES_PER_MONTH} matches gratis al mes. Precio: $
        {TOKEN_PRICE_CLP.toLocaleString("es-CL")} CLP por token.
      </p>
    </div>
  );
}

function MatchesCard({ matches }: { matches: Match[] }) {
  const statusLabel: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    completed: "Completado",
    cancelled: "Cancelado",
  };
  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
    confirmed: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
    completed: "bg-green-500/20 text-green-600 dark:text-green-400",
    cancelled: "bg-red-500/20 text-red-600 dark:text-red-400",
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-4 font-semibold">Mis matches</h2>
      {matches.length > 0 ? (
        <div className="space-y-3">
          {matches.map((match) => (
            <div
              key={match.id}
              className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-accent/50"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {match.item?.title ?? "Match directo"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {match.requester?.fullName ?? ""} →{" "}
                  {match.recipient?.fullName ?? ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(match.createdAt).toLocaleDateString("es-CL")}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  statusColor[match.status]
                )}
              >
                {statusLabel[match.status]}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Handshake className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No tienes matches aun</p>
          <Link href="/items">
            <Button className="mt-4">Explorar items</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function ItemsCard({ items }: { items: Item[] }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Mis items</h2>
        <Link href="/items/new">
          <Button size="sm" className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            Publicar
          </Button>
        </Link>
      </div>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/items/${item.id}`}
              className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-accent/50"
            >
              <img
                src={item.photos[0]?.r2Url ?? ""}
                alt={item.title}
                className="h-14 w-14 rounded-md object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.city} &middot;{" "}
                  {new Date(item.createdAt).toLocaleDateString("es-CL")}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  item.status === "available"
                    ? "bg-green-500/20 text-green-600 dark:text-green-400"
                    : item.status === "reserved"
                      ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                      : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
                )}
              >
                {item.status === "available"
                  ? "Disponible"
                  : item.status === "reserved"
                    ? "Reservado"
                    : "Retirado"}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            No has publicado items todavia
          </p>
          <Link href="/items/new">
            <Button className="mt-4 gap-1">
              <Plus className="h-4 w-4" />
              Publicar primer item
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function RatingCard({
  rating,
  reviewCount,
}: {
  rating?: number;
  reviewCount: number;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 font-semibold">Tu reputacion</h2>
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-3">
          <Star className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-3xl font-bold">{rating?.toFixed(1) ?? "-"}</p>
          <p className="text-sm text-muted-foreground">
            {reviewCount} review{reviewCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewsCard({ reviews }: { reviews: Review[] }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-4 font-semibold">Reviews recientes</h2>
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.slice(0, 3).map((review) => (
            <div
              key={review.id}
              className="border-b pb-3 last:border-0 last:pb-0"
            >
              <div className="mb-1 flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3.5 w-3.5",
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString("es-CL")}
                </span>
              </div>
              <p className="text-sm font-medium">
                {review.reviewer?.fullName ?? ""}
              </p>
              {review.comment && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center">
          <MessageSquare className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Sin reviews aun</p>
        </div>
      )}
    </div>
  );
}
