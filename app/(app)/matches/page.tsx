"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Handshake, Loader2, CheckCircle, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MatchItem {
  id: number;
  title: string;
}

interface MatchProfile {
  id: string;
  fullName: string;
}

interface MatchData {
  id: number;
  requesterId: string;
  recipientId: string;
  itemId: number | null;
  matchType: "donante_fletero" | "cliente_cliente";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  tokenCost: number;
  createdAt: string;
  updatedAt: string;
  requester: MatchProfile | null;
  recipient: MatchProfile | null;
  item: MatchItem | null;
}

interface UserProfile {
  id: string;
  role: "donante" | "fletero" | "cliente";
  fullName: string;
}

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [matchesRes, profileRes] = await Promise.all([
          fetch("/api/matches"),
          fetch("/api/user/me"),
        ]);

        if (!matchesRes.ok) {
          const data = await matchesRes.json().catch(() => ({}));
          throw new Error(data.error || "Error al cargar matches");
        }

        const matchesData: MatchData[] = await matchesRes.json();
        setMatches(matchesData);

        if (profileRes.ok) {
          const profileData: UserProfile = await profileRes.json();
          setProfile(profileData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleConfirm = async (matchId: number) => {
    setActionLoading(matchId);
    try {
      const res = await fetch(`/api/matches/${matchId}/confirm`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Error al confirmar");
        return;
      }
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId ? { ...m, status: "confirmed" as const } : m
        )
      );
    } catch {
      alert("Error de red");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (matchId: number) => {
    setActionLoading(matchId);
    try {
      const res = await fetch(`/api/matches/${matchId}/complete`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Error al completar");
        return;
      }
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId ? { ...m, status: "completed" as const } : m
        )
      );
    } catch {
      alert("Error de red");
    } finally {
      setActionLoading(null);
    }
  };

  const statusConfig: Record<
    MatchData["status"],
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    pending: { label: "Pendiente", variant: "secondary" },
    confirmed: { label: "Confirmado", variant: "default" },
    completed: { label: "Completado", variant: "outline" },
    cancelled: { label: "Cancelado", variant: "destructive" },
  };

  const otherUserName = (match: MatchData) => {
    if (!profile) return "Usuario";
    return match.requesterId === profile.id
      ? match.recipient?.fullName ?? "Usuario"
      : match.requester?.fullName ?? "Usuario";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando matches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">Error</h1>
        <p className="mb-4 text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
      <div className="mb-6 flex items-center gap-3">
        <Handshake className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Tus matches</h1>
          <p className="text-muted-foreground">
            {matches.length} match{matches.length !== 1 ? "es" : ""}
          </p>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-lg text-muted-foreground">No tenes matches aun</p>
          <Button
            className="mt-4"
            onClick={() => router.push("/items")}
          >
            Explorar items
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const status = statusConfig[match.status];
            const isRecipient = profile?.id === match.recipientId;
            const canConfirm = match.status === "pending" && isRecipient;
            const canComplete = match.status === "confirmed";
            const canReview = match.status === "completed";

            return (
              <Card key={match.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">
                        {match.item?.title ?? "Sin item"}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Con {otherUserName(match)} ·{" "}
                        {match.matchType === "donante_fletero"
                          ? "Donante - Fletero"
                          : "Cliente - Cliente"}
                      </p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(match.createdAt)}
                    </span>
                    <span>Costo: {match.tokenCost} token</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {canConfirm && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(match.id)}
                        disabled={actionLoading === match.id}
                      >
                        {actionLoading === match.id ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-3.5 w-3.5" />
                        )}
                        Confirmar match
                      </Button>
                    )}
                    {canComplete && (
                      <Button
                        size="sm"
                        onClick={() => handleComplete(match.id)}
                        disabled={actionLoading === match.id}
                      >
                        {actionLoading === match.id ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-3.5 w-3.5" />
                        )}
                        Completar
                      </Button>
                    )}
                    {canReview && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(`/matches/${match.id}/review`)
                        }
                      >
                        <Star className="mr-2 h-3.5 w-3.5" />
                        Dejar review
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
