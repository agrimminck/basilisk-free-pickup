"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import { Select } from "../../../../components/ui/select";
import { CATEGORIES, CITIES } from "../../../../lib/data";

const MAX_PHOTOS = 5;
const STORAGE_USED = 3;
const STORAGE_LIMIT = 10;

export default function NewItemPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    address: "",
    neighborhood: "",
    city: "",
    itemType: "donation" as "donation" | "sale",
    price: "",
  });

  const storagePercent = (STORAGE_USED / STORAGE_LIMIT) * 100;
  const storageColor =
    storagePercent > 80
      ? "bg-red-500"
      : storagePercent > 50
        ? "bg-yellow-500"
        : "bg-green-500";

  const handlePhotoUpload = () => {
    if (photos.length >= MAX_PHOTOS) return;
    const placeholderUrl = `https://placehold.co/600x400/1a1a2e/e0e0e0?text=Foto+${photos.length + 1}`;
    setPhotos([...photos, placeholderUrl]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          address: formData.address,
          neighborhood: formData.neighborhood,
          city: formData.city,
          itemType: formData.itemType,
          price:
            formData.itemType === "sale"
              ? Number(formData.price) || 0
              : undefined,
          photos,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error publicando item");
      }
      router.push("/items");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Publicar item</h1>
        <p className="text-muted-foreground">
          Completa la informacion para que un fletero pueda recogerlo
        </p>
      </div>

      {/* Storage indicator */}
      <div className="mb-6 rounded-lg border bg-card p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Almacenamiento de fotos</span>
          <span className="text-muted-foreground">
            {STORAGE_USED} / {STORAGE_LIMIT} items publicados
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${storageColor}`}
            style={{ width: `${storagePercent}%` }}
          />
        </div>
        {storagePercent > 80 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            Estas cerca del limite. Contacta soporte para mas espacio.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photos */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Fotos ({photos.length}/{MAX_PHOTOS})
          </label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {photos.map((photo, index) => (
              <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border">
                <img
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={handlePhotoUpload}
                className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="mb-1.5 block text-sm font-medium"
          >
            Titulo *
          </label>
          <Input
            id="title"
            placeholder="Ej: Sofa cama 3 cuerpos"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-sm font-medium"
          >
            Descripcion *
          </label>
          <Textarea
            id="description"
            placeholder="Describe el estado del item, dimensiones, etc."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
            required
          />
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="mb-1.5 block text-sm font-medium"
          >
            Categoria *
          </label>
          <Select
            id="category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            required
          >
            <option value="">Seleccionar categoria</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </div>

        {/* Item type */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="itemType"
              className="mb-1.5 block text-sm font-medium"
            >
              Tipo *
            </label>
            <Select
              id="itemType"
              value={formData.itemType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  itemType: e.target.value as "donation" | "sale",
                  price: e.target.value === "donation" ? "" : formData.price,
                })
              }
              required
            >
              <option value="donation">Donacion</option>
              <option value="sale">Venta</option>
            </Select>
          </div>
          {formData.itemType === "sale" && (
            <div>
              <label
                htmlFor="price"
                className="mb-1.5 block text-sm font-medium"
              >
                Precio (CLP) *
              </label>
              <Input
                id="price"
                type="number"
                placeholder="Ej: 50000"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required={formData.itemType === "sale"}
              />
            </div>
          )}
        </div>

        {/* Location */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4" />
            Ubicacion de retiro
          </div>

          <div>
            <label
              htmlFor="address"
              className="mb-1.5 block text-sm font-medium"
            >
              Direccion *
            </label>
            <Input
              id="address"
              placeholder="Calle y numero"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="neighborhood"
                className="mb-1.5 block text-sm font-medium"
              >
                Barrio / Comuna *
              </label>
              <Input
                id="neighborhood"
                placeholder="Ej: Providencia"
                value={formData.neighborhood}
                onChange={(e) =>
                  setFormData({ ...formData, neighborhood: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label
                htmlFor="city"
                className="mb-1.5 block text-sm font-medium"
              >
                Ciudad *
              </label>
              <Select
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                required
              >
                <option value="">Seleccionar ciudad</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Publicar item"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
