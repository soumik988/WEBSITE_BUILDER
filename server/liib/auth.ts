import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma.js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
  },

  user: {
    deleteUser: {
      enabled: true,
    },
  },

  trustedOrigins: [
    "http://localhost:5173",
    "https://website-builder-eee5.vercel.app",
  ],

  baseURL: "https://website-builder-api-seven.vercel.app",

  secret: process.env.BETTER_AUTH_SECRET!,

  advanced: {
    useSecureCookies: true,

    defaultCookieAttributes: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    },

    cookies: {
      session_token: {
        name: "auth_session",
        attributes: {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          path: "/",
        },
      },
    },
  },
});