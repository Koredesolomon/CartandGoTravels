import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, readToken } from "@/lib/payment";

// Read access status only. Transaction redemption happens exclusively in the bound checkout callback.
export async function POST(request: NextRequest) {
  const access = readToken(request.cookies.get(ACCESS_COOKIE)?.value, "access");
  return NextResponse.json(access ? { verified: true } : { error: "A paid session is required." }, { status: access ? 200 : 402 });
}
