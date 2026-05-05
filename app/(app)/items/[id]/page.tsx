"use client";

import { useEffect, useState } from "react";
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
  Star,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSession } from "@/lib/auth-client";

interface ItemPhoto {
  id: number;
  r2Url: string;
}

interface ItemDonante {
  id: string;
  fullName: string;
  phone: string | null;
  role: "donante" | "fletero" | "cliente";
}

interface ItemDetail {
  id: number;
  title: string;
  description: string;
  category: string;
  itemType: "donation" | "sale";
  price: number | null;
  status: "available" | "reserved" | "picked_up";
  address: string;
  neighborhood: string | null;
  city: string;
  lat: string | null;
  lng: string | null;
  createdAt: string;
  donante: ItemDonante | null;
  photos: ItemPhoto[];
}

interface UserProfile {
  id: string;
  role: "donante" | "fletero" | "cliente";
  fullName: string;
}

type ReservationState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loadingItem, setLoadingItem] = useState(true);
  const [itemError, setItemError] = useState<string | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reservationState, setReservationState] = useState<ReservationState>({
    type: "idle",
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const itemId = typeof params.id === "string" ? params.id : "";

  useEffect(() => {
    async function fetchItem() {
      try {
        const res = await fetch(`/api/items/${itemId}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Error al cargar el item");
        }
        const data: ItemDetail = await res.json();
        setItem(data);
      } catch (err) {
        setItemError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoadingItem(false);
      }
    }

    if (itemId) {
      fetchItem();
    }
  }, [itemId]);

  useEffect(() => {
    async function fetchProfile() {
      if (!session?.user) return;
      try {
        const res = await fetch("/api/user/me");
        if (res.ok) {
          const data: UserProfile = await res.json();
          setProfile(data);
        }
      } catch {
        // ignore
      }
    }
    fetchProfile();
  }, [session]);

  const timeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor(
      (now.getTime() - then.getTime()) / (1000 * 60 * 60)
    );
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
    if (!item) return;
    setCurrentPhoto((prev) =>
      prev === 0 ? item.photos.length - 1 : prev - 1
    );
  };

  const nextPhoto = () => {
    if (!item) return;
    setCurrentPhoto((prev) =>
      prev === item.photos.length - 1 ? 0 : prev + 1
    );
  };

  const handleReserve = async () => {
    if (!item || !profile) return;

    setReservationState({ type: "loading" });

    const matchType: "donante_fletero" | "cliente_cliente" =
      item.itemType === "sale" || profile.role === "cliente"
        ? "cliente_cliente"
        : "donante_fletero";

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: item.donante?.id,
          itemId: item.id,
          matchType,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 402) {
          setReservationState({
            type: "error",
            message: "Saldo insuficiente, compra tokens.",
          });
        } else {
          setReservationState({
            type: "error",
            message: data.error || "Error al crear el match",
          });
        }
        return;
      }

      setReservationState({
        type: "success",
        message: "Match creado, esperando confirmacion",
      });
    } catch {
      setReservationState({
        type: "error",
        message: "Error de red. Intenta de nuevo.",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share && item) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: window.location.href,
        });
      } catch {
        // ignore
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loadingItem) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando item...</p>
      </div>
    );
  }

  if (itemError || !item) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">Item no encontrado</h1>
        <p className="mb-4 text-muted-foreground">
          {itemError || "No se pudo cargar el item"}
        </p>
        <Button onClick={() => router.push("/items")}>
          Volver a items
        </Button>
      </div>
    );
  }

  const photoUrls = item.photos.map((p) => p.r2Url);
  const isAuthenticated = !!session?.user;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 gap-1"
        onClick={() => router.push("/items")}
      >
        <ChevronLeft className="h-4 w-4" />
        Volver
      </Button>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Photo gallery */}
        <div>
          <div className="relative overflow-hidden rounded-lg border bg-muted">
            {photoUrls.length > 0 ? (
              <img
                src={photoUrls[currentPhoto]}
                alt={item.title}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-muted text-muted-foreground">
                Sin fotos
              </div>
            )}

            {photoUrls.length > 1 && (
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

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photoUrls.map((_, i) => (
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

          {photoUrls.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {photoUrls.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPhoto(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                    i === currentPhoto
                      ? "border-primary"
                      : "border-transparent hover:border-muted"
                  }`}
                >
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {item.category}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[item.status]}`}
              >
                {statusLabels[item.status]}
              </span>
              {item.itemType === "sale" && (
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  Venta
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold md:text-3xl">{item.title}</h1>

            {item.itemType === "sale" && item.price !== null && (
              <div className="mt-2 flex items-center gap-1 text-2xl font-bold text-primary">
                <Star className="h-5 w-5 fill-primary" />
                ${item.price.toLocaleString("es-CL")}
              </div>
            )}

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
                {item.address}
                {item.neighborhood ? `, ${item.neighborhood}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">{item.city}</p>

              <div className="mt-3 flex h-40 items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
                <div className="text-center">
                  <MapPin className="mx-auto mb-1 h-5 w-5" />
                  <p>Mapa</p>
                  {item.lat && item.lng && (
                    <p className="text-xs">
                      {Number(item.lat).toFixed(4)},{" "}
                      {Number(item.lng).toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Donor info */}
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 font-semibold">
              {item.donante?.role === "donante" ? "Donante" : "Publicado por"}
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {item.donante?.fullName ?? "Usuario"}
                </p>
                {item.donante?.phone && (
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {item.donante.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Compartir
            </Button>
            {item.status === "available" && (
              <>
                {isAuthenticated ? (
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => {
                      setReservationState({ type: "idle" });
                      setDialogOpen(true);
                    }}
                  >
                    <Truck className="h-4 w-4" />
                    Reservar
                  </Button>
                ) : (
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => router.push("/login")}
                  >
                    <Truck className="h-4 w-4" />
                    Iniciar sesion para reservar
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reservation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar reserva</DialogTitle>
            <DialogDescription>
              Vas a crear un match por <strong>{item.title}</strong>. Se
              descontara 1 token de tu saldo (o se usara un match gratuito si
              dispones).
            </DialogDescription>
          </DialogHeader>

          {reservationState.type === "success" ? (
            <div className="rounded-lg bg-green-500/10 p-4 text-green-700 dark:text-green-400">
              <p className="font-medium">{reservationState.message}</p>
            </div>
          ) : reservationState.type === "error" ? (
            <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
              <p className="font-medium">{reservationState.message}</p>
              {reservationState.message.includes("tokens") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => router.push("/tokens")}
                >
                  Comprar tokens
                </Button>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={reservationState.type === "loading"}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReserve}
              disabled={
                reservationState.type === "loading" ||
                reservationState.type === "success"
              }
            >
              {reservationState.type === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : reservationState.type === "success" ? (
                "Confirmado"
              ) : (
                "Confirmar match"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
