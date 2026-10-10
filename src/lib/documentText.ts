export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_TEXT_CHARS = 12000;

export class ScannedPdfError extends Error {
  constructor(public pageNumber: number) {
    super(`Page ${pageNumber} needs scanned-document reading.`);
    this.name = "ScannedPdfError";
  }
}

export async function extractDocumentText(file: File, options: { maxChars?: number; preservePages?: boolean; checkImages?: boolean } = {}): Promise<string> {
  const maxChars = options.maxChars ?? MAX_TEXT_CHARS;
  const tooLong = `Document text is too long. Please supply at most ${maxChars.toLocaleString()} characters.`;
  if (!file.size) throw new Error("That file is empty.");
  if (file.size > MAX_FILE_BYTES) throw new Error("That file is over the 10MB limit. Please upload a smaller file.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  let text: string;
  try {
    if (extension === "txt") {
      text = await file.text();
    } else if (extension === "docx") {
      const mammoth = await import("mammoth/mammoth.browser");
      const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      text = result.value;
    } else if (extension === "pdf") {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
      const loading = pdfjs.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
        standardFontDataUrl: "/pdf-assets/standard_fonts/",
        cMapUrl: "/pdf-assets/cmaps/",
        cMapPacked: true,
        wasmUrl: "/pdf-assets/wasm/",
        verbosity: pdfjs.VerbosityLevel.ERRORS,
      });
      try {
        const pdf = await loading.promise;
        if (pdf.numPages > 100) throw new Error("Please upload a PDF with 100 pages or fewer.");
        const pages: string[] = [];
        let length = 0;
        let readable = false;
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          const pageText = content.items.map((item) => "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "").join("");
          if (pageText.trim()) readable = true;
          if (!pageText.trim() || options.checkImages) {
            const operators = await page.getOperatorList();
            const imageOperations: number[] = [
              pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintInlineImageXObject, pdfjs.OPS.paintImageMaskXObject,
              pdfjs.OPS.paintImageXObjectRepeat, pdfjs.OPS.paintInlineImageXObjectGroup,
              pdfjs.OPS.paintImageMaskXObjectGroup, pdfjs.OPS.paintImageMaskXObjectRepeat, pdfjs.OPS.paintSolidColorImageMask,
            ];
            // Flattened lettering can be drawn as paths rather than images.
            // A textless page with visible content needs OCR instead of being
            // treated as blank and omitted from the extracted document.
            const drawingOperations: number[] = [pdfjs.OPS.constructPath, pdfjs.OPS.rawFillPath, pdfjs.OPS.shadingFill];
            const hasImage = operators.fnArray.some(operation => imageOperations.includes(operation));
            const hasDrawingWithoutText = !pageText.trim() && operators.fnArray.some(operation => drawingOperations.includes(operation));
            if (hasImage || hasDrawingWithoutText) {
              if (options.checkImages) throw new ScannedPdfError(pageNumber);
              throw new Error(`Page ${pageNumber} has visible content but no readable text. Please OCR the scanned pages and check the text before uploading; a partial review would miss evidence.`);
            }
          }
          const labeled = options.preservePages ? `[Page ${pageNumber}]\n${pageText}` : pageText;
          length += labeled.length + 1;
          if (length > maxChars) throw new Error(tooLong);
          pages.push(labeled);
          page.cleanup();
        }
        text = readable ? pages.join("\n") : "";
      } finally { await loading.destroy(); }
    } else {
      throw new Error("Choose a TXT, PDF or DOCX file.");
    }
  } catch (error) {
    if (error instanceof ScannedPdfError) throw error;
    if (error instanceof Error && /Please|please|Choose|too long/.test(error.message)) throw error;
    throw new Error("Unable to read this document. Check that it is a valid, unlocked file, or paste its text instead.", { cause: error });
  }
  text = text.replace(/\u0000/g, "").trim();
  if (!text) throw new Error("No readable text was found. For scanned PDFs, paste text extracted with OCR instead.");
  if (text.length > maxChars) throw new Error(tooLong);
  return text;
}
