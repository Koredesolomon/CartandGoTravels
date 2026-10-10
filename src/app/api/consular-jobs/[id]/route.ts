import { NextRequest, NextResponse } from "next/server";
import { getConsularRequestAccess, isConsularPaymentRequired } from "@/lib/consularAccess";
import { deleteConsularJob, readConsularJob } from "@/lib/consularJobs";

type Context = { params: Promise<{ id: string }> };
const denied = () => NextResponse.json(isConsularPaymentRequired() ? { error: "Payment is required or your session has expired." } : { code: "job_unavailable", error: "Document processing was interrupted or expired. Please retry." }, { status: isConsularPaymentRequired() ? 402 : 404, headers: { "Cache-Control": "private, no-store" } });

export async function GET(request: NextRequest, context: Context) {
  const access = getConsularRequestAccess(request, false);
  if (!access) return denied();
  return readConsularJob((await context.params).id, access.ref);
}

export async function DELETE(request: NextRequest, context: Context) {
  const access = getConsularRequestAccess(request, false);
  if (!access) return denied();
  return deleteConsularJob((await context.params).id, access.ref);
}
