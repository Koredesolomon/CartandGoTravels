// Await a fresh worker for each preview attempt instead of allowing PDF.js to
// cache a rejected fallback import after a temporary network failure.
export function startPreviewWorker(worker: Worker, signal: AbortSignal, timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error("The preview took too long to load. Please retry.")), timeoutMs);
    const ready = (event: MessageEvent) => {
      if (event.data?.action === "ready" && event.data.data instanceof Uint8Array) finish();
    };
    const failed = (event: ErrorEvent) => { event.preventDefault(); finish(new Error("Could not load the CV preview. Please retry.")); };
    const aborted = () => finish(signal.reason ?? new DOMException("Preview cancelled", "AbortError"));
    function finish(error?: Error) {
      clearTimeout(timer);
      worker.removeEventListener("message", ready);
      worker.removeEventListener("error", failed);
      signal.removeEventListener("abort", aborted);
      if (error) { worker.terminate(); reject(error); } else resolve();
    }
    worker.addEventListener("message", ready);
    worker.addEventListener("error", failed);
    signal.addEventListener("abort", aborted, { once: true });
    if (signal.aborted) aborted();
  });
}
