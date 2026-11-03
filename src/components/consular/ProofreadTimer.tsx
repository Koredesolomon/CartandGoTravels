"use client";

import { useEffect, useState } from "react";
import { describeTimeLeft } from "@/lib/proofreadEstimate";

function format(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Mounted only while a proofread is running, so the clock starts at 0:00 each run
// and the page itself is not re-rendered every second.
export function ProofreadTimer({ stage, estimateSeconds }: { stage?: string; estimateSeconds: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, []);

  const percent = Math.min(95, Math.round((elapsed / Math.max(1, estimateSeconds)) * 100));

  return (
    <div className="flex min-h-96 flex-col items-center justify-center rounded-md bg-[#e8f6fb] p-6 text-center">
      <p role="status" className="sr-only">Proofreading in progress. This can take a few minutes.</p>
      <div aria-hidden className="h-12 w-12 animate-spin rounded-full border-4 border-[#0098ba]/25 border-t-[#0098ba] motion-reduce:animate-none" />
      <p aria-hidden className="mt-6 font-mono text-5xl font-semibold tabular-nums text-[#07141a]">{percent}%</p>
      <p aria-hidden className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#5b6870]">Estimated progress</p>
      <p aria-hidden className="mt-3 text-base font-semibold text-[#0098ba]">{describeTimeLeft(estimateSeconds, elapsed)} · {format(elapsed)} elapsed</p>
      <h2 aria-hidden className="mt-4 font-serif text-2xl text-[#07141a]">{stage ?? "Proofreading and reviewing your documents"}</h2>
      <p aria-hidden className="mt-2 max-w-md text-sm leading-6 text-[#5b6870]">
        This is an estimate based on your documents&apos; size. Scanned or large files can take longer. Please keep this page open.
      </p>
      <div aria-hidden className="mt-6 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-[#0098ba] transition-[width] duration-1000" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
