type LeadSubmission = {
  email?: string;
  message: string;
};

export async function submitLead(submission: LeadSubmission) {
  const response = await fetch("/api/lead-submissions", {
    method: "POST",
    signal: AbortSignal.timeout(25000),
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    throw new Error("Unable to submit lead");
  }

  return response.json() as Promise<{ ok: true }>;
}
