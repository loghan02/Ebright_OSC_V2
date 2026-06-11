import { config as loadEnv } from "dotenv";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma config for the sms_syllabus database (academy/training content).
// Use this with the `--config` flag, e.g. `prisma generate --config=prisma/sms-syllabus/prisma.config.ts`.

// Explicitly load the project root .env — `dotenv/config` resolves relative
// to cwd which Prisma sometimes changes before reading this file.
loadEnv({ path: path.resolve(__dirname, "../../.env") });

export default defineConfig({
  schema: "./schema.prisma",
  migrations: {
    path: "./migrations",
  },
  datasource: {
    url: process.env["SMS_SYLLABUS_DATABASE_URL"] as string,
  },
});
