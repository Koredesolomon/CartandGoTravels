import { PDFDocument } from "pdf-lib";
import { itineraryDocumentRequirements, MAX_SUPPORT_FILE_BYTES, MAX_SUPPORT_TOTAL_BYTES, type SupportingDocument } from "@/lib/itineraryDocumentRequirements";
import type { ItineraryPlan } from "@/lib/itinerary";

export async function validateSupportingDocuments(form: FormData, plan: ItineraryPlan): Promise<SupportingDocument[]> {
  const requirements = itineraryDocumentRequirements(plan);
  const expected = new Set(["itinerary", ...requirements.map((entry) => entry.key)]);
  for (const key of form.keys()) if (!expected.has(key)) throw new Error("Unexpected supporting document field.");
  const documents: SupportingDocument[] = [];
  let total = 0;
  for (const entry of requirements) {
    const values = form.getAll(entry.key);
    const file = values[0];
    if (values.length !== 1 || !(file instanceof File) || !file.size) throw new Error(`Upload ${entry.label.toLowerCase()} before downloading.`);
    if (file.size > MAX_SUPPORT_FILE_BYTES) throw new Error(`${entry.label}: use a file no larger than 5 MB.`);
    total += file.size;
    if (total > MAX_SUPPORT_TOTAL_BYTES) throw new Error("Keep supporting documents below 30 MB in total.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const lower = file.name.toLowerCase();
    let mimeType: SupportingDocument["mimeType"];
    if (lower.endsWith(".pdf") && Buffer.from(bytes.subarray(0, 5)).toString() === "%PDF-") {
      try { const pdf = await PDFDocument.load(bytes); if (!pdf.getPageCount() || pdf.getPageCount() > 150) throw new Error(); }
      catch { throw new Error(`${entry.label}: upload a readable, unlocked PDF with 1–150 pages.`); }
      mimeType = "application/pdf";
    } else if (/\.jpe?g$/.test(lower) && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      try { await (await PDFDocument.create()).embedJpg(bytes); } catch { throw new Error(`${entry.label}: this JPEG cannot be read.`); }
      mimeType = "image/jpeg";
    } else if (lower.endsWith(".png") && Buffer.from(bytes.subarray(0, 8)).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      try { await (await PDFDocument.create()).embedPng(bytes); } catch { throw new Error(`${entry.label}: this PNG cannot be read.`); }
      mimeType = "image/png";
    } else throw new Error(`${entry.label}: upload a PDF, JPG or PNG document.`);
    const filename = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-140) || "document";
    documents.push({ ...entry, filename: `${entry.key}-${filename}`, mimeType, bytes });
  }
  return documents;
}
