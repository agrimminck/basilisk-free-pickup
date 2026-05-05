"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter, X, Loader2 } from "lucide-react";
import { ItemCard } from "@/components/item-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CATEGORIES, CITIES } from "@/lib/data";
import type { Item } from "@/lib/types";

export default function ItemsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadItems() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/items");
        if (!res.ok) throw new Error("Error cargando items");
        const data = (await res.json()) as Item[];
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    loadItems();
  }, []);

  const filtered = items
    .filter((item) => {
      const matchSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        !category || item.category === category.toLowerCase();
      const matchCity = !city || item.city === city;
      return matchSearch && matchCategory && matchCity;
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return a.title.localeCompare(b.title);
    });

  const hasActiveFilters = search || category || city;

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
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Items disponibles</h1>
          <p className="text-muted-foreground">
            {filtered.length} item{filtered.length !== 1 ? "s" : ""} encontrado
            {filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/items/new">
          <Button className="w-full sm:w-auto gap-2">Publicar item</Button>
        </Link>
      </div>

      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={hasActiveFilters ? "border-primary text-primary" : ""}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>

        {showFilters && (
          <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Categoria
              </label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Todas</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Ciudad
              </label>
              <Select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">Todas</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Ordenar por
              </label>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recent">Mas recientes</option>
                <option value="alpha">A-Z</option>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="sm:col-span-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setCategory("");
                    setCity("");
                  }}
                  className="gap-1 text-muted-foreground"
                >
                  <X className="h-3 w-3" />
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-lg text-muted-foreground">
            No se encontraron items con esos filtros
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearch("");
              setCategory("");
              setCity("");
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
