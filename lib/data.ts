export const CATEGORIES = [
  "Muebles",
  "Electrodomesticos",
  "Ropa",
  "Electronica",
  "Libros",
  "Juguetes",
  "Herramientas",
  "Decoracion",
  "Otros",
] as const;

export const CITIES = [
  "Santiago",
  "Valparaiso",
  "Concepcion",
  "La Serena",
  "Antofagasta",
  "Temuco",
  "Rancagua",
  "Talca",
  "Arica",
  "Puerto Montt",
] as const;

// Re-exported from lib/tokens for UI consumers (single source of truth in tokens.ts)
export { TOKEN_PRICE_CLP, FREE_MATCHES_PER_MONTH } from "./tokens";
