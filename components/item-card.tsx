import Link from "next/link";
import { Item } from "@/lib/data";
import { MapPin, Calendar, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ItemCardProps {
  item: Item;
  userRole?: "donante" | "fletero";
}

export function ItemCard({ item, userRole }: ItemCardProps) {
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

  const timeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60));
    if (diff < 1) return "Hace minutos";
    if (diff < 24) return `Hace ${diff}h`;
    const days = Math.floor(diff / 24);
    return `Hace ${days}d`;
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg">
      <Link href={`/items/${item.id}`}>
        <div className="aspect-video overflow-hidden bg-muted">
          <img
            src={item.photos[0]}
            alt={item.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      </Link>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <Link href={`/items/${item.id}`}>
            <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors">
              {item.title}
            </h3>
          </Link>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
              statusColors[item.status]
            )}
          >
            {statusLabels[item.status]}
          </span>
        </div>

        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {item.description}
        </p>

        <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {item.city}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {timeAgo(item.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {item.category}
          </span>

          {userRole === "fletero" && item.status === "available" && (
            <Button size="sm" className="gap-1">
              <Truck className="h-3.5 w-3.5" />
              Reservar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
