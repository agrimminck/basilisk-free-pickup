export interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  itemType: "donation" | "sale";
  price?: number;
  photos: string[];
  address: string;
  neighborhood: string;
  city: string;
  lat: number;
  lng: number;
  donorId: string;
  donorName: string;
  donorPhone?: string;
  status: "available" | "reserved" | "picked_up";
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "donante" | "fletero" | "cliente";
  avatarUrl?: string;
  tokensBalance: number;
  freeMatchesUsed: number;
  averageRating?: number;
}

export interface Match {
  id: string;
  requesterId: string;
  recipientId: string;
  itemId?: string;
  matchType: "donante_fletero" | "cliente_cliente";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  tokenCost: number;
  createdAt: string;
  updatedAt: string;
  requesterName?: string;
  recipientName?: string;
  itemTitle?: string;
}

export interface Review {
  id: string;
  matchId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerName?: string;
  revieweeName?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

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

export const TOKEN_PRICE_CLP = 1000;
export const FREE_MATCHES_PER_MONTH = 4;

export const MOCK_ITEMS: Item[] = [
  {
    id: "1",
    title: "Sofa cama 3 cuerpos",
    description:
      "Sofa cama en buen estado, color gris. Tiene un pequeno detalle en un brazo pero funciona perfecto. Ideal para alguien que necesita mueble urgente.",
    category: "Muebles",
    itemType: "donation",
    photos: [
      "https://placehold.co/600x400/1a1a2e/e0e0e0?text=Sofa+1",
      "https://placehold.co/600x400/1a1a2e/e0e0e0?text=Sofa+2",
    ],
    address: "Av. Providencia 1234",
    neighborhood: "Providencia",
    city: "Santiago",
    lat: -33.4264,
    lng: -70.6106,
    donorId: "d1",
    donorName: "Maria Gonzalez",
    donorPhone: "+56912345678",
    status: "available",
    createdAt: "2026-04-28T10:00:00Z",
  },
  {
    id: "2",
    title: "Refrigerador Samsung 300L",
    description:
      "Refrigerador no frost, funciona perfecto. Lo cambio por uno mas grande. Incluye despachador de agua.",
    category: "Electrodomesticos",
    itemType: "sale",
    price: 150000,
    photos: [
      "https://placehold.co/600x400/16213e/e0e0e0?text=Refrigerador",
    ],
    address: "Calle Valparaiso 567",
    neighborhood: "Cerro Alegre",
    city: "Valparaiso",
    lat: -33.0472,
    lng: -71.6127,
    donorId: "d2",
    donorName: "Carlos Ruiz",
    status: "available",
    createdAt: "2026-04-30T14:30:00Z",
  },
  {
    id: "3",
    title: "Caja de libros infantiles",
    description:
      "Aproximadamente 20 libros para ninos de 3 a 8 anos. Todos en buen estado, algunos con pequenas marcas de uso.",
    category: "Libros",
    itemType: "donation",
    photos: ["https://placehold.co/600x400/0f3460/e0e0e0?text=Libros"],
    address: "Los Aromos 890",
    neighborhood: "Las Condes",
    city: "Santiago",
    lat: -33.4172,
    lng: -70.5836,
    donorId: "d3",
    donorName: "Ana Martinez",
    status: "available",
    createdAt: "2026-05-01T09:15:00Z",
  },
  {
    id: "4",
    title: "Bicicleta rodada 26",
    description:
      "Bicicleta mountain bike, 21 velocidades. Frenos V-brake funcionando. Necesita ajuste de cambios.",
    category: "Otros",
    itemType: "sale",
    price: 45000,
    photos: ["https://placehold.co/600x400/533483/e0e0e0?text=Bicicleta"],
    address: "Caupolican 456",
    neighborhood: "Centro",
    city: "Concepcion",
    lat: -36.827,
    lng: -73.0498,
    donorId: "d4",
    donorName: "Pedro Soto",
    status: "reserved",
    createdAt: "2026-04-25T16:00:00Z",
  },
  {
    id: "5",
    title: "Escritorio de madera",
    description:
      "Escritorio estilo industrial, madera de pino y estructura de fierro. Medidas: 120x60x75cm.",
    category: "Muebles",
    itemType: "donation",
    photos: [
      "https://placehold.co/600x400/2c3e50/e0e0e0?text=Escritorio+1",
      "https://placehold.co/600x400/2c3e50/e0e0e0?text=Escritorio+2",
      "https://placehold.co/600x400/2c3e50/e0e0e0?text=Escritorio+3",
    ],
    address: "Diez de Julio 789",
    neighborhood: "El Centro",
    city: "La Serena",
    lat: -29.9027,
    lng: -71.2519,
    donorId: "d5",
    donorName: "Laura Diaz",
    status: "available",
    createdAt: "2026-05-01T11:45:00Z",
  },
  {
    id: "6",
    title: "Monitor LG 24 pulgadas",
    description:
      "Monitor Full HD, entrada HDMI y VGA. Perfecto estado, sin pixeles muertos. Incluye cable HDMI.",
    category: "Electronica",
    itemType: "sale",
    price: 80000,
    photos: ["https://placehold.co/600x400/34495e/e0e0e0?text=Monitor"],
    address: "Apoquindo 3456",
    neighborhood: "Las Condes",
    city: "Santiago",
    lat: -33.4108,
    lng: -70.5711,
    donorId: "d6",
    donorName: "Roberto Fuentes",
    status: "available",
    createdAt: "2026-05-02T08:00:00Z",
  },
];

export const MOCK_USER_DONANTE: User = {
  id: "u1",
  name: "Maria Gonzalez",
  email: "maria@email.com",
  role: "donante",
  tokensBalance: 3,
  freeMatchesUsed: 2,
  averageRating: 4.5,
};

export const MOCK_USER_FLETERO: User = {
  id: "u2",
  name: "Juan Perez",
  email: "juan@email.com",
  role: "fletero",
  tokensBalance: 5,
  freeMatchesUsed: 1,
  averageRating: 4.8,
};

export const MOCK_USER_CLIENTE: User = {
  id: "u3",
  name: "Pedro Sanchez",
  email: "pedro@email.com",
  role: "cliente",
  tokensBalance: 1,
  freeMatchesUsed: 3,
  averageRating: 4.2,
};

export const MOCK_MATCHES: Match[] = [
  {
    id: "m1",
    requesterId: "u2",
    recipientId: "u1",
    itemId: "1",
    matchType: "donante_fletero",
    status: "completed",
    tokenCost: 1,
    createdAt: "2026-04-20T10:00:00Z",
    updatedAt: "2026-04-21T15:00:00Z",
    requesterName: "Juan Perez",
    recipientName: "Maria Gonzalez",
    itemTitle: "Sofa cama 3 cuerpos",
  },
  {
    id: "m2",
    requesterId: "u1",
    recipientId: "u2",
    itemId: "2",
    matchType: "donante_fletero",
    status: "confirmed",
    tokenCost: 1,
    createdAt: "2026-05-01T09:00:00Z",
    updatedAt: "2026-05-01T09:30:00Z",
    requesterName: "Maria Gonzalez",
    recipientName: "Juan Perez",
    itemTitle: "Refrigerador Samsung 300L",
  },
  {
    id: "m3",
    requesterId: "u3",
    recipientId: "u1",
    itemId: "3",
    matchType: "cliente_cliente",
    status: "pending",
    tokenCost: 1,
    createdAt: "2026-05-02T14:00:00Z",
    updatedAt: "2026-05-02T14:00:00Z",
    requesterName: "Pedro Sanchez",
    recipientName: "Maria Gonzalez",
    itemTitle: "Caja de libros infantiles",
  },
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    matchId: "m1",
    reviewerId: "u1",
    revieweeId: "u2",
    reviewerName: "Maria Gonzalez",
    revieweeName: "Juan Perez",
    rating: 5,
    comment: "Excelente servicio, muy puntual y cuidadoso.",
    createdAt: "2026-04-22T10:00:00Z",
  },
  {
    id: "r2",
    matchId: "m1",
    reviewerId: "u2",
    revieweeId: "u1",
    reviewerName: "Juan Perez",
    revieweeName: "Maria Gonzalez",
    rating: 4,
    comment: "Muy amable, el item estaba tal como lo describio.",
    createdAt: "2026-04-22T11:00:00Z",
  },
];
