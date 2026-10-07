import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { timeMinutes, unscheduledPlaces } from "@/lib/itinerary";
import type { ItineraryExport } from "@/lib/itineraryExport";
import type { SupportingDocument } from "@/lib/itineraryDocumentRequirements";

let fontBytes: Promise<Buffer> | undefined;

export async function createItineraryPdf({ plan, traveler, accommodations }: ItineraryExport, supportingDocuments: SupportingDocument[], generatedAt = new Date()) {
  fontBytes ??= readFile(path.join(process.cwd(), "src/assets/fonts/NotoSans-Regular.ttf"));
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  const font = await document.embedFont(await fontBytes, { subset: true });
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  document.setTitle(`Flight & Accommodation Itinerary — ${traveler.fullName}`);
  document.setAuthor(traveler.fullName);
  document.setSubject("Flight and accommodation itinerary supplied for a visa application");
  document.setCreationDate(generatedAt);
  document.setModificationDate(generatedAt);

  const width = 595.28, height = 841.89, margin = 40, bodyWidth = width - margin * 2;
  const ink = rgb(0.1, 0.13, 0.17), navy = rgb(0.06, 0.12, 0.24), blue = rgb(0.12, 0.43, 0.7), muted = rgb(0.34, 0.37, 0.42), border = rgb(0.79, 0.81, 0.84), pale = rgb(0.97, 0.98, 0.99);
  const supported = new Set(font.getCharacterSet());
  const printable = (text: string) => Array.from(text, character => supported.has(character.codePointAt(0)!) ? character : `[U+${character.codePointAt(0)!.toString(16).toUpperCase()}]`).join("");
  function wrap(text: string, size: number, maxWidth: number, face = font): string[] {
    const output: string[] = [];
    for (const paragraph of text.replace(/\t/g, "    ").split(/\r\n|\r|\n/)) {
      let line = "";
      for (const word of printable(paragraph).split(/\s+/u)) {
        const next = line ? `${line} ${word}` : word;
        if (face.widthOfTextAtSize(next, size) <= maxWidth) { line = next; continue; }
        if (line) output.push(line);
        line = "";
        for (const character of word) {
          if (face.widthOfTextAtSize(line + character, size) > maxWidth) { output.push(line); line = ""; }
          line += character;
        }
      }
      output.push(line);
    }
    return output;
  }
  const title = "FLIGHT & ACCOMMODATION ITINERARY";
  const titleSize = Math.min(19, bodyWidth / bold.widthOfTextAtSize(title, 1));
  function addPage() {
    const page = document.addPage([width, height]);
    page.drawText(title, { x: margin, y: height - 55, font: bold, size: titleSize, color: navy });
    return page;
  }
  let page = addPage(), y = height - 82;
  function newPage() { page = addPage(); y = height - 83; }
  function ensure(space: number) { if (y - space < 65) newPage(); }
  function paragraph(text: string, size = 9, color = muted) {
    for (const line of wrap(text, size, bodyWidth)) {
      ensure(size + 5);
      if (line) page.drawText(line, { x: margin, y, font, size, color });
      y -= size + 5;
    }
  }
  function heading(text: string) {
    ensure(65);
    y -= 14;
    for (const line of wrap(text, 11, bodyWidth, bold)) { page.drawText(line, { x: margin, y, font: bold, size: 11, color: blue }); y -= 16; }
    y -= 1;
  }
  function table(rows: string[][], widths: number[], headers?: string[], labels = false) {
    const size = 9, lineHeight = 12.5, padding = 6;
    function drawCells(cells: string[][], count: number, isHeader = false) {
      const rowHeight = count * lineHeight + padding * 2;
      let x = margin;
      for (const [index, values] of cells.entries()) {
        const face: PDFFont = isHeader || (labels && index === 0) ? bold : font;
        page.drawRectangle({ x, y: y - rowHeight, width: widths[index], height: rowHeight, borderColor: border, borderWidth: 0.5, color: isHeader ? blue : labels ? pale : rgb(1, 1, 1) });
        for (const [lineIndex, value] of values.entries()) if (value) page.drawText(value, { x: x + padding, y: y - padding - size - lineIndex * lineHeight, font: face, size, color: isHeader ? rgb(1, 1, 1) : ink });
        x += widths[index];
      }
      y -= rowHeight;
    }
    function header() {
      if (!headers) return;
      const cells = headers.map((text, index) => wrap(text, size, widths[index] - padding * 2, bold));
      const count = Math.max(...cells.map(cell => cell.length));
      ensure(count * lineHeight + padding * 2 + 30);
      drawCells(cells, count, true);
    }
    header();
    for (const row of rows) {
      const cells = row.map((text, index) => wrap(text, size, widths[index] - padding * 2, labels && index === 0 ? bold : font));
      const count = Math.max(...cells.map(cell => cell.length));
      const fullRowHeight = count * lineHeight + padding * 2;
      if (y - fullRowHeight < 65 && fullRowHeight < height - 150) { newPage(); header(); }
      let offset = 0;
      while (offset < count) {
        let room = Math.floor((y - 65 - padding * 2) / lineHeight);
        if (room < 1) { newPage(); header(); room = Math.floor((y - 65 - padding * 2) / lineHeight); }
        const take = Math.min(count - offset, room);
        const chunk = cells.map((values, index) => {
          const segment = values.slice(offset, offset + take);
          if (offset && index === 0 && !segment.length && !labels) return [values[0], "(continued)"].slice(0, take);
          return segment;
        });
        drawCells(chunk, take);
        offset += take;
        if (offset < count) { newPage(); header(); }
      }
    }
    y -= 9;
  }

  paragraph("Document Purpose: Submitted in support of the visa application. Reservation details and accommodation statuses are supplied by the applicant and should match the accompanying supporting documents.");
  heading("1. Personal & Passport Information");
  table([
    ["Full Name (as in Passport):", traveler.fullName],
    ["Passport Number:", traveler.passportNumber],
    ["Visa Category Applied For:", traveler.visaCategory],
    ["Main Destination Country:", plan.details.destination],
  ], [190, bodyWidth - 190], undefined, true);

  heading("2. Flight Reservations (Proof of Return)");
  table([
    ["Inbound (Entry):", traveler.inbound.date, `${traveler.inbound.reference}\nStatus: ${traveler.inbound.status}`],
    ["Outbound (Exit):", traveler.outbound.date, `${traveler.outbound.reference}\nStatus: ${traveler.outbound.status}`],
  ], [132, 90, bodyWidth - 222], ["Flight Segment", "Date", "Flight / PNR Reference"]);

  heading("3. Daily Schedule & Accommodation Details");
  const staysByDay = plan.details.stops.flatMap(stop => {
    const stay = accommodations.find(entry => entry.stopId === stop.id)!;
    return Array.from({ length: Number(stop.days) }, () => stay);
  });
  table(plan.days.map((day, index) => {
    const stay = staysByDay[index];
    const activities = [...day.events].sort((a, b) => timeMinutes(a.start) - timeMinutes(b.start)).map(activity => `${activity.start}–${activity.end} ${activity.title}${activity.notes ? `\n${activity.notes}` : ""}`);
    if (!day.events.some(activity => activity.type === "place" || activity.type === "personal")) activities.push("Independent activities and rest in " + day.cityName + ".");
    if (day.notes) activities.push(`Day notes: ${day.notes}`);
    return [`Day ${index + 1}\n${day.date}`, `${day.cityName}\n${activities.join("\n")}`, `${stay.name}\nBooking reference: ${stay.reference}\nStatus: ${stay.status}`];
  }), [85, 245, bodyWidth - 330], ["Timeline / Day", "Daily Activity & Cities Visited", "Accommodation Proof / Status"]);

  heading("4. Ties to Home Country & Financial Sufficiency");
  table([
    ["Primary Economic/Social Tie:", `${traveler.primaryTie}\n${traveler.tieEvidence}`],
    ["Financial Means Evidence:", traveler.financialEvidence],
  ], [190, bodyWidth - 190], undefined, true);
  if (plan.details.notes) { heading("Trip notes / requirements"); paragraph(plan.details.notes, 9, ink); }
  const pending = unscheduledPlaces(plan);
  if (pending.length) { heading("Optional places outside the daily schedule"); paragraph(pending.map(place => place.name).join("; ")); }

  heading("Supporting documents");
  paragraph("The following files are included as attachments in this PDF. Booking statuses above are applicant-provided; uploading a file does not independently verify a reservation.");
  for (const attachment of supportingDocuments) {
    paragraph(`${attachment.label}: ${attachment.filename}`, 8);
    await document.attach(attachment.bytes, attachment.filename, { mimeType: attachment.mimeType, description: attachment.label });
  }
  paragraph("Schedule times are local to each city. Visit lengths and transfer allowances are estimates.", 8);
  const prepared = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" }).format(generatedAt);
  const pages = document.getPages();
  for (const [index, item] of pages.entries()) {
    item.drawText(`Prepared ${prepared}`, { x: margin, y: 32, font, size: 8, color: muted });
    const number = `Page ${index + 1} of ${pages.length}`;
    item.drawText(number, { x: width - margin - font.widthOfTextAtSize(number, 8), y: 32, font, size: 8, color: muted });
  }
  return Buffer.from(await document.save());
}
