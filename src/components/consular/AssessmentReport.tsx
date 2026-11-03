import type { ReactNode } from "react";
import { WhatsAppLeadActions } from "@/components/ui/WhatsAppLeadActions";
import { provisionalNote, readinessBand, scoreWithheldMessage, SCORE_METHOD_NOTE } from "@/lib/consularReadiness";
import { CRITERIA, LEGAL_CORRECTION_NOTICE, LEGAL_ADDITION_NOTICE, verificationIssueMessage, type ConsularReport, type Evidence, type PolicyEvidence } from "@/lib/consularReview";

const statusLabels = { supported: "Supported by supplied evidence", partial: "Partially supported", missing: "Evidence not supplied", not_applicable: "Not applicable to this route", not_assessable: "Cannot assess yet" };
const issueLabels = { document: "Document", criterion: "Assessment", finding: "Finding", correction: "Correction", addition: "Addition", assessment: "Overall review" };
function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mt-7"><h3 className="mb-3 text-base font-black text-[#07141a]">{title}</h3><div className="space-y-3">{children}</div></section>;
}
function Items({ items }: { items: string[] }) {
  return <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-[#5b6870]">{items.map((item, index) => <li key={index}>{item}</li>)}</ul>;
}

function ReadinessScore({ score, provisional = false, unverified = false, note }: { score: number; provisional?: boolean; unverified?: boolean; note: string }) {
  const percent = Math.max(0, Math.min(100, Math.round(score)));
  const band = readinessBand(percent);
  return <>
    <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-1">
      <p className="font-serif text-5xl font-black leading-none" style={{ color: band.color }}>{percent}%</p>
      <p className="pb-1 text-sm text-[#5b6870]"><span className="font-bold" style={{ color: band.color }}>{band.label}</span> · {unverified ? "estimated, unverified " : provisional ? "provisional " : ""}document readiness</p>
    </div>
    <div role="meter" aria-label="Document readiness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#e6ecef]">
      <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: band.color }} />
    </div>
    <p className="mt-3 text-xs leading-5 text-[#5b6870]">{note}</p>
  </>;
}

