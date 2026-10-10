import { readConsularResponse } from "@/lib/consularResponse";

function pause(signal: AbortSignal) {
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, 1000);
    signal.addEventListener("abort", abort, { once: true });
  });
}

// Only the initial upload contains documents. Polls use an opaque job reference.
export async function requestConsularResult<T extends object>(service: "scan" | "review", init: RequestInit, signal: AbortSignal) {
  const endpoint = service === "scan" ? "/api/document-ocr" : "/api/ai-consular-check";
  const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(service === "scan" ? 300_000 : 600_000)]);
  const headers = new Headers(init.headers);
  headers.set("Prefer", "respond-async");
  let jobId: string | undefined;
  const read = async (response: Response) => ({ response, data: await readConsularResponse<T & { jobId?: string; state?: string }>(response, service) });
  try {
    let result = await read(await fetch(endpoint, { ...init, headers, signal: requestSignal, cache: "no-store" }));
    if (result.response.status !== 202) return result;
    if (typeof result.data.jobId !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(result.data.jobId)) throw new Error("The document service returned an invalid job reference. Please retry.");
    jobId = result.data.jobId;
    while (true) {
      requestSignal.throwIfAborted();
      result = await read(await fetch(`/api/consular-jobs/${jobId}`, { signal: requestSignal, cache: "no-store" }));
      if (result.response.status !== 202) return result;
      await pause(requestSignal);
    }
  } catch (error) {
    signal.throwIfAborted();
    if (requestSignal.aborted && requestSignal.reason instanceof Error && requestSignal.reason.name === "TimeoutError") throw new Error("Document processing timed out. Please retry.");
    throw error;
  } finally {
    if (jobId) void fetch(`/api/consular-jobs/${jobId}`, { method: "DELETE", signal: AbortSignal.timeout(5000), cache: "no-store" }).catch(() => {});
  }
}
