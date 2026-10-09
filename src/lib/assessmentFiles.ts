import { extractDocumentText, MAX_FILE_BYTES, ScannedPdfError } from "@/lib/documentText";
import { MAX_ASSESSMENT_CHARS, MAX_ASSESSMENT_DOCUMENTS, type AssessmentDocument } from "@/lib/consularReview";
import type { OcrResult } from "@/lib/documentOcr";

export class AssessmentAccessError extends Error {}
class AssessmentTimeoutError extends Error {}

// File selection checks metadata only. Reading begins after the Proofread click.
export function validateAssessmentFiles(files: File[]) {
  if (!files.length) throw new Error("Select your documents before clicking Proofread.");
  if (files.length > MAX_ASSESSMENT_DOCUMENTS || files.reduce((sum, file) => sum + file.size, 0) > 30 * 1024 * 1024) throw new Error("Choose up to 6 documents, with a combined file size of 30MB or less.");
  for (const file of files) {
    if (!/\.(pdf|docx|txt)$/i.test(file.name)) throw new Error(`${file.name}: Choose a PDF, DOCX or TXT file.`);
    if (!file.size) throw new Error(`${file.name}: That file is empty.`);
    if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name}: That file is over the 10MB limit.`);
  }
}

export async function readAssessmentFiles(files: File[], signal: AbortSignal): Promise<AssessmentDocument[]> {
  validateAssessmentFiles(files);
  const documents: AssessmentDocument[] = [];
  let characters = 0;
  for (const [index, file] of files.entries()) {
    signal.throwIfAborted();
    let text: string;
    let scan: OcrResult | undefined;
    try {
      try { text = await extractDocumentText(file, { maxChars: MAX_ASSESSMENT_CHARS, preservePages: true, checkImages: true }); }
      catch (error) {
        if (!(error instanceof ScannedPdfError)) throw error;
        signal.throwIfAborted();
        const response = await fetch("/api/document-ocr", { method: "POST", headers: { "Content-Type": "application/pdf" }, body: file, signal });
        const data = await response.json() as OcrResult & { error?: string; code?: string };
        if (response.status === 402) throw new AssessmentAccessError("Payment is required or your session has expired.");
        if (data.code === "review_timeout") throw new AssessmentTimeoutError("Session timeout, please retry");
        if (!response.ok) throw new Error(data.error ?? "Unable to read this scanned PDF. Please retry.");
        if (typeof data.text !== "string" || !data.text.trim() || !Array.isArray(data.notes) || data.notes.some(note => typeof note !== "string")) throw new Error("The scan reader returned incomplete text. Please retry.");
        scan = data;
        text = data.text;
      }
    } catch (error) {
      signal.throwIfAborted();
      if (error instanceof AssessmentAccessError || error instanceof AssessmentTimeoutError) throw error;
      throw new Error(`${file.name}: ${error instanceof Error ? error.message : "Unable to read this file."}`, { cause: error });
    }
    signal.throwIfAborted();
    characters += text.length;
    if (characters > MAX_ASSESSMENT_CHARS) throw new Error(`Please supply at most ${MAX_ASSESSMENT_CHARS.toLocaleString()} characters across all documents.`);
    documents.push({ id: `document-${index + 1}`, name: file.name.slice(0, 200), text, ...(scan ? { extraction: "ocr" as const, ocrNotes: scan.notes } : {}) });
  }
  return documents;
}
