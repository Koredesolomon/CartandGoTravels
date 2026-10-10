import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { getConsularRequestAccess, withConsularSession } from "@/lib/consularAccess";
import { MAX_FILE_BYTES } from "@/lib/documentText";
import { OCR_PROMPT, OCR_SCHEMA, validateOcrResult } from "@/lib/documentOcr";
import { enqueueConsularJob } from "@/lib/consularJobs";

export const runtime = "nodejs";
export const maxDuration = 300;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const recentRequests = new Map<string, number[]>();
function isRateLimited(key: string) {
  const now = Date.now();
  for (const [ref, times] of recentRequests) if (!times.some(time => now - time < 60_000)) recentRequests.delete(ref);
  const recent = (recentRequests.get(key) ?? []).filter(time => now - time < 60_000);
  if (recent.length >= 8 || recentRequests.size >= 10_000 && !recentRequests.has(key)) return true;
  recentRequests.set(key, [...recent, now]);
  return false;
}
class InputError extends Error { constructor(message: string, public status = 400) { super(message); } }
async function readPdf(request: NextRequest) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/pdf")) throw new InputError("Choose a PDF for scanned document reading.");
  if (Number(request.headers.get("content-length")) > MAX_FILE_BYTES) throw new InputError("That PDF is over the 10MB limit.", 413);
  if (!request.body) throw new InputError("That PDF is empty.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_FILE_BYTES) { await reader.cancel(); throw new InputError("That PDF is over the 10MB limit.", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = Buffer.concat(chunks);
  if (!bytes.length) throw new InputError("That PDF is empty.");
  if (!bytes.subarray(0, 1024).includes(Buffer.from("%PDF-"))) throw new InputError("This file is not a valid PDF.");
  let pdf: PDFDocument;
  try { pdf = await PDFDocument.load(bytes, { updateMetadata: false }); }
  catch { throw new InputError("Unable to read this PDF. Upload a valid, unlocked copy."); }
  const pageCount = pdf.getPageCount();
  if (!pageCount || pageCount > 100) throw new InputError("Choose a PDF with 1–100 pages.");
  return { bytes, pageCount };
}
export async function POST(request: NextRequest) {
  const access = getConsularRequestAccess(request);
  if (!access) return json({ error: "Payment is required or your session has expired." }, 402);
  if (isRateLimited(access.ref)) return json({ error: "Too many scan requests. Please wait a minute and try again." }, 429);
  let input: Awaited<ReturnType<typeof readPdf>>;
  try { input = await readPdf(request); }
  catch (error) { return json({ error: error instanceof InputError ? error.message : "Unable to read this PDF." }, error instanceof InputError ? error.status : 400); }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith("your-")) return json({ error: "Scanned PDF reading needs a valid ANTHROPIC_API_KEY on the server." }, 503);
  if (request.headers.get("prefer") === "respond-async") return withConsularSession(enqueueConsularJob(access.ref, 280_000, signal => transcribe(input, apiKey, signal)), access);
  return withConsularSession(await transcribe(input, apiKey, request.signal), access);
}

async function transcribe(input: Awaited<ReturnType<typeof readPdf>>, apiKey: string, signal: AbortSignal) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal: AbortSignal.any([signal, AbortSignal.timeout(260_000)]),
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6", max_tokens: 24000,
        system: OCR_PROMPT, output_config: { format: { type: "json_schema", schema: OCR_SCHEMA } },
        messages: [{ role: "user", content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: input.bytes.toString("base64") } },
          { type: "text", text: `Transcribe all ${input.pageCount} physical pages in order. Preserve original wording and facts. Flag unclear text rather than guessing.` },
        ] }],
      }),
    });
    if (!response.ok) return json({ error: response.status === 429 ? "The document reader is busy. Please try again later." : response.status === 401 || response.status === 403 ? "The AI provider rejected its credentials. Check the server's AI configuration." : "The document reader could not process this PDF. Try a clearer or smaller PDF." }, response.status === 429 ? 429 : 503);
    const data = await response.json() as { stop_reason?: string; content?: { type?: string; text?: string }[] };
    if (data.stop_reason !== "end_turn" || !Array.isArray(data.content)) return json({ error: "Document reading was incomplete. No partial text was accepted. Please select fewer pages and retry." }, 502);
    const output = data.content.filter(block => block.type === "text").map(block => block.text ?? "").join("");
    try { return json(validateOcrResult(JSON.parse(output) as unknown, input.pageCount)); }
    catch (error) { return json({ error: error instanceof SyntaxError ? "The document reader returned invalid text. Please retry." : error instanceof Error ? error.message : "Document reading failed. Please retry." }, 422); }
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") return json({ code: "review_timeout", error: "Session timeout, please retry" }, 504);
    return json({ error: "Document reading could not finish. Please retry with a clearer or smaller PDF." }, 502);
  }
}
