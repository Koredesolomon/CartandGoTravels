import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { provisionalNote, readinessBand, scoreWithheldMessage, SCORE_METHOD_NOTE } from "@/lib/consularReadiness";
import { CRITERIA, LEGAL_ADDITION_NOTICE, LEGAL_CORRECTION_NOTICE, verificationIssueMessage, type ConsularReport } from "@/lib/consularReview";

const statusLabels = { supported: "Supported by supplied evidence", partial: "Partially supported", missing: "Evidence not supplied", not_applicable: "Not applicable to this route", not_assessable: "Cannot assess yet" } as const;
const issueLabels = { document: "Document", criterion: "Assessment", finding: "Finding", correction: "Correction", addition: "Addition", assessment: "Overall review" } as const;

const hex = (value: string) => rgb(parseInt(value.slice(1, 3), 16) / 255, parseInt(value.slice(3, 5), 16) / 255, parseInt(value.slice(5, 7), 16) / 255);
const INK = hex("#07141a"), MUTED = hex("#5b6870"), ACCENT = hex("#0098ba"), GOLD = hex("#c47a12"), RULE = hex("#d7dfe5"), WARN = hex("#93670f");

// Builds the report entirely in the browser from the in-memory report, so applicant
// text is never sent to a server to produce the download.
export async function createConsularReportPdf({ report, country, visaClass, documentNames, fontBytes, boldFontBytes }: {
  report: ConsularReport;
  country: string;
  visaClass: string;
  documentNames: Record<string, string>;
  fontBytes: Uint8Array;
  boldFontBytes: Uint8Array;
}) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const bold = await pdf.embedFont(boldFontBytes, { subset: true });
  pdf.setTitle(`Document pre-assessment report — ${country}, ${visaClass}`);
  pdf.setAuthor("CartandGo Travels");
  pdf.setCreator("CartandGo Travels");

  const width = 595.28, height = 841.89, margin = 48, bodyWidth = width - margin * 2, top = height - 70, bottom = 60;
  const supported = new Set([...font.getCharacterSet(), ...bold.getCharacterSet()]);
  const printable = (value: string) => Array.from(value.replace(/\t/g, "    "), character => supported.has(character.codePointAt(0)!) || character === "\n" ? character : "?").join("");

  let page: PDFPage = pdf.addPage([width, height]);
  let y = top;
  const newPage = () => { page = pdf.addPage([width, height]); y = top; };
  const ensure = (space: number) => { if (y - space < bottom) newPage(); };

  function wrap(text: string, face: PDFFont, size: number, maxWidth: number): string[] {
    const lines: string[] = [];
    for (const paragraph of printable(text).split(/\r\n|\r|\n/)) {
      let line = "";
      for (const word of paragraph.split(/\s+/u).filter(Boolean)) {
        const next = line ? `${line} ${word}` : word;
        if (face.widthOfTextAtSize(next, size) <= maxWidth) { line = next; continue; }
        if (line) lines.push(line);
        line = "";
        for (const character of word) {
          if (face.widthOfTextAtSize(line + character, size) > maxWidth) { lines.push(line); line = ""; }
          line += character;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  function paragraph(text: string, { face = font, size = 10, color = INK, indent = 0, gap = 4 }: { face?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; indent?: number; gap?: number } = {}) {
    const leading = size * 1.5;
    for (const line of wrap(text, face, size, bodyWidth - indent)) {
      ensure(leading);
      if (line) page.drawText(line, { x: margin + indent, y: y - size, font: face, size, color });
      y -= leading;
    }
    y -= gap;
  }

  function bullets(items: string[]) {
    for (const item of items) {
      const lines = wrap(item, font, 10, bodyWidth - 14);
      ensure(15);
      page.drawText("•", { x: margin + 2, y: y - 10, font, size: 10, color: ACCENT });
      lines.forEach((line, index) => {
        if (index) ensure(15);
        if (line) page.drawText(line, { x: margin + 14, y: y - 10, font, size: 10, color: INK });
        y -= 15;
      });
      y -= 2;
    }
    y -= 2;
  }

  function heading(text: string) {
    ensure(50);
    y -= 12;
    page.drawText(printable(text).toUpperCase(), { x: margin, y: y - 11, font: bold, size: 10.5, color: GOLD });
    y -= 17;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.6, color: RULE });
    y -= 8;
  }

  function quote(label: string, text: string) {
    paragraph(label, { face: bold, size: 9, color: MUTED, indent: 12, gap: 0 });
    const lines = wrap(`“${text}”`, font, 9, bodyWidth - 22);
    const start = y;
    for (const line of lines) {
      ensure(13.5);
      if (line) page.drawText(line, { x: margin + 14, y: y - 9, font, size: 9, color: MUTED });
      y -= 13.5;
    }
    page.drawLine({ start: { x: margin + 8, y: start }, end: { x: margin + 8, y }, thickness: 1.4, color: ACCENT });
    y -= 5;
  }

  const evidence = (items: ConsularReport["criteria"][number]["evidence"], policy: ConsularReport["criteria"][number]["policyEvidence"]) => {
    for (const item of items) quote(documentNames[item.documentId] ?? item.documentId, item.quote);
    for (const item of policy) {
      const source = report.guidance.sources.find(entry => entry.id === item.sourceId);
      if (source) quote(`Official guidance: ${source.title}`, item.quote);
    }
  };

  // Title block
  page.drawText("CartandGo Travels", { x: margin, y: y - 10, font: bold, size: 10, color: ACCENT });
  y -= 24;
  for (const line of wrap("Document pre-assessment report", bold, 22, bodyWidth)) { page.drawText(line, { x: margin, y: y - 22, font: bold, size: 22, color: INK }); y -= 28; }
  paragraph(`Target: ${country}   |   Visa class: ${visaClass}   |   Reviewed: ${new Date(report.reviewedAt).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })} (Lagos)`, { size: 9, color: MUTED, gap: 8 });

  // Readiness
  ensure(110);
  const estimated = report.score === null && report.provisionalScore != null;
  if (!estimated) paragraph(report.statusLabel, { face: bold, size: 12, indent: 0, gap: 6 });
  const shown = report.score ?? report.provisionalScore ?? null;
  if (shown !== null) {
    const provisional = report.score === null;
    const percent = Math.max(0, Math.min(100, Math.round(shown)));
    const band = readinessBand(percent);
    ensure(70);
    page.drawText(`${percent}%`, { x: margin, y: y - 34, font: bold, size: 38, color: hex(band.color) });
    const label = `${band.label} · ${report.provisionalBasis === "unverified" && provisional ? "estimated, unverified " : provisional ? "provisional " : ""}document readiness`;
    page.drawText(printable(label), { x: margin + bold.widthOfTextAtSize(`${percent}%`, 38) + 14, y: y - 30, font: bold, size: 11, color: hex(band.color) });
    y -= 46;
    page.drawRectangle({ x: margin, y: y - 8, width: bodyWidth, height: 8, color: hex("#e6ecef") });
    page.drawRectangle({ x: margin, y: y - 8, width: Math.max(2, bodyWidth * percent / 100), height: 8, color: hex(band.color) });
    y -= 20;
    paragraph(provisional ? provisionalNote(report.provisionalCoverage ?? 0, report.provisionalBasis) : SCORE_METHOD_NOTE, { size: 8.5, color: provisional ? WARN : MUTED, gap: 6 });
  } else {
    paragraph(scoreWithheldMessage(report.reviewStatus), { size: 10, color: WARN, gap: 6 });
  }

  heading("Summary");
  paragraph(report.summary);

  heading("Documents reviewed");
  for (const doc of report.documents) {
    paragraph(`${documentNames[doc.id] ?? doc.id} — ${doc.kind}`, { face: bold, gap: 0 });
    paragraph(doc.relevance.charAt(0).toUpperCase() + doc.relevance.slice(1), { size: 9, color: ACCENT, gap: 0 });
    paragraph(doc.explanation, { size: 9.5, color: MUTED, gap: 8 });
  }

  heading("Evidence assessment");
  for (const item of report.criteria) {
    paragraph(CRITERIA[item.key].label, { face: bold, gap: 0 });
    paragraph(statusLabels[item.status], { size: 9, color: ACCENT, gap: 2 });
    paragraph(item.reason, { size: 9.5, color: MUTED, gap: 4 });
    evidence(item.evidence, item.policyEvidence);
    y -= 4;
  }

  heading("Findings");
  if (!report.findings.length) paragraph("No specific findings were returned within the reviewed material.", { color: MUTED });
  for (const item of report.findings) {
    const tag = item.type === "risk" ? "RISK" : item.type === "weak" ? "WEAK" : "STRONG";
    paragraph(`[${tag}] ${item.title}`, { face: bold, color: item.type === "risk" ? hex("#b5473b") : item.type === "weak" ? WARN : ACCENT, gap: 0 });
    paragraph(item.body, { size: 9.5, color: MUTED, gap: 4 });
    evidence(item.evidence, item.policyEvidence);
    y -= 4;
  }

  heading("Proofreading corrections");
  if (!report.proofreading.length) paragraph("No verified wording corrections are available. This does not verify the document's factual claims.", { color: MUTED });
  for (const item of report.proofreading) {
    paragraph(documentNames[item.documentId] ?? item.documentId, { face: bold, gap: 2 });
    paragraph(`Original: ${item.original}`, { size: 9.5, color: MUTED, gap: 2 });
    paragraph(`Suggested: ${item.suggested}`, { size: 9.5, gap: 2 });
    paragraph(item.explanation, { size: 9.5, color: MUTED, gap: 2 });
    if (item.requiresLegalReview) paragraph(LEGAL_CORRECTION_NOTICE, { face: bold, size: 8.5, color: WARN, gap: 6 });
    y -= 4;
  }

  if (report.suggestedAdditions?.length) {
    heading("Suggested additions");
    paragraph("These are proposed new passages. Confirm the facts and complete any placeholders before using them.", { size: 9.5, color: MUTED });
    for (const item of report.suggestedAdditions) {
      paragraph(`${documentNames[item.documentId] ?? item.documentId} — ${item.title}`, { face: bold, gap: 2 });
      paragraph(`Suggested placement: ${item.insertionPoint}`, { size: 9.5, color: MUTED, gap: 2 });
      paragraph(`Proposed addition: ${item.proposedText}`, { size: 9.5, gap: 2 });
      paragraph(item.rationale, { size: 9.5, color: MUTED, gap: 2 });
      if (item.requiresLegalReview) paragraph(LEGAL_ADDITION_NOTICE, { face: bold, size: 8.5, color: WARN, gap: 6 });
      y -= 4;
    }
  }

  if (report.verificationIssues?.length) {
    heading("Items requiring review");
    for (const item of report.verificationIssues) {
      paragraph(`${item.documentId ? `${documentNames[item.documentId] ?? "Document"} — ` : ""}${issueLabels[item.item]}${item.index >= 0 ? ` ${item.index + 1}` : ""} withheld`, { face: bold, gap: 0 });
      paragraph(verificationIssueMessage(item.code), { size: 9.5, color: MUTED, gap: 6 });
    }
  }

  if (report.missingEvidence.length) { heading("Evidence not supplied"); bullets(report.missingEvidence); }
  if (report.questions.length) { heading("Questions to resolve"); bullets(report.questions); }
  heading("Next steps"); bullets(report.roadmap);

  heading("Official guidance used");
  paragraph(report.guidance.status === "available" ? "The linked official guidance was retrieved for this review. Local instructions and route-specific exceptions still need checking." : report.guidance.status === "unsupported" ? "Live official guidance is currently connected for Canada, the United Kingdom and the United States. This destination receives a limited text and evidence review." : "Current official guidance could not be fully retrieved. Requirements remain unverified.", { size: 9.5, color: MUTED });
  for (const source of report.guidance.sources) {
    paragraph(source.title, { face: bold, size: 9.5, gap: 0 });
    paragraph(`${source.url}  ·  Retrieved ${new Date(source.retrievedAt).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })} (Lagos)`, { size: 8.5, color: MUTED, gap: 4 });
  }

  heading("Review limits"); bullets(report.limitations);
  y -= 6;
  paragraph(report.disclaimer, { size: 9, color: WARN });

  // Footer on every page, once the page count is known.
  const pages = pdf.getPages();
  pages.forEach((entry, index) => {
    entry.drawLine({ start: { x: margin, y: 44 }, end: { x: width - margin, y: 44 }, thickness: 0.5, color: RULE });
    entry.drawText("CartandGo Travels · Document pre-assessment · Not legal advice or a visa decision", { x: margin, y: 30, font, size: 8, color: MUTED });
    const label = `Page ${index + 1} of ${pages.length}`;
    entry.drawText(label, { x: width - margin - font.widthOfTextAtSize(label, 8), y: 30, font, size: 8, color: MUTED });
  });

  return pdf.save();
}
