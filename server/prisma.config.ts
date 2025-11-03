import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // DATABASE_URL is optional for generation, only required for migrations
    url: env("DATABASE_URL", { optional: true }) || "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
