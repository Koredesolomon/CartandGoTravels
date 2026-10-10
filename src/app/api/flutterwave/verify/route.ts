import { NextRequest, NextResponse } from "next/server";
import { getConsularRequestAccess, isConsularPaymentRequired, withConsularSession } from "@/lib/consularAccess";

// Read access status only. Transaction redemption happens exclusively in the bound checkout callback.
export async function POST(request: NextRequest) {
  const access = getConsularRequestAccess(request);
  const response = NextResponse.json(access ? { verified: true, paymentRequired: isConsularPaymentRequired() } : { error: "A paid session is required." }, {
    status: access ? 200 : 402,
    headers: { "Cache-Control": "private, no-store" },
  });
  return access ? withConsularSession(response, access) : response;
}
