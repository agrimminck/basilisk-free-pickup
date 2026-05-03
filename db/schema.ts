import {
  pgSchema,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  serial,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const freePickup = pgSchema("free_pickup");

// Enums
export const roleEnum = freePickup.enum("role", ["donante", "fletero", "cliente"]);
export const itemCategoryEnum = freePickup.enum("item_category", [
  "muebles",
  "electrodomesticos",
  "ropa",
  "electronica",
  "juguetes",
  "libros",
  "otros",
]);
export const itemStatusEnum = freePickup.enum("item_status", [
  "available",
  "reserved",
  "picked_up",
]);
export const itemTypeEnum = freePickup.enum("item_type", ["donation", "sale"]);
export const matchTypeEnum = freePickup.enum("match_type", [
  "donante_fletero",
  "cliente_cliente",
]);
export const matchStatusEnum = freePickup.enum("match_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);
export const tokenTransactionTypeEnum = freePickup.enum("token_transaction_type", [
  "purchase",
  "match_spend",
  "free_match",
  "refund",
  "bonus",
]);
export const tokenPurchaseStatusEnum = freePickup.enum("token_purchase_status", [
  "pending",
  "completed",
  "failed",
]);

// Better Auth core tables
export const users = freePickup.table("user", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: varchar("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = freePickup.table("session", {
  id: varchar("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: varchar("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = freePickup.table("account", {
  id: varchar("id").primaryKey(),
  accountId: varchar("account_id").notNull(),
  providerId: varchar("provider_id").notNull(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: varchar("access_token"),
  refreshToken: varchar("refresh_token"),
  idToken: varchar("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: varchar("scope"),
  password: varchar("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = freePickup.table("verification", {
  id: varchar("id").primaryKey(),
  identifier: varchar("identifier").notNull(),
  value: varchar("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// App tables
export const profiles = freePickup.table("profiles", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull().default("cliente"),
  fullName: varchar("full_name").notNull(),
  phone: varchar("phone"),
  tokensBalance: integer("tokens_balance").notNull().default(0),
  freeMatchesUsed: integer("free_matches_used").notNull().default(0),
  freeMatchesResetAt: timestamp("free_matches_reset_at"),
  averageRating: decimal("average_rating", { precision: 2, scale: 1 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const items = freePickup.table("items", {
  id: serial("id").primaryKey(),
  donanteId: varchar("donante_id")
    .notNull()
    .references(() => profiles.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: itemCategoryEnum("category").notNull(),
  itemType: itemTypeEnum("item_type").notNull().default("donation"),
  price: integer("price"),
  status: itemStatusEnum("status").notNull().default("available"),
  address: varchar("address").notNull(),
  neighborhood: varchar("neighborhood"),
  city: varchar("city").notNull(),
  lat: decimal("lat"),
  lng: decimal("lng"),
  reservedByFleeterId: varchar("reserved_by_fleeter_id").references(
    () => profiles.id
  ),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const itemPhotos = freePickup.table("item_photos", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id")
    .notNull()
    .references(() => items.id),
  r2Key: varchar("r2_key").notNull(),
  r2Url: varchar("r2_url").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const matches = freePickup.table("matches", {
  id: serial("id").primaryKey(),
  requesterId: varchar("requester_id")
    .notNull()
    .references(() => profiles.id),
  recipientId: varchar("recipient_id")
    .notNull()
    .references(() => profiles.id),
  itemId: integer("item_id").references(() => items.id),
  matchType: matchTypeEnum("match_type").notNull(),
  status: matchStatusEnum("status").notNull().default("pending"),
  tokenCost: integer("token_cost").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const reviews = freePickup.table("reviews", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id")
    .notNull()
    .references(() => matches.id),
  reviewerId: varchar("reviewer_id")
    .notNull()
    .references(() => profiles.id),
  revieweeId: varchar("reviewee_id")
    .notNull()
    .references(() => profiles.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tokenTransactions = freePickup.table("token_transactions", {
  id: serial("id").primaryKey(),
  profileId: varchar("profile_id")
    .notNull()
    .references(() => profiles.id),
  amount: integer("amount").notNull(),
  transactionType: tokenTransactionTypeEnum("transaction_type").notNull(),
  description: varchar("description"),
  matchId: integer("match_id").references(() => matches.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tokenPurchases = freePickup.table("token_purchases", {
  id: serial("id").primaryKey(),
  profileId: varchar("profile_id")
    .notNull()
    .references(() => profiles.id),
  amountCents: integer("amount_paid_cents").notNull(),
  tokensPurchased: integer("tokens_purchased").notNull(),
  status: tokenPurchaseStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  profile: many(profiles),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  itemsAsDonante: many(items, { relationName: "donante_items" }),
  itemsAsFleeter: many(items, { relationName: "reserved_items" }),
  matchesAsRequester: many(matches, { relationName: "requester_matches" }),
  matchesAsRecipient: many(matches, { relationName: "recipient_matches" }),
  reviewsGiven: many(reviews, { relationName: "reviewer_reviews" }),
  reviewsReceived: many(reviews, { relationName: "reviewee_reviews" }),
  tokenTransactions: many(tokenTransactions),
  tokenPurchases: many(tokenPurchases),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  donante: one(profiles, {
    fields: [items.donanteId],
    references: [profiles.id],
    relationName: "donante_items",
  }),
  reservedByFleeter: one(profiles, {
    fields: [items.reservedByFleeterId],
    references: [profiles.id],
    relationName: "reserved_items",
  }),
  photos: many(itemPhotos),
  matches: many(matches),
}));

export const itemPhotosRelations = relations(itemPhotos, ({ one }) => ({
  item: one(items, {
    fields: [itemPhotos.itemId],
    references: [items.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  requester: one(profiles, {
    fields: [matches.requesterId],
    references: [profiles.id],
    relationName: "requester_matches",
  }),
  recipient: one(profiles, {
    fields: [matches.recipientId],
    references: [profiles.id],
    relationName: "recipient_matches",
  }),
  item: one(items, {
    fields: [matches.itemId],
    references: [items.id],
  }),
  reviews: many(reviews),
  tokenTransactions: many(tokenTransactions),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  match: one(matches, {
    fields: [reviews.matchId],
    references: [matches.id],
  }),
  reviewer: one(profiles, {
    fields: [reviews.reviewerId],
    references: [profiles.id],
    relationName: "reviewer_reviews",
  }),
  reviewee: one(profiles, {
    fields: [reviews.revieweeId],
    references: [profiles.id],
    relationName: "reviewee_reviews",
  }),
}));

export const tokenTransactionsRelations = relations(tokenTransactions, ({ one }) => ({
  profile: one(profiles, {
    fields: [tokenTransactions.profileId],
    references: [profiles.id],
  }),
  match: one(matches, {
    fields: [tokenTransactions.matchId],
    references: [matches.id],
  }),
}));

export const tokenPurchasesRelations = relations(tokenPurchases, ({ one }) => ({
  profile: one(profiles, {
    fields: [tokenPurchases.profileId],
    references: [profiles.id],
  }),
}));
