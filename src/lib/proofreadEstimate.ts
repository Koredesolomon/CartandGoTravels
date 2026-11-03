// Client-side time estimate for a Proofread run. The server reports no progress
// (jobs are only "pending" until done), so this is a rough prediction from input
// size, not a measurement. Constants are starting points: tune them against
// real run times once there is data.

const REVIEW_BASE_SECONDS = 60; // two sequential AI calls: review, then audit
const REVIEW_SECONDS_PER_1000_CHARS = 2;
const REVIEW_MAX_SECONDS = 360;
const SCAN_SECONDS_PER_FILE = 60; // OCR of one scanned PDF

export function estimateProofreadSeconds({ characters, scans }: { characters: number; scans: number }) {
  const review = Math.min(REVIEW_MAX_SECONDS, REVIEW_BASE_SECONDS + (Math.max(0, characters) / 1000) * REVIEW_SECONDS_PER_1000_CHARS);
  return Math.round(Math.max(0, scans) * SCAN_SECONDS_PER_FILE + review);
}

// Rough character count before files are read: text-based documents average a
// few bytes per character of extracted text, so size is only a coarse proxy.
export function guessCharacters(totalBytes: number) {
  return Math.min(60_000, Math.round(totalBytes / 6));
}

export function describeTimeLeft(estimateSeconds: number, elapsedSeconds: number) {
  const remaining = estimateSeconds - elapsedSeconds;
  if (remaining <= 0) return "Taking a little longer than usual. Almost there…";
  if (remaining <= 60) return "Less than a minute left";
  const minutes = Math.ceil(remaining / 60);
  return `About ${minutes} min${minutes === 1 ? "" : "s"} left`;
}
