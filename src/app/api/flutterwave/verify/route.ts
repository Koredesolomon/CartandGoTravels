import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/payment";
import { getConsularAccessRef } from "@/lib/consularAccess";

// Read access status only. Transaction redemption happens exclusively in the bound checkout callback.
export async function POST(request: NextRequest) {
  const access = getConsularAccessRef(request.cookies.get(ACCESS_COOKIE)?.value);
  return NextResponse.json(access ? { verified: true } : { error: "A paid session is required." }, {
    status: access ? 200 : 402,
    headers: { "Cache-Control": "private, no-store" },
  });
}
