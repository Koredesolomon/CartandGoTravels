import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/payment";
import { getConsularAccessRef } from "@/lib/consularAccess";
import { deleteConsularJob, readConsularJob } from "@/lib/consularJobs";

type Context = { params: Promise<{ id: string }> };
const denied = () => NextResponse.json({ error: "Payment is required or your session has expired." }, { status: 402, headers: { "Cache-Control": "private, no-store" } });

export async function GET(request: NextRequest, context: Context) {
  const access = getConsularAccessRef(request.cookies.get(ACCESS_COOKIE)?.value);
  if (!access) return denied();
  return readConsularJob((await context.params).id, access);
}

export async function DELETE(request: NextRequest, context: Context) {
  const access = getConsularAccessRef(request.cookies.get(ACCESS_COOKIE)?.value);
  if (!access) return denied();
  return deleteConsularJob((await context.params).id, access);
}
