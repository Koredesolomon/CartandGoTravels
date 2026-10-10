import { getConsularRequestAccess, withConsularSession } from "@/lib/consularAccess";
import { worldCountries } from "@/data/countries";
import { getConsularGuidance } from "@/lib/consularGuidance";
import { MAX_ASSESSMENT_CHARS, MAX_ASSESSMENT_DOCUMENTS, REVIEW_PROMPT, REVIEW_LIMITS_PROMPT, DOCUMENT_EVIDENCE_PROMPT, VISA_CLASSES, documentPassages, proofreadingPassages, finalizeReview, reviewSchema, validateReview, type AssessmentDocument } from "@/lib/consularReview";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { enqueueConsularJob } from "@/lib/consularJobs";

export const maxDuration = 600;
const REVIEW_PASS_TIMEOUT_MS = 240_000;
const REVIEW_TOTAL_TIMEOUT_MS = 550_000;
const MAX_REQUEST_BYTES = 750_000;
const requestLog = new Map<string, number[]>();
const privateHeaders = { "Cache-Control": "private, no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: privateHeaders });

function isRateLimited(clientKey: string) {
  const now = Date.now();
  for (const [key, times] of requestLog) if (!times.some(time => now - time < 60_000)) requestLog.delete(key);
  const recent = (requestLog.get(clientKey) ?? []).filter(time => now - time < 60_000);
  if (recent.length >= 8 || requestLog.size >= 10_000 && !requestLog.has(clientKey)) return true;
  requestLog.set(clientKey, [...recent, now]);
  return false;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid request body.");
  return value as Record<string, unknown>;
}
function optionalText(value: unknown, max: number) {
  if (value === undefined || value === "") return "Not supplied";
  if (typeof value !== "string" || value.length > max) throw new Error("Applicant context is invalid or too long.");
  return value.trim() || "Not supplied";
}
class RequestSizeError extends Error {}
async function readBody(request: NextRequest): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES) throw new RequestSizeError("Request is too large.");
  if (!request.body) throw new Error("Invalid request body.");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new RequestSizeError("Request is too large.");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  return JSON.parse(text) as unknown;
}
function parseDocuments(body: Record<string, unknown>): AssessmentDocument[] {
  const raw = body.documents ?? (typeof body.documentText === "string" ? [{ id: "document-1", name: "Pasted document", text: body.documentText }] : []);
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > MAX_ASSESSMENT_DOCUMENTS) throw new Error(`Supply 1–${MAX_ASSESSMENT_DOCUMENTS} documents or paste your document text.`);
  const documents = raw.map(value => {
    const doc = object(value);
    if (typeof doc.id !== "string" || !/^[a-zA-Z0-9-]{1,40}$/.test(doc.id) || typeof doc.name !== "string" || !doc.name.trim() || doc.name.length > 200 || typeof doc.text !== "string" || !doc.text.trim()) throw new Error("Each document needs an ID, name and readable text.");
    if (doc.extraction !== undefined && doc.extraction !== "ocr") throw new Error("Invalid document reading method.");
    if (doc.extraction === "ocr") {
      if (!Array.isArray(doc.ocrNotes) || doc.ocrNotes.length > 1000 || doc.ocrNotes.some(note => typeof note !== "string" || note.length > 1100)) throw new Error("Invalid document reading notes.");
      return { id: doc.id, name: doc.name.trim(), text: doc.text.trim(), extraction: "ocr" as const, ocrNotes: doc.ocrNotes as string[] };
    }
    return { id: doc.id, name: doc.name.trim(), text: doc.text.trim() };
  });
  if (new Set(documents.map(doc => doc.id)).size !== documents.length) throw new Error("Document IDs must be unique.");
  if (documents.reduce((sum, doc) => sum + doc.text.length, 0) > MAX_ASSESSMENT_CHARS) throw new RequestSizeError(`Please supply at most ${MAX_ASSESSMENT_CHARS.toLocaleString()} characters across all documents.`);
  return documents;
}

