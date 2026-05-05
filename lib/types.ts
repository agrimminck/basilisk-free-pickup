export type UserRole = "donante" | "fletero" | "cliente";

export type ItemStatus = "available" | "reserved" | "picked_up";
export type ItemType = "donation" | "sale";

export type Profile = {
  id: string;
  userId: string;
  role: UserRole;
  fullName: string;
  phone: string | null;
  tokensBalance: number;
  freeMatchesUsed: number;
  freeMatchesResetAt: string | null;
  averageRating: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ItemPhoto = {
  id: number;
  itemId: number;
  r2Key: string;
  r2Url: string;
  sizeBytes: number;
  uploadedAt: string;
};

export type Item = {
  id: number;
  donanteId: string;
  title: string;
  description: string;
  category: string;
  itemType: ItemType;
  price: number | null;
  status: ItemStatus;
  address: string;
  neighborhood: string | null;
  city: string;
  lat: string | null;
  lng: string | null;
  reservedByFleeterId: string | null;
  createdAt: string;
  updatedAt: string;
  photos: ItemPhoto[];
  donante: Profile | null;
};

export type MatchStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type MatchType = "donante_fletero" | "cliente_cliente";

export type Match = {
  id: number;
  requesterId: string;
  recipientId: string;
  itemId: number | null;
  matchType: MatchType;
  status: MatchStatus;
  tokenCost: number;
  createdAt: string;
  updatedAt: string;
  requester?: Profile | null;
  recipient?: Profile | null;
  item?: Item | null;
};

export type Review = {
  id: number;
  matchId: number;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer?: Profile | null;
  match?: Match | null;
};

export type TokenBalance = {
  tokensBalance: number;
  freeMatchesUsed: number;
  freeMatchesLimit: number;
  freeMatchesRemaining: number;
  averageRating: string | null;
};
