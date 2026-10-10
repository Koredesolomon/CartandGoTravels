type ConsularResponse<T> = T & { error?: string; code?: string; requestId?: string };

// Hosting proxies can return HTML before a request reaches the API route.
// Keep that response out of document errors and report its HTTP status instead.
export async function readConsularResponse<T extends object>(response: Response, service: "scan" | "review"): Promise<ConsularResponse<T>> {
  if (response.status === 401 || response.status === 402) return { error: "Payment is required or your session has expired.", code: "access_required" } as ConsularResponse<T>;
  const text = await response.text();
  try {
    const data: unknown = JSON.parse(text);
    if (data && typeof data === "object" && !Array.isArray(data)) return data as ConsularResponse<T>;
  } catch {
    // Use controlled diagnostics below; never display a proxy's response body.
  }

  const endpoint = service === "scan" ? "/api/document-ocr" : "/api/ai-consular-check";
  const reference = ` (${endpoint}, HTTP ${response.status})`;
  if (response.status === 408 || response.status === 504) return { error: `The ${service === "scan" ? "document reader" : "AI review"} timed out. Please retry.${reference}`, code: "review_timeout" } as ConsularResponse<T>;

  let error: string;
  if (response.status === 413) error = "The hosting server rejected the upload size. Try a smaller PDF or paste the document text.";
  else if (response.status === 403) error = "The hosting server blocked this request. Please contact CartandGo support.";
  else if (response.status === 404 || response.status === 405) error = "The document service is unavailable on this deployment. Please contact CartandGo support.";
  else if (response.status === 429) error = "Too many requests. Please wait a minute and try again.";
  else if (response.status >= 500) error = "The document service is temporarily unavailable. Please retry or contact CartandGo support.";
  else error = "The document service returned an unexpected response. Please retry or contact CartandGo support.";
  throw new Error(`${error}${reference}`);
}
