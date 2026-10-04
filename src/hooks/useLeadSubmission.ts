"use client";

import { useRef, useState } from "react";
import { submitLead } from "@/lib/leadSubmission";

export function useLeadSubmission() {
  const pending = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  async function sendLead(submission: Parameters<typeof submitLead>[0], form: HTMLFormElement) {
    if (pending.current) return false;
    pending.current = true;
    setIsSubmitting(true);
    setSubmissionError("");
    try {
      await submitLead(submission);
      form.reset();
      return true;
    } catch {
      setSubmissionError("Your request could not be sent. Please try again. Your entries have been kept.");
      return false;
    } finally {
      pending.current = false;
      setIsSubmitting(false);
    }
  }
  return { sendLead, isSubmitting, submissionError };
}
