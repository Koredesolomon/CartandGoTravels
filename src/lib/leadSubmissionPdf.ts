import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";

let fontBytes: Promise<Buffer> | undefined;

export async function createLeadSubmissionPdf({
  message,
  email,
  submittedAt = new Date(),
}: {
  message: string;
  email: string;
  submittedAt?: Date;
}) {
  fontBytes ??= readFile(path.join(process.cwd(), "src/assets/fonts/NotoSans-Regular.ttf"));
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  const font = await document.embedFont(await fontBytes, { subset: true });
  document.setTitle("Cart&Go Travels — Form submission");
  document.setAuthor("Cart&Go Travels");
  document.setCreationDate(submittedAt);

  const ink = rgb(0.06, 0.12, 0.16);
  const teal = rgb(0, 0.5, 0.57);
  const muted = rgb(0.35, 0.4, 0.44);
  const margin = 48;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const textWidth = pageWidth - margin * 2;
  const fontSize = 11;
  const lineHeight = 17;
  const supportedCharacters = new Set(font.getCharacterSet());
  // Keep unsupported glyphs visible as code points instead of silently losing them.
  const printable = (text: string) => Array.from(text, character => {
    const code = character.codePointAt(0)!;
    return supportedCharacters.has(code) ? character : `[U+${code.toString(16).toUpperCase()}]`;
  }).join("");

  const addPage = () => {
    const page = document.addPage([pageWidth, pageHeight]);
    page.drawText("Cart&Go Travels", { x: margin, y: pageHeight - 62, font, size: 21, color: teal });
    page.drawText("Form submission", { x: margin, y: pageHeight - 86, font, size: 13, color: ink });
    page.drawLine({ start: { x: margin, y: pageHeight - 104 }, end: { x: pageWidth - margin, y: pageHeight - 104 }, thickness: 2, color: rgb(0.96, 0.64, 0.15) });
    return page;
  };
  let page = addPage();
  let y = pageHeight - 132;

  const drawLine = (line: string, color = ink) => {
    if (y < 64) {
      page = addPage();
      y = pageHeight - 132;
    }
    if (line) page.drawText(line, { x: margin, y, size: fontSize, font, color });
    y -= lineHeight;
  };

  const drawParagraph = (paragraph: string, color = ink) => {
    const text = printable(paragraph.replace(/\t/g, "    "));
    let line = "";
    for (const word of text.split(/\s+/u)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, fontSize) <= textWidth) {
        line = next;
        continue;
      }
      if (line) drawLine(line, color);
      line = "";
      // URLs and long unbroken responses must also stay inside the page.
      for (const character of word) {
        if (font.widthOfTextAtSize(line + character, fontSize) > textWidth) {
          drawLine(line, color);
          line = "";
        }
        line += character;
      }
    }
    drawLine(line, color);
  };

  drawParagraph(`Submitted: ${submittedAt.toISOString()}`, muted);
  if (email) drawParagraph(`Reply to: ${email}`, muted);
  drawLine("");
  for (const paragraph of message.split(/\r\n|\r|\n/)) drawParagraph(paragraph);

  const pages = document.getPages();
  pages.forEach((pdfPage, index) => {
    pdfPage.drawText(`Page ${index + 1} of ${pages.length}`, { x: margin, y: 32, font, size: 9, color: muted });
  });
  return Buffer.from(await document.save());
}
