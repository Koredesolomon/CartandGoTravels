import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import { cvTemplate, type CvDocumentContent, type CvTemplateId } from "./cvTemplates";

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
  const addPage = () => {
    const page = document.addPage([width, height]);
    page.drawText(title, { x: margin, y: height - 53, font, size: 20, color: ink });
    page.drawLine({ start: { x: margin, y: height - 68 }, end: { x: width - margin, y: height - 68 }, thickness: 0.8, color: rgb(0.8, 0.83, 0.85) });
    return page;
  };
  let page = addPage(), y = height - 96;
  const drawLine = (line: string) => {
    if (y < 65) { page = addPage(); y = height - 96; }
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
  pages.forEach((page, index) => page.drawText(`Page ${index + 1} of ${pages.length}`, { x: margin, y: 32, font, size: 9, color: muted }));
  return document.save();
}

function renderCv(document: PDFDocument, font: PDFFont, bold: PDFFont, content: CvDocumentContent, templateId: CvTemplateId, title: string, width: number, height: number) {
  const style = cvTemplate(templateId);
  document.setSubject(`CV template: ${style.name}`);
  const { margin, bodySize, lineHeight } = style;
  const bodyWidth = width - 2 * margin;
  const bottom = 58;
  const ink = rgb(0.12, 0.14, 0.17), muted = rgb(0.37, 0.4, 0.44);
  const colour = style.accent.slice(1).match(/.{2}/g)!.map(value => parseInt(value, 16) / 255);
  const accent = rgb(colour[0], colour[1], colour[2]);
  const supported = new Set(font.getCharacterSet());
  const printable = (text: string) => Array.from(text, character => supported.has(character.codePointAt(0)!) ? character : `[U+${character.codePointAt(0)!.toString(16).toUpperCase()}]`).join("");
  function wrap(text: string, face: PDFFont, size: number): string[] {
    const result: string[] = [];
    for (const paragraph of text.replace(/\t/g, "    ").split(/\r\n|\r|\n/)) {
      let line = "";
      for (const word of printable(paragraph).split(/\s+/u)) {
        const next = line ? `${line} ${word}` : word;
        if (face.widthOfTextAtSize(next, size) <= bodyWidth) { line = next; continue; }
        if (line) result.push(line);
        line = "";
        for (const character of word) {
          if (face.widthOfTextAtSize(line + character, size) > bodyWidth) { result.push(line); line = ""; }
          line += character;
        }
      }
      result.push(line);
    }
    return result;
  }
  let page = document.addPage([width, height]);
  let y = height - margin;
  function decoratePage() {
    if (style.id === "modern") page.drawRectangle({ x: 22, y: bottom - 9, width: 4, height: height - margin - bottom + 9, color: accent });
  }
  decoratePage();
  function nextPage() {
    page = document.addPage([width, height]);
    y = height - margin;
    decoratePage();
    for (const line of wrap(content.name, bold, 11)) {
      page.drawText(line, { x: margin, y: y - 11, font: bold, size: 11, color: accent });
      y -= 15;
    }
    page.drawLine({ start: { x: margin, y: y - 5 }, end: { x: width - margin, y: y - 5 }, thickness: 0.6, color: rgb(0.78, 0.8, 0.82) });
    y -= 24;
  }
  function ensure(space: number) { if (y - space < bottom) nextPage(); }
  const nameLines = wrap(content.name, bold, style.nameSize);
  if (style.id === "executive") {
    const bannerHeight = nameLines.length * (style.nameSize + 5) + 33;
    page.drawRectangle({ x: 0, y: height - bannerHeight, width, height: bannerHeight, color: accent });
    y = height - 20;
  }
  for (const line of nameLines) {
    ensure(style.nameSize + 5);
    const x = style.alignment === "center" ? (width - bold.widthOfTextAtSize(line, style.nameSize)) / 2 : margin;
    page.drawText(line, { x, y: y - style.nameSize, font: bold, size: style.nameSize, color: style.id === "executive" ? rgb(1, 1, 1) : accent });
    y -= style.nameSize + 5;
  }
  y -= style.id === "executive" ? 25 : 8;
  for (const contact of content.contact) for (const line of wrap(contact, font, 9.5)) {
    ensure(14);
    const x = style.alignment === "center" ? (width - font.widthOfTextAtSize(line, 9.5)) / 2 : margin;
    if (line) page.drawText(line, { x, y: y - 9.5, font, size: 9.5, color: muted });
    y -= 14;
  }
  y -= 8;
  for (const section of content.sections) {
    const headingLines = wrap(section.heading, bold, 11.5);
    const ruleSpace = style.heading === "plain" ? 6 : 12;
    ensure(style.sectionGap + headingLines.length * 15 + ruleSpace + 2 * lineHeight);
    y -= style.sectionGap;
    for (const line of headingLines) {
      page.drawText(line, { x: margin, y: y - 11.5, font: bold, size: 11.5, color: accent });
      y -= 15;
    }
    if (style.heading !== "plain") {
      const endX = style.heading === "accent" ? margin + 34 : width - margin;
      page.drawLine({ start: { x: margin, y: y - 2 }, end: { x: endX, y: y - 2 }, thickness: style.heading === "accent" ? 2 : 0.7, color: accent });
      if (style.heading === "double-rule") page.drawLine({ start: { x: margin, y: y - 5 }, end: { x: endX, y: y - 5 }, thickness: 0.3, color: accent });
    }
    y -= ruleSpace;
    for (const line of wrap(section.body, font, bodySize)) {
      ensure(lineHeight);
      if (line) page.drawText(line, { x: margin, y: y - bodySize, font, size: bodySize, color: ink });
      y -= lineHeight;
    }
  }
  const pages = document.getPages();
  pages.forEach((page, index) => {
    page.drawText(`Page ${index + 1} of ${pages.length}`, { x: margin, y: 30, font, size: 8, color: muted });
    const label = `${title} · ${style.name}`;
    page.drawText(label, { x: width - margin - font.widthOfTextAtSize(label, 8), y: 30, font, size: 8, color: muted });
  });
}
