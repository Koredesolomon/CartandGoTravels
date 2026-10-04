export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_TEXT_CHARS = 12000;

export async function extractDocumentText(file: File): Promise<string> {
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
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
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
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          const pageText = content.items.map((item) => "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "").join("");
          length += pageText.length;
          if (length > MAX_TEXT_CHARS) throw new Error("Document text is too long. Please upload an excerpt under 12,000 characters.");
          pages.push(pageText);
          page.cleanup();
        }
        text = pages.join("\n");
      } finally { await loading.destroy(); }
    } else {
      throw new Error("Choose a TXT, PDF or DOCX file.");
    }
  } catch (error) {
    if (error instanceof Error && /Please|Choose|too long/.test(error.message)) throw error;
    throw new Error("Unable to read this document. Check that it is a valid, unlocked file, or paste its text instead.", { cause: error });
  }
  text = text.replace(/\u0000/g, "").trim();
  if (!text) throw new Error("No readable text was found. For scanned PDFs, paste text extracted with OCR instead.");
  if (text.length > MAX_TEXT_CHARS) throw new Error("Document text is too long. Please upload an excerpt under 12,000 characters.");
  return text;
}
