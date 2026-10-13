import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, setCharacterSpacing, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import { cvTemplate, type CvDocumentContent, type CvEntry, type CvTemplateId } from "./cvTemplates";

export async function createApplicationDocumentPdf({ kind, name, text, fontBytes, boldFontBytes, title = kind, paperSize = "A4", content, template = "classic" }: {
  kind: "CV" | "Cover Letter";
  name: string;
  text: string;
  fontBytes: Uint8Array;
  boldFontBytes?: Uint8Array;
  title?: string;
  paperSize?: "A4" | "Letter";
  content?: CvDocumentContent;
  template?: CvTemplateId;
}) {
  if (!text.trim()) throw new Error("Build your document before downloading it.");
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  const font = await document.embedFont(fontBytes, { subset: true });
  document.setTitle(`${title} — ${name}`);
  document.setAuthor(name);
  const [width, height] = paperSize === "Letter" ? [612, 792] : [595.28, 841.89];
  if (kind === "CV" && content) {
    const bold = boldFontBytes ? await document.embedFont(boldFontBytes, { subset: true }) : font;
    renderCv(document, font, bold, content, template, title, width, height);
    return document.save();
  }
  const margin = 48, bodyWidth = width - margin * 2;
  const ink = rgb(0.08, 0.12, 0.17), muted = rgb(0.38, 0.42, 0.47);
  const size = 11, lineHeight = 17;
  const supported = new Set(font.getCharacterSet());
  const printable = (value: string) => Array.from(value, character => supported.has(character.codePointAt(0)!) ? character : `[U+${character.codePointAt(0)!.toString(16).toUpperCase()}]`).join("");
  // Letters follow business-letter layout, so only other documents carry a title banner.
  const letter = kind === "Cover Letter", top = letter ? height - 60 : height - 96;
  const addPage = () => {
    const page = document.addPage([width, height]);
    if (letter) return page;
    page.drawText(title, { x: margin, y: height - 53, font, size: 20, color: ink });
    page.drawLine({ start: { x: margin, y: height - 68 }, end: { x: width - margin, y: height - 68 }, thickness: 0.8, color: rgb(0.8, 0.83, 0.85) });
    return page;
  };
  let page = addPage(), y = top;
  const drawLine = (line: string) => {
    if (y < 65) { page = addPage(); y = top; }
    if (line) page.drawText(line, { x: margin, y, font, size, color: ink });
    y -= lineHeight;
  };
  for (const paragraph of text.replace(/\t/g, "    ").split(/\r\n|\r|\n/)) {
    let line = "";
    for (const word of printable(paragraph).split(/\s+/u)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= bodyWidth) { line = next; continue; }
      if (line) drawLine(line);
      line = "";
      for (const character of word) {
        if (font.widthOfTextAtSize(line + character, size) > bodyWidth) { drawLine(line); line = ""; }
        line += character;
      }
    }
    drawLine(line);
  }
  const pages = document.getPages();
  if (pages.length > 1) pages.forEach((page, index) => page.drawText(`Page ${index + 1} of ${pages.length}`, { x: margin, y: 32, font, size: 9, color: muted }));
  return document.save();
}

const bulletPattern = /^[•\-*–]\s+/;

