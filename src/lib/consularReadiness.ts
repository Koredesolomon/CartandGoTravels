import type { ConsularReport } from "@/lib/consularReview";

export function readinessBand(score: number) {
  if (score >= 80) return { label: "Strong readiness", color: "#1e7a4c" };
  if (score >= 50) return { label: "Developing readiness", color: "#93670f" };
  return { label: "Needs more evidence", color: "#b5473b" };
}

export function scoreWithheldMessage(reviewStatus: ConsularReport["reviewStatus"]) {
  if (reviewStatus === "wording_partial") return "A readiness score awaits completion of the writing review. Other checked evidence assessments remain available.";
  if (reviewStatus === "broader_review_required") return "Broader human review is required before relying on the report. No readiness assessment is issued.";
  if (reviewStatus === "evidence_partial") return "Overall conclusions and readiness are withheld until the flagged evidence or interpretations are reviewed.";
  return "A readiness score is withheld until the supplied evidence and current guidance allow a meaningful assessment.";
}

export const SCORE_METHOD_NOTE = "Weighted evidence coverage: purpose 20%, finances 25%, consistency 25%, route-specific intent 20%, writing 10%. Supported = full weight, partial = half, missing = zero; inapplicable criteria are excluded. This measures supplied documents and does not predict visa approval.";

export function provisionalNote(coverage: number, basis: "verified" | "unverified" = "verified") {
  if (basis === "unverified") return "Estimated score, a human reviewer must confirm it before you rely on it.";
  return `Provisional score. The full readiness score is withheld (see Review limits), so this percentage covers only the ${coverage}% of the scoring weight that could be assessed. Treat it as a guide to what to fix first, not a final result.`;
}
