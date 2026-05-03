export type Pickup = {
  id: string;
  title: string;
  description: string | null;
  location: string;
  availableFrom: Date;
  availableUntil: Date;
  claimedBy: string | null;
  claimedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type User = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};
