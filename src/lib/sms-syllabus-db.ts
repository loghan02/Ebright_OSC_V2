import { PrismaClient } from "@/generated/sms-syllabus-client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForSms = globalThis as unknown as { __smsSyllabus?: PrismaClient };

function createClient() {
  // Force the PG session timezone to UTC. Matches src/lib/prisma.ts so
  // timestamptz reads aren't silently shifted by the server's local TZ.
  //
  // max: 3 — the Postgres server is shared with the main app + leads-db +
  // HeidiSQL sessions + other apps. Keep this pool tight to avoid hitting
  // max_connections.
  const adapter = new PrismaPg({
    connectionString: process.env.SMS_SYLLABUS_DATABASE_URL,
    options: "-c TimeZone=UTC",
    max: 3,
  });
  return new PrismaClient({ adapter });
}

export const smsSyllabus: PrismaClient =
  globalForSms.__smsSyllabus ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForSms.__smsSyllabus = smsSyllabus;
}
