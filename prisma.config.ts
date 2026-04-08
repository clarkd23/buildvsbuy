import { defineConfig } from "@prisma/config";

// NOTE: URL is hardcoded here for Prisma CLI commands (migrate, generate).
// At runtime the app reads DATABASE_URL from environment via lib/prisma.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://neondb_owner:npg_X24boqNMJezf@ep-quiet-sea-amj036uz.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require",
  },
});
