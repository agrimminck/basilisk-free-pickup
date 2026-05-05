"use client";

import { useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReviewProfile {
  id: string;
  fullName: string;
}

interface ReviewData {
  id: number;
  matchId: number;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: ReviewProfile | null;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/reviews");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Error al cargar reviews");
        }
        const data: ReviewData[] = await res.json();
        setReviews(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, []);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">Error</h1>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Reviews recibidas</h1>
        {reviews.length > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3">
              <span className="text-3xl font-bold text-primary">
                {averageRating.toFixed(1)}
              </span>
              <div>
                <StarRating rating={Math.round(averageRating)} />
                <p className="text-xs text-muted-foreground">
                  {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-lg text-muted-foreground">
            No tenes reviews recibidas aun
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      {review.reviewer?.fullName ?? "Usuario"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
              </CardHeader>
              {review.comment && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
