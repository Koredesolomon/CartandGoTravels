const transientStatuses = new Set([500, 502, 503, 504, 529]);

export const DEFAULT_CONSULAR_MODEL = "claude-sonnet-5-5";

// Model-specific request fields shared by the OCR and review routes. Sonnet 4.6
// ran without thinking when the field was omitted; Sonnet 5.5 thinks by default
// and that thinking counts toward max_tokens, which these routes size for the
// JSON output alone. `between_tools` is its lowest setting (no extended
// thinking) and is rejected by every other model, so it is sent only here.
// Server-side fallback retries cyber/frontier_llm refusals on Sonnet 5.
export function consularModelRequest(): { headers: Record<string, string>; body: Record<string, unknown> } {
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_CONSULAR_MODEL;
  if (model !== "claude-sonnet-5-5") return { headers: {}, body: { model } };
  return {
    headers: { "anthropic-beta": "server-side-fallback-2026-07-01" },
    body: { model, thinking: { type: "between_tools" }, fallbacks: "default" },
  };
}

function retryPause(signal: AbortSignal) {
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, 1000);
    signal.addEventListener("abort", abort, { once: true });
  });
}

// Both callers provide replayable JSON bodies and a deadline for the entire
// provider request. A retry never resets that deadline or accepts partial text.
export async function requestConsularProvider(init: RequestInit & { signal: AbortSignal }) {
  for (let attempt = 0; attempt < 2; attempt++) {
    init.signal.throwIfAborted();
    const response = await fetch("https://api.anthropic.com/v1/messages", init);
    if (attempt === 1 || !transientStatuses.has(response.status)) return response;
    await response.body?.cancel().catch(() => {});
    await retryPause(init.signal);
  }
  throw new Error("The AI provider request could not complete.");
}

export async function consularProviderFailureReason(response: Response): Promise<"insufficient_credit" | "unavailable"> {
  if (response.status !== 400) return "unavailable";
  const data = await response.json().catch(() => undefined) as { error?: { message?: unknown } } | undefined;
  const message = data?.error?.message;
  // Return a fixed diagnostic category, never the provider's message, which
  // may contain details of its request. Billing failures must not blame a PDF.
  return typeof message === "string" && /credit balance is too low|insufficient credits?|credit balance.*insufficient/i.test(message) ? "insufficient_credit" : "unavailable";
}
