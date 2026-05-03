"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  User,
  Phone,
  Truck,
  ChevronLeft,
  ChevronRight,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOCK_ITEMS } from "@/lib/data";

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [currentPhoto, setCurrentPhoto] = useState(0);

  const item = MOCK_ITEMS.find((i) => i.id === params.id);

  if (!item) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">Item no encontrado</h1>
        <Button onClick={() => router.push("/items")}>
          Volver a items
        </Button>
      </div>
    );
  }

  const timeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60));
    if (diff < 1) return "Hace minutos";
    if (diff < 24) return `Hace ${diff} horas`;
    const days = Math.floor(diff / 24);
    return `Hace ${days} dia${days > 1 ? "s" : ""}`;
  };

  const statusColors = {
    available: "bg-green-500/20 text-green-600 dark:text-green-400",
    reserved: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
    picked_up: "bg-gray-500/20 text-gray-600 dark:text-gray-400",
  };

  const statusLabels = {
    available: "Disponible",
    reserved: "Reservado",
    picked_up: "Retirado",
  };

  const prevPhoto = () => {
    setCurrentPhoto((prev) =>
      prev === 0 ? item.photos.length - 1 : prev - 1
    );
  };

  const nextPhoto = () => {
    setCurrentPhoto((prev) =>
      prev === item.photos.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 gap-1"
        onClick={() => router.push("/items")}
      >
        Volver
      </Button>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Photo gallery */}
        <div>
          <div className="relative overflow-hidden rounded-lg border bg-muted">
            <img
              src={item.photos[currentPhoto]}
              alt={item.title}
              className="aspect-square w-full object-cover"
            />

            {item.photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 hover:bg-background transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 hover:bg-background transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {item.photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPhoto(i)}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        i === currentPhoto ? "bg-primary" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {item.photos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {item.photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPhoto(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                    i === currentPhoto
                      ? "border-primary"
                      : "border-transparent hover:border-muted"
                  }`}
                >
                  <img
                    src={photo}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {item.category}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[item.status]}`}
              >
                {statusLabels[item.status]}
              </span>
            </div>

            <h1 className="text-2xl font-bold md:text-3xl">{item.title}</h1>

            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {timeAgo(item.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {item.city}
              </span>
            </div>
          </div>

          <div>
            <h2 className="mb-2 font-semibold">Descripcion</h2>
            <p className="text-muted-foreground whitespace-pre-line">
              {item.description}
            </p>
          </div>

          {/* Location */}
          <div>
            <h2 className="mb-2 font-semibold">Ubicacion de retiro</h2>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm">
                {item.address}, {item.neighborhood}
              </p>
              <p className="text-sm text-muted-foreground">{item.city}</p>

              {/* Map placeholder */}
              <div className="mt-3 flex h-40 items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
                <div className="text-center">
                  <MapPin className="mx-auto mb-1 h-5 w-5" />
                  <p>Mapa</p>
                  <p className="text-xs">
                    {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Donor info */}
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 font-semibold">Donante</h2>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{item.donorName}</p>
                {item.donorPhone && (
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {item.donorPhone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 gap-2">
              <Share2 className="h-4 w-4" />
              Compartir
            </Button>
            {item.status === "available" && (
              <Button className="flex-1 gap-2">
                <Truck className="h-4 w-4" />
                Reservar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
