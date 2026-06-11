import { config as loadEnv } from "dotenv";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma config for the sms_syllabus database (academy/training content).
// Use this with the `--config` flag, e.g. `prisma generate --config=prisma/sms-syllabus/prisma.config.ts`.

// Explicitly load the project root .env — `dotenv/config` resolves relative
// to cwd which Prisma sometimes changes before reading this file.
loadEnv({ path: path.resolve(__dirname, "../../.env") });

// Docker build does NOT have .env mounted, so SMS_SYLLABUS_DATABASE_URL is
// undefined during `prisma generate` at image build time. A placeholder URL
// satisfies the config schema — the client doesn't actually connect during
// generate. Real runtime usage reads process.env.SMS_SYLLABUS_DATABASE_URL
// in src/lib/sms-syllabus-db.ts via the env_file in docker-compose.yml.
const PLACEHOLDER_URL = "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "./schema.prisma",
  migrations: {
    path: "./migrations",
  },
  datasource: {
    url: process.env["SMS_SYLLABUS_DATABASE_URL"] || PLACEHOLDER_URL,
  },
});