function renderCv(document: PDFDocument, font: PDFFont, bold: PDFFont, content: CvDocumentContent, templateId: CvTemplateId, title: string, width: number, height: number) {
  const style = cvTemplate(templateId);
  document.setSubject(`CV template: ${style.name}`);
  const { margin, bodySize, lineHeight } = style;
  const right = width - margin, bodyWidth = right - margin;
  const bottom = 58;
  const ink = rgb(0.12, 0.14, 0.17), muted = rgb(0.37, 0.4, 0.44), soft = rgb(0.27, 0.3, 0.34), white = rgb(1, 1, 1);
  const colour = style.accent.slice(1).match(/.{2}/g)!.map(value => parseInt(value, 16) / 255);
  const accent = rgb(colour[0], colour[1], colour[2]);
  const headingColour = style.headingMuted ? rgb(0.42, 0.45, 0.49) : accent;
  const banner = style.id === "executive", centred = style.alignment === "center";
  const supported = new Set(font.getCharacterSet());
  const printable = (text: string) => Array.from(text, character => supported.has(character.codePointAt(0)!) ? character : `[U+${character.codePointAt(0)!.toString(16).toUpperCase()}]`).join("");
  function wrap(text: string, face: PDFFont, size: number, maxWidth = bodyWidth): string[] {
    const result: string[] = [];
    for (const paragraph of text.replace(/\t/g, "    ").split(/\r\n|\r|\n/)) {
      let line = "";
      for (const word of printable(paragraph).split(/\s+/u)) {
        const next = line ? `${line} ${word}` : word;
        if (face.widthOfTextAtSize(next, size) <= maxWidth) { line = next; continue; }
        if (line) result.push(line);
        line = "";
        for (const character of word) {
          if (face.widthOfTextAtSize(line + character, size) > maxWidth) { result.push(line); line = ""; }
          line += character;
        }
      }
      result.push(line);
    }
    return result;
  }
  let page: PDFPage = document.addPage([width, height]);
  let y = height - margin;
  /** Draws one line with its baseline `size` below `y`; `tracking` adds letter spacing. */
  function text(line: string, x: number, face: PDFFont, size: number, color: RGB, tracking = 0) {
    if (!line) return;
    if (tracking) page.pushOperators(setCharacterSpacing(tracking));
    page.drawText(line, { x, y: y - size, font: face, size, color });
    if (tracking) page.pushOperators(setCharacterSpacing(0));
  }
  const aligned = (line: string, face: PDFFont, size: number) => centred ? (width - face.widthOfTextAtSize(line, size)) / 2 : margin;
  function decoratePage() {
    if (style.id === "modern") page.drawRectangle({ x: 24, y: bottom - 9, width: 4, height: height - margin - bottom + 9, color: accent });
  }
  decoratePage();
  function nextPage() {
    page = document.addPage([width, height]);
    y = height - margin;
    decoratePage();
    for (const line of wrap(content.name, bold, 11)) { text(line, margin, bold, 11, accent); y -= 15; }
    page.drawLine({ start: { x: margin, y: y - 5 }, end: { x: right, y: y - 5 }, thickness: 0.6, color: rgb(0.78, 0.8, 0.82) });
    y -= 24;
  }
  function ensure(space: number) { if (y - space < bottom) nextPage(); }

  // Header: name, headline and contact details. Executive places all three in a banner.
  const nameLines = wrap(content.name, bold, style.nameSize);
  const headlineSize = 12.5, contactSize = 9.5;
  const headlineLines = content.headline ? wrap(content.headline.value, font, headlineSize) : [];
  const contactLines = content.contact.flatMap(contact => wrap(contact, font, contactSize));
  if (banner) {
    const bannerHeight = 30 + nameLines.length * (style.nameSize + 5) + headlineLines.length * 17 + 6 + contactLines.length * 14 + 20;
    page.drawRectangle({ x: 0, y: height - bannerHeight, width, height: bannerHeight, color: accent });
    y = height - 30;
  }
  for (const line of nameLines) {
    ensure(style.nameSize + 5);
    text(line, aligned(line, bold, style.nameSize), bold, style.nameSize, banner ? white : style.nameInk ? ink : accent);
    y -= style.nameSize + 5;
  }
  if (headlineLines.length) y -= 2;
  for (const line of headlineLines) {
    text(line, aligned(line, font, headlineSize), font, headlineSize, banner ? rgb(0.86, 0.9, 0.95) : style.id === "modern" ? soft : accent);
    y -= 17;
  }
  y -= 6;
  for (const line of contactLines) {
    ensure(14);
    text(line, aligned(line, font, contactSize), font, contactSize, banner ? rgb(0.8, 0.85, 0.9) : muted);
    y -= 14;
  }
  y -= banner ? 20 : 6;
  if (style.id === "scholarly") {
    page.drawLine({ start: { x: margin, y }, end: { x: right, y }, thickness: 0.8, color: accent });
    y -= 4;
  }

  function paragraphLine(raw: string, size: number, color: RGB, indent = 0) {
    const bullet = bulletPattern.test(raw);
    const body = raw.replace(bulletPattern, "");
    const offset = indent + (bullet ? 11 : 0);
    for (const [index, line] of wrap(body, font, size, bodyWidth - offset).entries()) {
      ensure(lineHeight);
      if (bullet && index === 0) text("•", margin + indent + 1, font, size, accent);
      text(line, margin + offset, font, size, color);
      y -= lineHeight;
    }
  }
  function renderEntry(entry: CvEntry) {
    const titleSize = bodySize + 0.5, dateSize = bodySize - 0.5;
    const dateWidth = font.widthOfTextAtSize(printable(entry.dates), dateSize);
    const titleLines = wrap(entry.title, bold, titleSize, bodyWidth - dateWidth - 14);
    ensure(titleLines.length * (lineHeight + 1) + 2 * lineHeight);
    for (const [index, line] of titleLines.entries()) {
      text(line, margin, bold, titleSize, ink);
      if (index === 0) text(printable(entry.dates), right - dateWidth, font, dateSize, style.id === "modern" ? accent : muted);
      y -= lineHeight + 1;
    }
    for (const line of wrap([entry.organisation, entry.location].filter(Boolean).join(" · "), font, bodySize)) {
      ensure(lineHeight);
      text(line, margin, font, bodySize, style.id === "minimal" ? muted : accent);
      y -= lineHeight;
    }
    for (const note of entry.notes) paragraphLine(note, bodySize - 0.5, soft);
    const details = entry.details.split(/\r\n|\r|\n/).map(line => line.trim()).filter(Boolean);
    // Several lines of achievements read as a list even when typed without bullet characters.
    const asList = details.length > 1;
    if (details.length) y -= 2;
    for (const line of details) paragraphLine(asList && !bulletPattern.test(line) ? `• ${line}` : line, bodySize, ink);
  }

  for (const section of content.sections) {
    const headingSize = style.id === "minimal" ? 9.5 : 11;
    const headingLines = wrap(section.heading, bold, headingSize, bodyWidth - section.heading.length * style.headingTracking);
    const ruleSpace = style.heading === "plain" ? 7 : 12;
    ensure(style.sectionGap + headingLines.length * 15 + ruleSpace + 2 * lineHeight);
    y -= style.sectionGap;
    for (const line of headingLines) { text(line, margin, bold, headingSize, headingColour, style.headingTracking); y -= 15; }
    if (style.heading !== "plain") {
      const endX = style.heading === "accent" ? margin + 34 : right;
      page.drawLine({ start: { x: margin, y: y - 2 }, end: { x: endX, y: y - 2 }, thickness: style.heading === "accent" ? 2 : banner ? 1.1 : 0.7, color: accent });
      if (style.heading === "double-rule") page.drawLine({ start: { x: margin, y: y - 5 }, end: { x: endX, y: y - 5 }, thickness: 0.3, color: accent });
    }
    y -= ruleSpace;
    if (section.entries?.length) {
      section.entries.forEach((entry, index) => { if (index) y -= 8; renderEntry(entry); });
    } else if (section.list) {
      for (const line of wrap(section.body.split("\n").map(item => item.trim()).filter(Boolean).join("  ·  "), font, bodySize)) {
        ensure(lineHeight);
        text(line, margin, font, bodySize, ink);
        y -= lineHeight;
      }
    } else {
      for (const raw of section.body.split(/\r\n|\r|\n/)) {
        if (!raw.trim()) { y -= lineHeight / 2; continue; }
        paragraphLine(raw, bodySize, ink);
      }
    }
  }
  // Page numbers only when there is more than one page; the template name is never printed on the CV.
  const pages = document.getPages();
  if (pages.length > 1) pages.forEach((page, index) => page.drawText(`Page ${index + 1} of ${pages.length}`, { x: margin, y: 30, font, size: 8, color: muted }));
}
