import { readToken } from "@/lib/payment";

export function getConsularAccessRef(cookie: string | undefined): string | null {
  return readToken(cookie, "access")?.ref ?? null;
}
