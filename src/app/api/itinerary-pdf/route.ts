import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/payment";
import { getConsularAccessRef } from "@/lib/consularAccess";
import { validateItineraryExport } from "@/lib/itineraryExport";
import { createItineraryPdf } from "@/lib/itineraryPdf";
import { validateSupportingDocuments } from "@/lib/itinerarySupportingDocuments";
import { MAX_SUPPORT_TOTAL_BYTES } from "@/lib/itineraryDocumentRequirements";

export const runtime = "nodejs";
const MAX_BODY_BYTES = MAX_SUPPORT_TOTAL_BYTES + 512 * 1024;

export async function POST(request: NextRequest) {
  if (!getConsularAccessRef(request.cookies.get(ACCESS_COOKIE)?.value)) return NextResponse.json({ error: "Unlock AI Consular to download your itinerary." }, { status: 402 });
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) return NextResponse.json({ error: "This itinerary is too large to export." }, { status: 413 });
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: "Provide an itinerary to export." }, { status: 400 });
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;")) return NextResponse.json({ error: "Upload the required supporting documents with your itinerary." }, { status: 400 });
  let form: FormData;
  let body: unknown;
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); return NextResponse.json({ error: "This itinerary is too large to export." }, { status: 413 }); }
      chunks.push(value);
    }
    const parsed = new Request(request.url, { method: "POST", headers: { "Content-Type": request.headers.get("content-type")! }, body: new Uint8Array(Buffer.concat(chunks)) });
    form = await parsed.formData();
    const payload = form.get("itinerary");
    if (form.getAll("itinerary").length !== 1 || typeof payload !== "string" || Buffer.byteLength(payload) > 512 * 1024) throw new Error();
    body = JSON.parse(payload);
  } catch { return NextResponse.json({ error: "Invalid itinerary request." }, { status: 400 }); }
  let input;
  try { input = validateItineraryExport(body); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Check the itinerary details." }, { status: 400 }); }
  let documents;
  try { documents = await validateSupportingDocuments(form, input.plan); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Check the supporting documents." }, { status: 400 }); }
  try {
    const bytes = await createItineraryPdf(input, documents);
    const destination = input.plan.details.destination.replace(/[^a-z0-9]+/gi, "-");
    return new NextResponse(new Uint8Array(bytes), { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Flight-Accommodation-Itinerary-${destination}-${input.plan.details.start}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    // Do not log traveler identity, passport numbers or their schedule.
    return NextResponse.json({ error: "Unable to prepare the PDF. Please try again." }, { status: 500 });
  }
}
