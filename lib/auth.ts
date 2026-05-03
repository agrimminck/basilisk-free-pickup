import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "../db/schema";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const { db } = await import("./db");
          const { profiles } = await import("../db/schema");
          await db.insert(profiles).values({
            id: user.id,
            userId: user.id,
            role: "cliente",
            fullName: user.name ?? "",
            tokensBalance: 0,
            freeMatchesUsed: 0,
          });
        },
      },
    },
  },
});
