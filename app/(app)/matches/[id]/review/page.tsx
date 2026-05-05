"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Star, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MatchProfile {
  id: string;
  fullName: string;
}

interface MatchItem {
  id: number;
  title: string;
}

interface MatchData {
  id: number;
  requesterId: string;
  recipientId: string;
  itemId: number | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  requester: MatchProfile | null;
  recipient: MatchProfile | null;
  item: MatchItem | null;
}

interface UserProfile {
  id: string;
  fullName: string;
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = parseInt(
    typeof params.id === "string" ? params.id : "",
    10
  );

  const [match, setMatch] = useState<MatchData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [matchRes, profileRes] = await Promise.all([
          fetch(`/api/matches/${matchId}`),
          fetch("/api/user/me"),
        ]);

        if (!matchRes.ok) {
          const data = await matchRes.json().catch(() => ({}));
          throw new Error(data.error || "Error al cargar el match");
        }

        const matchData: MatchData = await matchRes.json();

        if (matchData.status !== "completed") {
          throw new Error("Solo puedes dejar review en matches completados");
        }

        setMatch(matchData);

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

    if (!isNaN(matchId)) {
      fetchData();
    } else {
      setError("ID de match invalido");
      setLoading(false);
    }
  }, [matchId]);

  const revieweeId = match && profile
    ? match.requesterId === profile.id
      ? match.recipientId
      : match.requesterId
    : "";

  const revieweeName = match && profile
    ? match.requesterId === profile.id
      ? match.recipient?.fullName ?? "Usuario"
      : match.requester?.fullName ?? "Usuario"
    : "";

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      setSubmitError("Selecciona una calificacion de 1 a 5 estrellas");
      return;
    }
    if (!match || !profile) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          revieweeId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error || "Error al enviar la review");
        return;
      }

      router.push("/matches");
    } catch {
      setSubmitError("Error de red. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">No disponible</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button className="mt-4" onClick={() => router.push("/matches")}>
          Volver a matches
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 md:py-8">
      <h1 className="mb-2 text-2xl font-bold md:text-3xl">
        Dejar review
      </h1>
      {match && (
        <p className="mb-6 text-muted-foreground">
          Match por <strong>{match.item?.title ?? "sin item"}</strong> con{" "}
          <strong>{revieweeName}</strong>
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Calificacion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const starValue = i + 1;
              const filled = starValue <= (hoverRating || rating);
              return (
                <button
                  key={i}
                  type="button"
                  className="p-1 transition-transform hover:scale-110"
                  onMouseEnter={() => setHoverRating(starValue)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(starValue)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      filled
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div>
            <label
              htmlFor="comment"
              className="mb-1.5 block text-sm font-medium"
            >
              Comentario (opcional)
            </label>
            <Textarea
              id="comment"
              placeholder="Contanos tu experiencia..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          {submitError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/matches")}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar review
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