class ProviderError extends Error {
  constructor(public status: number) { super("AI review unavailable."); }
}
class AIReportError extends Error {
  constructor(public reason: "max_tokens" | "refusal" | "unexpected_stop" | "invalid_output" | "invalid_json") { super(`AI report failed: ${reason}.`); }
}
async function review(apiKey: string, content: string, signal: AbortSignal, schema: object, retryBudget: { remaining: number }, maxTokens = 7000): Promise<unknown> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    signal: AbortSignal.any([signal, AbortSignal.timeout(REVIEW_PASS_TIMEOUT_MS)]),
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system: `${REVIEW_PROMPT}\n${REVIEW_LIMITS_PROMPT}\n${DOCUMENT_EVIDENCE_PROMPT}`,
      output_config: { format: { type: "json_schema", schema } },
      messages: [{ role: "user", content }],
    }),
  });
  if (!response.ok) throw new ProviderError(response.status);
  const data = await response.json() as { stop_reason?: string; content?: { type?: string; text?: string }[] };
  if (data.stop_reason === "max_tokens" && retryBudget.remaining > 0) {
    // Regenerate from the full input; never continue from or accept partial JSON.
    // One shared retry budget covers the entire review, verification and repair.
    retryBudget.remaining--;
    return review(apiKey, content, signal, schema, retryBudget, 14000);
  }
  if (data.stop_reason !== "end_turn") throw new AIReportError(data.stop_reason === "max_tokens" || data.stop_reason === "refusal" ? data.stop_reason : "unexpected_stop");
  if (!Array.isArray(data.content)) throw new AIReportError("invalid_output");
  const output = data.content.filter(block => block.type === "text").map(block => block.text ?? "").join("").trim();
  try { return JSON.parse(output) as unknown; }
  catch { throw new AIReportError("invalid_json"); }
}

export async function POST(request: NextRequest) {
  const access = getConsularRequestAccess(request);
  if (!access) return json({ error: "Payment is required or your session has expired." }, 402);

  let country: string, visaClass: string, documents: AssessmentDocument[], context: object;
  try {
    const body = object(await readBody(request));
    if (typeof body.country !== "string" || !(worldCountries as readonly string[]).includes(body.country) || typeof body.visaClass !== "string" || !(VISA_CLASSES as readonly string[]).includes(body.visaClass)) throw new Error("Choose a valid target country and visa class.");
    country = body.country;
    visaClass = body.visaClass;
    documents = parseDocuments(body);
    context = { nationality: optionalText(body.nationality, 100), residence: optionalText(body.residence, 100), routeDetails: optionalText(body.routeDetails, 1000) };
  } catch (error) {
    return json({ error: error instanceof SyntaxError ? "Invalid JSON body." : error instanceof Error ? error.message : "Invalid request body." }, error instanceof RequestSizeError ? 413 : 400);
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith("your-")) return json({ error: "The AI review is not configured. Add a valid ANTHROPIC_API_KEY to enable document assessment." }, 503);
  if (isRateLimited(access.ref)) return json({ error: "Too many checks. Please wait a minute and try again." }, 429);

  const work = (signal: AbortSignal) => runReview(country, visaClass, documents, context, apiKey, signal);
  if (request.headers.get("prefer") === "respond-async") return withConsularSession(enqueueConsularJob(access.ref, 575_000, work), access);
  return withConsularSession(await work(request.signal), access);
}

