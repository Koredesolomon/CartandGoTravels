"use client";

import { useEffect, useRef, useState } from "react";
import type { CvDocumentContent, CvTemplateId } from "@/lib/cvTemplates";

export function DocumentPdfDownload({ kind, name, text, title, paperSize, content, template, preparedBytes }: { kind: "CV" | "Cover Letter"; name: string; text: string; title?: string; paperSize?: "A4" | "Letter"; content?: CvDocumentContent; template?: CvTemplateId; preparedBytes?: Uint8Array }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), [kind, name, text, title, paperSize, content, template, preparedBytes]);

  async function download() {
    if (controller.current && !controller.current.signal.aborted) return;
    const current = new AbortController();
    controller.current = current;
    setPending(true);
    setError("");
    try {
      let bytes = preparedBytes;
      if (!bytes) {
        const [{ createApplicationDocumentPdf }, response, boldResponse] = await Promise.all([
          import("@/lib/applicationDocumentPdf"),
          fetch("/fonts/NotoSans-Regular.ttf", { signal: current.signal }),
          content ? fetch("/fonts/NotoSans-Bold.ttf", { signal: current.signal }) : undefined,
        ]);
        if (!response.ok || boldResponse && !boldResponse.ok) throw new Error("Unable to prepare the PDF. Please retry.");
        const fontBytes = new Uint8Array(await response.arrayBuffer());
        const boldFontBytes = boldResponse ? new Uint8Array(await boldResponse.arrayBuffer()) : undefined;
        current.signal.throwIfAborted();
        bytes = await createApplicationDocumentPdf({ kind, name, text, fontBytes, boldFontBytes, title, paperSize, content, template });
      }
      current.signal.throwIfAborted();
      const url = URL.createObjectURL(new Blob([Uint8Array.from(bytes)], { type: "application/pdf" }));
      try {
        const anchor = document.createElement("a");
        const filename = name.normalize("NFC").replace(/[^\p{L}\p{N}\p{M}-]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "Document";
        anchor.href = url;
        anchor.download = `${filename}-${(title ?? kind).replace(/ /g, "-")}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
    } catch (error) {
      if (!current.signal.aborted) setError(error instanceof Error ? error.message : "Unable to download the PDF. Please retry.");
    } finally {
      if (!current.signal.aborted) setPending(false);
      if (controller.current === current) controller.current = null;
    }
  }

  return <div className="mt-4">
    <button type="button" onClick={() => void download()} disabled={pending} className="rounded-md bg-[#07141a] px-5 py-3 text-sm font-black text-white transition hover:bg-[#07324a] disabled:cursor-not-allowed disabled:opacity-40">
      {pending ? "Preparing PDF…" : `Download ${kind} (PDF)`}
    </button>
    {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
  </div>;
}
