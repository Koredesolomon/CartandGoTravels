"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFWorker, RenderTask } from "pdfjs-dist";
import type { CvDraft } from "@/lib/cvBuilder";
import { cvTemplate, type CvTemplateId } from "@/lib/cvTemplates";
import { startPreviewWorker } from "@/lib/cvPreviewWorker";
import { DocumentPdfDownload } from "./DocumentPdfDownload";

function PdfCanvas({ pdf, pageNumber }: { pdf: PDFDocumentProxy; pageNumber: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    let task: RenderTask | undefined;
    async function render() {
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled || !canvas.current) return;
        const viewport = page.getViewport({ scale: 1.5 });
        const target = canvas.current;
        target.width = Math.ceil(viewport.width); target.height = Math.ceil(viewport.height);
        task = page.render({ canvas: target, viewport });
        await task.promise;
      } catch (error) { if (!cancelled) setError(error instanceof Error ? error.message : "Could not display this page."); }
    }
    void render();
    return () => { cancelled = true; task?.cancel(); };
  }, [pdf, pageNumber]);
  return <>
    <canvas ref={canvas} role="img" aria-label={`CV PDF preview, page ${pageNumber}`} className="h-auto w-full bg-white shadow-md" />
    {error ? <p role="alert" className="mt-3 text-sm text-red-700">The page preview could not load. You can still download your PDF.</p> : null}
  </>;
}

export function CvPdfPreview({ draft, template }: { draft: CvDraft; template: CvTemplateId }) {
  const [ready, setReady] = useState<{ bytes: Uint8Array; pdf?: PDFDocumentProxy } | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  useEffect(() => {
    const controller = new AbortController();
    let loading: PDFDocumentLoadingTask | undefined;
    let browserWorker: Worker | undefined;
    let pdfWorker: PDFWorker | undefined;
    async function prepare() {
      try {
        const [{ createApplicationDocumentPdf }, regularResponse, boldResponse] = await Promise.all([
          import("@/lib/applicationDocumentPdf"),
          fetch("/fonts/NotoSans-Regular.ttf", { signal: controller.signal }),
          fetch("/fonts/NotoSans-Bold.ttf", { signal: controller.signal }),
        ]);
        if (!regularResponse.ok || !boldResponse.ok) throw new Error("Could not prepare your CV. Please retry.");
        const [regular, bold] = await Promise.all([regularResponse.arrayBuffer(), boldResponse.arrayBuffer()]);
        controller.signal.throwIfAborted();
        const bytes = await createApplicationDocumentPdf({ kind: "CV", ...draft, fontBytes: new Uint8Array(regular), boldFontBytes: new Uint8Array(bold), template });
        controller.signal.throwIfAborted();
        setReady({ bytes });
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        controller.signal.throwIfAborted();
        browserWorker = new Worker("/pdf.worker.min.js", { type: "module" });
        await startPreviewWorker(browserWorker, controller.signal);
        controller.signal.throwIfAborted();
        pdfWorker = pdfjs.PDFWorker.create({ port: browserWorker, verbosity: pdfjs.VerbosityLevel.ERRORS });
        loading = pdfjs.getDocument({ data: Uint8Array.from(bytes), worker: pdfWorker, verbosity: pdfjs.VerbosityLevel.ERRORS });
        const pdf = await loading.promise;
        controller.signal.throwIfAborted();
        setReady({ bytes, pdf });
      } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not display your CV. Please retry."); }
    }
    void prepare();
    return () => {
      controller.abort();
      const releaseWorker = () => { pdfWorker?.destroy(); browserWorker?.terminate(); };
      if (loading) void loading.destroy().finally(releaseWorker).catch(() => {});
      else releaseWorker();
    };
  }, [draft, template, retry]);
  const style = cvTemplate(template);
  return <div className="mt-5">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="font-bold text-[#07141a]">{style.name} · {draft.paperSize} · {draft.title}</p>
      {ready?.pdf ? <nav aria-label="CV preview pages" className="flex items-center gap-3">
        <button type="button" aria-label="Previous CV page" disabled={pageNumber === 1} onClick={() => setPageNumber(number => number - 1)} className="rounded border border-[#d7dfe5] px-3 py-1 disabled:opacity-40">Previous</button>
        <span aria-live="polite">Page {pageNumber} of {ready.pdf.numPages}</span>
        <button type="button" aria-label="Next CV page" disabled={pageNumber === ready.pdf.numPages} onClick={() => setPageNumber(number => number + 1)} className="rounded border border-[#d7dfe5] px-3 py-1 disabled:opacity-40">Next</button>
      </nav> : null}
    </div>
    {ready?.pdf ? <div className="rounded-md bg-[#e8eef2] p-3 sm:p-6"><div className="mx-auto max-w-[680px]"><PdfCanvas key={pageNumber} pdf={ready.pdf} pageNumber={pageNumber} /></div></div> : !error ? <p role="status" className="rounded-md bg-[#f6fbfd] p-6 text-sm">Preparing your CV preview…</p> : null}
    {error ? <div role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-800"><p>{ready ? "The preview could not load. Your PDF is still available to download." : error}</p><button type="button" className="mt-2 font-bold underline" onClick={() => { setError(""); setReady(null); setPageNumber(1); setRetry(number => number + 1); }}>Retry preview</button></div> : null}
    {ready ? <DocumentPdfDownload kind="CV" name={draft.name} text={draft.text} title={draft.title} paperSize={draft.paperSize} content={draft.content} template={template} preparedBytes={ready.bytes} /> : null}
  </div>;
}