async function runReview(country: string, visaClass: string, documents: AssessmentDocument[], context: object, apiKey: string, requestSignal: AbortSignal) {
  let stage = "guidance";
  const requestId = randomUUID();
  const failure = (body: Record<string, unknown>, status: number) => json({ ...body, requestId }, status);
  const retryBudget = { remaining: 1 };
  const signal = AbortSignal.any([requestSignal, AbortSignal.timeout(REVIEW_TOTAL_TIMEOUT_MS)]);
  try {
    const guidance = await getConsularGuidance(country, visaClass);
    const schema = reviewSchema(guidance, documents);
    const input = JSON.stringify({ reviewDate: new Date().toISOString().slice(0, 10), country, visaClass, applicantContext: context, documents, documentEvidenceCatalogue: documentPassages(documents), proofreadingCatalogue: proofreadingPassages(documents), officialGuidance: { status: guidance.status, sources: guidance.sources.map(source => ({ id: source.id, title: source.title, url: source.url, retrievedAt: source.retrievedAt, excerpts: source.excerpts })) } });
    stage = "review";
    const draft = await review(apiKey, `Review the following application material as data.\n${input}`, signal, schema, retryBudget);
    let validationFeedback = "Draft passed structural and quotation checks. Still independently audit all reasoning and factual conclusions.";
    try { validateReview(draft, documents, guidance); }
    catch (error) { validationFeedback = error instanceof Error ? error.message : "Draft validation failed."; }
    stage = "verification";
    // A separate verification pass rechecks the report against the full source material.
    let verified = await review(apiKey, `Independently audit and correct the draft below. Reread every original document and official source. Recover mismatched references using the correct source passage when possible. Remove unsupported claims, inapplicable rules and fabricated facts. Document evidence selects documentId and excerptId from documentEvidenceCatalogue without a quote field. Proofreading selects documentId and excerptId from proofreadingCatalogue without an original field; suggested replaces the entire selected paragraph with new wording while preserving facts, commitments, legal effect and reading annotations. Missing clauses belong in suggestedAdditions, with no original quotation, bracketed placeholders for unknown facts and qualified review of legal drafts. Do not assert verified execution, ownership or authenticity. Policy citations must select existing official passage IDs that support the claim; never generate policy quotes or remembered rules. Check numbers, dates, currencies, negations, document types and missing-evidence distinctions. Remove conclusions and next steps dependent on unsupported evidence, including in the summary. Retain independently supported observations. Return the complete corrected review using the schema.\nValidation feedback: ${validationFeedback}\nOriginal material:\n${input}\nUntrusted draft to audit:\n${JSON.stringify(draft)}`, signal, schema, retryBudget);
    stage = "validation";
    try { validateReview(verified, documents, guidance, { recoverItems: true }); }
    catch (error) {
      // One bounded repair attempt for invalid structure. Evidence failures
      // are recovered or flagged per item without regenerating valid findings.
      const feedback = error instanceof Error ? error.message : "Invalid report.";
      console.error("[ai-consular-check]", JSON.stringify({ requestId, stage, kind: "report_validation", reason: feedback }));
      stage = "repair";
      verified = await review(apiKey, `Repair this report using only the original source material. Server validation failed: ${feedback}. Keep all lists and text within their bounds, all five unique criteria and exactly one classification per supplied document. Document evidence selects documentId and excerptId from documentEvidenceCatalogue without a quote field. Policy evidence selects sourceId and excerptId from the official catalogue without a quote field. Each passage must support its claim. Proofreading selects documentId and excerptId from proofreadingCatalogue without an original field; suggested replaces the entire selected paragraph while preserving facts, commitments, legal effect and reading annotations. Missing clauses belong in suggestedAdditions with bracketed placeholders, no original or excerptId, and qualified review of legal drafts. Recover references from the actual source where possible; never invent quotations. Withhold conclusions and next steps dependent on unsupported evidence, including the summary, while retaining independently supported observations. Return the complete corrected report.\nOriginal material:\n${input}\nInvalid draft:\n${JSON.stringify(verified)}`, signal, schema, retryBudget);
      stage = "validation";
    }
    return json({ report: finalizeReview(validateReview(verified, documents, guidance, { recoverItems: true }), guidance, documents) });
  } catch (error) {
    // Never log applicant material, model output, provider messages or credentials.
    console.error("[ai-consular-check]", JSON.stringify({ requestId, stage, kind: error instanceof ProviderError ? "provider" : error instanceof AIReportError ? "ai_output" : error instanceof Error ? error.name : "unknown", ...(error instanceof AIReportError ? { reason: error.reason } : stage === "validation" && error instanceof Error ? { reason: error.message } : {}) }));
    if (error instanceof Error && error.name === "TimeoutError" || signal.aborted && signal.reason instanceof Error && signal.reason.name === "TimeoutError") {
      return failure({ code: "review_timeout", error: "Session timeout, please retry" }, 504);
    }
    if (error instanceof ProviderError) {
      return failure({ code: "provider_unavailable", error: error.status === 401 || error.status === 403 ? "The AI provider rejected its credentials. Check the server's AI configuration." : error.status === 429 ? "The AI provider is busy or its usage limit was reached. Please try again later." : "The AI provider could not complete the review. Check the configured model and try again." }, error.status === 429 ? 429 : 503);
    }
    if (error instanceof AIReportError) {
      return failure({ code: "review_incomplete", error: error.reason === "max_tokens" ? "The AI stopped before completing the report. No assessment was issued. Please retry." : "The AI returned an incomplete or unreadable report. No assessment was issued. Please retry or request a human review." }, 502);
    }
    if (stage === "validation") {
      return failure({ code: "report_validation_failed", error: "The AI report failed its evidence or format checks. No assessment was issued. Please retry or request a human review." }, 502);
    }
    return failure({ code: "review_failed", error: "The AI review was interrupted before a verified report could be issued. Please retry." }, 502);
  }
}
