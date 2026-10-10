import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Synthetic evidence only. This optional evaluation makes two to four paid AI calls when run live.
const fixture = JSON.parse(await readFile(new URL("../tests/fixtures/consular/conflicting-evidence.json", import.meta.url), "utf8"));
let result;
if (process.argv[2] === "--report" && process.argv[3]) {
  result = JSON.parse(await readFile(process.argv[3], "utf8"));
} else {
  const endpoint = new URL("/api/ai-consular-check", process.env.CONSULAR_EVAL_URL ?? "http://localhost:3000");
  if (!["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname)) throw new Error("Run the evaluation against a local development server.");
  const accessToken = process.env.CONSULAR_EVAL_ACCESS_TOKEN;
  if (accessToken && !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(accessToken)) throw new Error("CONSULAR_EVAL_ACCESS_TOKEN must be a signed access cookie value when supplied.");
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", ...(accessToken ? { Cookie: `ai_consular_access=${accessToken}` } : {}) }, body: JSON.stringify(fixture), signal: AbortSignal.timeout(560_000) });
  result = await response.json();
  assert.equal(response.status, 200, result.error ?? "The live review failed.");
}
assert.ok(result.report, result.error ?? "No report returned.");
const { report } = result;
assert.equal(report.documents.length, fixture.documents.length, "Every supplied document should be reviewed.");
const findings = report.findings.map(item => `${item.title} ${item.body} ${item.evidence.map(quote => quote.quote).join(" ")}`).join("\n");
assert.match(findings, /salary/i, "The salary inconsistency should be identified.");
assert.match(findings, /30[ ,]?000/, "The claimed salary should be referenced.");
assert.match(findings, /18[ ,]?000/, "The employer's conflicting salary should be referenced.");
assert.match(findings, /July/i, "The planned travel period should be referenced.");
assert.match(findings, /August/i, "The conflicting approved leave should be referenced.");
assert.ok(report.proofreading.some(item => item.original.includes("I plans") && /I plan\b/.test(item.suggested)), "The subject-verb error should be corrected.");
assert.ok(report.missingEvidence.some(item => /bank|statement|financial/i.test(item)), "Claimed savings must not be mistaken for supplied banking evidence.");
assert.notEqual(report.statusLabel, "Ready for human review", "Conflicting evidence cannot be labeled ready.");
for (const item of [...report.criteria, ...report.findings]) {
  for (const evidence of item.evidence) {
    const document = fixture.documents.find(doc => doc.id === evidence.documentId);
    assert.ok(document && document.text.replace(/\s+/g, " ").includes(evidence.quote.replace(/\s+/g, " ")), "Quoted document evidence must exist.");
  }
}
console.log("Synthetic live evaluation passed: salary/date contradictions, grammar correction, missing banking evidence and exact quotations.");
console.log("This single case checks obvious errors; it does not establish general visa-review accuracy.");
