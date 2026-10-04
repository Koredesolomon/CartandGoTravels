import type { Pool } from "mysql2/promise";
import { PaymentConfigurationError } from "@/lib/paymentConfiguration";

export class PaymentStorageError extends Error {}

function storageError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  const messages: Record<string, string> = {
    ER_ACCESS_DENIED_ERROR: "MySQL rejected the database credentials or user permissions.",
    ER_BAD_DB_ERROR: "DB_NAME does not match an existing database.",
    ER_NO_SUCH_TABLE: "The payment_redemptions table has not been created in DB_NAME.",
    ENOTFOUND: "DB_HOST could not be resolved.",
    ECONNREFUSED: "MySQL refused the connection. Check DB_HOST and DB_PORT.",
    ETIMEDOUT: "The database connection timed out.",
  };
  return new PaymentStorageError(messages[code] ?? "The payment database is unavailable.");
}

let pool: Pool | undefined;

export function databaseConfig() {
  const host = process.env.DB_HOST?.trim();
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME?.trim();
  const missing = [!host && "DB_HOST", !user && "DB_USER", !password && "DB_PASSWORD", !database && "DB_NAME"].filter(Boolean);
  if (missing.length) throw new PaymentConfigurationError(`Missing environment variables: ${missing.join(", ")}.`);
  const port = Number(process.env.DB_PORT ?? "3306");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new PaymentConfigurationError("DB_PORT must be a valid port number.");
  if (process.env.DB_SSL && !["true", "false"].includes(process.env.DB_SSL)) throw new PaymentConfigurationError("DB_SSL must be true or false.");
  return { host: host!, user: user!, password: password!, database: database!, port, ...(process.env.DB_SSL === "true" ? { ssl: { rejectUnauthorized: true } } : {}) };
}

export async function getDatabase() {
  const config = databaseConfig();
  if (!pool) {
    const { createPool } = await import("mysql2/promise");
    if (!pool) pool = createPool({
      ...config,
      connectionLimit: 3,
      maxIdle: 3,
      idleTimeout: 60000,
      connectTimeout: 10000,
      waitForConnections: true,
      queueLimit: 20,
      enableKeepAlive: true,
    });
  }
  return pool;
}

export async function checkPaymentStorage() {
  const db = await getDatabase();
  try {
    await db.execute({ sql: "SELECT transaction_id FROM payment_redemptions LIMIT 0", timeout: 10000 });
  } catch (error) {
    throw storageError(error);
  }
}