export function AssessmentReport({ report, country, visaClass, documentNames, actions }: { report: ConsularReport; country: string; visaClass: string; documentNames: Record<string, string>; actions?: ReactNode }) {
  function EvidenceQuotes({ evidence, policyEvidence }: { evidence: Evidence[]; policyEvidence: PolicyEvidence[] }) {
    return <>
      {evidence.map((item, index) => <blockquote key={`doc-${index}`} className="mt-3 border-l-2 border-[#0098ba] pl-3 text-sm leading-6 text-[#5b6870]"><p className="font-semibold">{documentNames[item.documentId] ?? item.documentId}</p><p className="whitespace-pre-wrap">“{item.quote}”</p></blockquote>)}
      {policyEvidence.map((item, index) => {
        const source = report.guidance.sources.find(source => source.id === item.sourceId);
        return source ? <div key={`policy-${index}`} className="mt-3 text-xs leading-5 text-[#5b6870]"><a href={source.url} target="_blank" rel="noreferrer" className="font-semibold text-[#0098ba] underline">{source.title}</a><p>“{item.quote}”</p></div> : null;
      })}
    </>;
  }
  return <>
    <div className="rounded-lg border border-[#d7dfe5] bg-white p-5 shadow-[0_10px_30px_-22px_rgba(0,29,47,.45)]" data-readiness-card>
      <p className="text-xs font-black uppercase text-[#f0a42f]">Readiness score</p>
      {report.score !== null ? <ReadinessScore score={report.score} note={SCORE_METHOD_NOTE} /> : report.provisionalScore != null ? <ReadinessScore score={report.provisionalScore} provisional note={provisionalNote(report.provisionalCoverage ?? 0, report.provisionalBasis)} unverified={report.provisionalBasis === "unverified"} /> : <p className="mt-3 font-serif text-4xl font-black leading-none text-[#9aa7ae]">N/A</p>}
      {report.score !== null || report.provisionalScore == null ? <p className="mt-4 font-bold text-[#07141a]">{report.statusLabel}</p> : null}
      {report.score === null && report.provisionalScore == null ? <p className="mt-2 text-sm leading-6 text-[#5b6870]">{scoreWithheldMessage(report.reviewStatus)}</p> : null}
    </div>
    {actions ? <div className="mt-4">{actions}</div> : null}
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-black uppercase text-[#0098ba]">Document pre-assessment report</p><span className="rounded-full bg-[#e8f6fb] px-3 py-1 text-xs font-black text-[#0098ba]">AI review + verification</span></div>
    <p className="mt-3 text-sm text-[#5b6870]"><b>Target:</b> {country} | <b>Class:</b> {visaClass}</p>
    <p className="mt-4 rounded-md bg-[#f6fbfd] p-4 text-sm leading-6 text-[#5b6870]">{report.summary}</p>
    <Section title="Documents reviewed">{report.documents.map(doc => <div key={doc.id} className="rounded-md bg-[#f6fbfd] p-3 text-sm leading-6"><p className="font-bold text-[#07141a]">{documentNames[doc.id] ?? doc.id} — {doc.kind}</p><p className="capitalize text-[#0098ba]">{doc.relevance}</p><p className="text-[#5b6870]">{doc.explanation}</p></div>)}</Section>
    <Section title="Evidence assessment">{report.criteria.map(item => <div key={item.key} className="rounded-md border border-[#d7dfe5] p-4"><p className="font-bold text-[#07141a]">{CRITERIA[item.key].label}</p><p className="mt-1 text-xs font-semibold text-[#0098ba]">{statusLabels[item.status]}</p><p className="mt-2 text-sm leading-6 text-[#5b6870]">{item.reason}</p><EvidenceQuotes evidence={item.evidence} policyEvidence={item.policyEvidence} /></div>)}</Section>
    <Section title="Findings">{report.findings.length ? report.findings.map((item, index) => <div key={index} className={`rounded-md border p-4 ${item.type === "risk" ? "border-[#f00000] bg-[#fff0f0]" : item.type === "weak" ? "border-[#f0a42f] bg-[#fff7e8]" : "border-[#0098ba] bg-[#e8f6fb]"}`}><p className="font-bold text-[#07141a]">{item.title}</p><p className="mt-2 text-sm leading-6 text-[#5b6870]">{item.body}</p><EvidenceQuotes evidence={item.evidence} policyEvidence={item.policyEvidence} /></div>) : <p className="text-sm text-[#5b6870]">No specific findings were returned within the reviewed material.</p>}</Section>
    <Section title="Proofreading corrections">{report.proofreading.length ? report.proofreading.map((item, index) => <div key={index} className="rounded-md border border-[#d7dfe5] p-4 text-sm leading-6 text-[#5b6870]"><p className="font-bold text-[#07141a]">{documentNames[item.documentId] ?? item.documentId}</p><p className="mt-2 whitespace-pre-wrap"><b>Original:</b> {item.original}</p><p className="mt-2 whitespace-pre-wrap"><b>Suggested:</b> {item.suggested}</p><p className="mt-2">{item.explanation}</p>{item.requiresLegalReview ? <p className="mt-2 font-semibold text-[#947000]">{LEGAL_CORRECTION_NOTICE}</p> : null}</div>) : <p className="text-sm leading-6 text-[#5b6870]">No verified wording corrections are available. This does not verify the document’s factual claims.</p>}</Section>
    {report.suggestedAdditions?.length ? <Section title="Suggested additions"><p className="text-sm leading-6 text-[#5b6870]">These are proposed new passages. Confirm the facts and complete any placeholders before using them.</p>{report.suggestedAdditions.map((item, index) => <div key={index} className="rounded-md border border-[#d7dfe5] p-4 text-sm leading-6 text-[#5b6870]"><p className="font-bold text-[#07141a]">{documentNames[item.documentId] ?? item.documentId} — {item.title}</p><p className="mt-2"><b>Suggested placement:</b> {item.insertionPoint}</p><p className="mt-2 whitespace-pre-wrap"><b>Proposed addition:</b> {item.proposedText}</p><p className="mt-2">{item.rationale}</p>{item.requiresLegalReview ? <p className="mt-2 font-semibold text-[#947000]">{LEGAL_ADDITION_NOTICE}</p> : null}</div>)}</Section> : null}
    {report.verificationIssues?.length ? <Section title="Items requiring review">{report.verificationIssues.map((item, index) => <div key={index} className="rounded-md bg-[#fff7e8] p-4 text-sm leading-6 text-[#5b6870]"><p className="font-bold text-[#07141a]">{item.documentId ? `${documentNames[item.documentId] ?? "Document"} — ` : ""}{issueLabels[item.item]}{item.index >= 0 ? ` ${item.index + 1}` : ""} withheld</p><p className="mt-2">{verificationIssueMessage(item.code)}</p></div>)}</Section> : null}
    {report.missingEvidence.length ? <Section title="Evidence not supplied"><Items items={report.missingEvidence} /></Section> : null}
    {report.questions.length ? <Section title="Questions to resolve"><Items items={report.questions} /></Section> : null}
    <Section title="Next steps"><Items items={report.roadmap} /></Section>
    <Section title="Official guidance used">
      <p className="text-sm leading-6 text-[#5b6870]">{report.guidance.status === "available" ? "The linked official guidance was retrieved for this review. Local instructions and route-specific exceptions still need checking." : report.guidance.status === "unsupported" ? "Live official guidance is currently connected for Canada, the United Kingdom and the United States. This destination receives a limited text and evidence review." : "Current official guidance could not be fully retrieved. Requirements remain unverified."}</p>
      {report.guidance.sources.map(source => <p key={source.id} className="text-sm leading-6"><a className="font-semibold text-[#0098ba] underline" href={source.url} target="_blank" rel="noreferrer">{source.title}</a><span className="block text-xs text-[#5b6870]">Retrieved {new Date(source.retrievedAt).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })} (Lagos)</span></p>)}
    </Section>
    <Section title="Review limits"><Items items={report.limitations} /></Section>
    <p className="mt-5 rounded-md bg-[#fff7e8] p-4 text-xs leading-5 text-[#93670f]">{report.disclaimer}</p>
    <div className="mt-7"><WhatsAppLeadActions message={`Hello Cart&Go, I want a human review of my document pre-assessment.\nTarget: ${country}\nVisa class: ${visaClass}\nStatus: ${report.statusLabel}`} /></div>
  </>;
}
