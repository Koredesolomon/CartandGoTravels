import { randomUUID } from "node:crypto";
import { after, NextResponse } from "next/server";

type Job = {
  owner: string;
  controller: AbortController;
  expires: number;
  timer: ReturnType<typeof setTimeout>;
  result?: { body: Record<string, unknown>; status: number };
};

// Share transient jobs across route bundles in one Node.js process. No document
// data is written to disk or the payment database.
const processState = globalThis as typeof globalThis & { cartandgoConsularJobs?: Map<string, Job> };
const jobs = processState.cartandgoConsularJobs ??= new Map<string, Job>();
const RESULT_TTL_MS = 60_000;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

function remove(id: string, job: Job) {
  clearTimeout(job.timer);
  job.controller.abort();
  jobs.delete(id);
}

export function enqueueConsularJob(owner: string, timeoutMs: number, work: (signal: AbortSignal) => Promise<Response>) {
  for (const [id, job] of jobs) if (job.expires <= Date.now()) remove(id, job);
  const running = [...jobs.values()].filter(job => !job.result);
  if (jobs.size >= 32 || running.length >= 4 || running.filter(job => job.owner === owner).length >= 2) {
    return json({ error: "The document service is busy. Please wait and retry." }, 429);
  }

  const id = randomUUID();
  const controller = new AbortController();
  const finish = (body: Record<string, unknown>, status: number) => {
    if (jobs.get(id) !== job || job.result) return;
    clearTimeout(job.timer);
    job.result = { body, status };
    job.expires = Date.now() + RESULT_TTL_MS;
    job.timer = setTimeout(() => remove(id, job), RESULT_TTL_MS);
    job.timer.unref();
  };
  const timer = setTimeout(() => {
    finish({ code: "review_timeout", error: "Session timeout, please retry" }, 504);
    controller.abort(new DOMException("Document processing timed out", "TimeoutError"));
  }, timeoutMs);
  timer.unref();
  const job: Job = { owner, controller, timer, expires: Date.now() + timeoutMs };
  jobs.set(id, job);

  try {
    after(async () => {
      if (controller.signal.aborted) return;
      try {
        const response = await work(controller.signal);
        const body = await response.json() as Record<string, unknown>;
        finish(body, response.status);
      } catch {
        // Provider output and applicant data must never enter an error or log.
        finish({ error: "Document processing could not finish. Please retry." }, 502);
      }
    });
  } catch {
    remove(id, job);
    return json({ error: "Background document processing is unavailable. Please retry." }, 503);
  }
  return json({ jobId: id, state: "pending" }, 202);
}

export function readConsularJob(id: string, owner: string) {
  const job = jobs.get(id);
  if (!job || job.owner !== owner) return json({ code: "job_unavailable", error: "Document processing was interrupted or expired. Please retry." }, 404);
  if (job.expires <= Date.now()) {
    remove(id, job);
    return json({ code: "job_unavailable", error: "Document processing was interrupted or expired. Please retry." }, 404);
  }
  return job.result ? json(job.result.body, job.result.status) : json({ jobId: id, state: "pending" }, 202);
}

export function deleteConsularJob(id: string, owner: string) {
  const job = jobs.get(id);
  if (job?.owner === owner) remove(id, job);
  return json({ ok: true });
}
