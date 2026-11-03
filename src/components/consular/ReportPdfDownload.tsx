"use client";

import { useEffect, useRef, useState } from "react";
import type { ConsularReport } from "@/lib/consularReview";

export function ReportPdfDownload({ report, country, visaClass, documentNames }: { report: ConsularReport; country: string; visaClass: string; documentNames: Record<string, string> }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  async function download() {
    if (controller.current && !controller.current.signal.aborted) return;
    const current = new AbortController();
    controller.current = current;
    setPending(true);
    setError("");
    try {
      const [{ createConsularReportPdf }, regular, bold] = await Promise.all([
        import("@/lib/consularReportPdf"),
        fetch("/fonts/NotoSans-Regular.ttf", { signal: current.signal }),
        fetch("/fonts/NotoSans-Bold.ttf", { signal: current.signal }),
      ]);
      if (!regular.ok || !bold.ok) throw new Error("Unable to prepare the PDF. Please retry.");
      const [fontBytes, boldFontBytes] = [new Uint8Array(await regular.arrayBuffer()), new Uint8Array(await bold.arrayBuffer())];
      current.signal.throwIfAborted();
      const bytes = await createConsularReportPdf({ report, country, visaClass, documentNames, fontBytes, boldFontBytes });
      current.signal.throwIfAborted();
      const url = URL.createObjectURL(new Blob([Uint8Array.from(bytes)], { type: "application/pdf" }));
      try {
        const anchor = document.createElement("a");
        const slug = (value: string) => value.normalize("NFC").replace(/[^\p{L}\p{N}\p{M}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 40);
        anchor.href = url;
        anchor.download = `Document-Review-${slug(country)}-${slug(visaClass)}-${report.reviewedAt.slice(0, 10)}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
    } catch (cause) {
      if (!current.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to download the report. Please retry.");
    } finally {
      if (!current.signal.aborted) setPending(false);
      if (controller.current === current) controller.current = null;
    }
  }

  return <div>
    <button type="button" onClick={() => void download()} disabled={pending} className="rounded-md bg-[#07141a] px-5 py-3 text-sm font-black text-white transition hover:bg-[#07324a] disabled:cursor-not-allowed disabled:opacity-40">
      {pending ? "Preparing PDF…" : "Download report (PDF)"}
    </button>
    <p className="mt-2 text-xs leading-5 text-[#5b6870]">Created in your browser from this report. Nothing is uploaded or saved.</p>
    {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
  </div>;
}
