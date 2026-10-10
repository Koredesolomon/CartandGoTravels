type SourceDocument = { id: string; text: string };
export type SourcePassage = { documentId: string; excerptId: string; quote: string };

export function proofreadingPassages(documents: SourceDocument[]): SourcePassage[] {
  return documents.flatMap(document => {
    const passages: SourcePassage[] = [];
    for (const paragraph of document.text.split(/\n\s*\n/)) {
      let start = 0;
      while (start < paragraph.length) {
        let end = Math.min(start + 4000, paragraph.length);
        if (end < paragraph.length) {
          const boundary = paragraph.lastIndexOf(" ", end);
          if (boundary > start) end = boundary;
        }
        const quote = paragraph.slice(start, end).trim();
        if (quote) passages.push({ documentId: document.id, excerptId: `${document.id}-paragraph-${passages.length + 1}`, quote });
        start = end;
        while (start < paragraph.length && /\s/.test(paragraph[start])) start++;
      }
    }
    return passages;
  });
}

// Recover formatting differences only. Never guess missing or changed words,
// identifiers, dates or amounts, or search a different applicant document.
export function createSourceMatcher(source: string) {
  let folded: { value: string; starts: number[]; ends: number[] } | undefined;
  return (candidate: string): string | null => {
    const query = candidate.trim();
    const direct = source.indexOf(query);
    if (query && direct >= 0) return source.slice(direct, direct + query.length);
    if (!query) return null;
    if (!folded) {
      const parts: string[] = [], starts: number[] = [], ends: number[] = [];
      const segments = new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(source);
      for (const segment of segments) {
        for (const character of segment.segment.normalize("NFC")) {
          if (/\s/.test(character)) {
            if (parts.at(-1) === " ") { ends[ends.length - 1] = segment.index + segment.segment.length; continue; }
            parts.push(" "); starts.push(segment.index); ends.push(segment.index + segment.segment.length);
          } else {
            // Offsets correspond to UTF-16 indices used by String.indexOf.
            for (let index = 0; index < character.length; index++) {
              parts.push(character[index]); starts.push(segment.index); ends.push(segment.index + segment.segment.length);
            }
          }
        }
      }
      folded = { value: parts.join(""), starts, ends };
    }
    const normalizedQuery = query.normalize("NFC").replace(/\s+/g, " ");
    const index = folded.value.indexOf(normalizedQuery);
    return index < 0 ? null : source.slice(folded.starts[index], folded.ends[index + normalizedQuery.length - 1]);
  };
}

export function recoverPassage<T extends { excerptId: string }>(passages: T[], reference: string): T | undefined {
  const exact = passages.find(passage => passage.excerptId === reference);
  if (exact) return exact;
  const identifier = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const matches = passages.filter(passage => identifier(passage.excerptId) === identifier(reference));
  return matches.length === 1 ? matches[0] : undefined;
}

export function isLegalDocument(name: string, kind: string, source: string) {
  return /\b(?:deed|assignment|contract|agreement|affidavit|mortgage|conveyance|lease|legal)\b/i.test(`${name} ${kind} ${source.slice(0, 500)}`);
}

export function legalTermsPreserved(original: string, suggested: string) {
  const terms = /\b(?:freehold|leasehold|irrevocab(?:le|ly)|revocab(?:le|ly)|unconditional(?:ly)?|conditional(?:ly)?|waiv(?:e|es|ed|er)|indemnif(?:y|ies|ied|ication)|joint(?:ly)?|several(?:ly)?|exclusive(?:ly)?|nonexclusive|warrant(?:s|ed|y|ies)?|covenant(?:s|ed)?|assign(?:s|ed|ment)?|transfer(?:s|red)?|grant(?:s|ed)?|release(?:s|d)?|consent(?:s|ed)?)\b/gi;
  const protectedTerms = (value: string) => (value.match(terms) ?? []).map(term => term.toLowerCase()).sort();
  return JSON.stringify(protectedTerms(original)) === JSON.stringify(protectedTerms(suggested));
}

export function additionFactsSupported(source: string, proposed: string) {
  // Unknown facts must remain placeholders in a proposal. Commitments in new
  // clauses are proposals for review, never claims about the existing deed.
  const draft = proposed.replace(/\[[^\]]*\]/g, "");
  if (/\b(?:has|have|was|were|is|are)\s+(?:already\s+)?(?:paid|signed|executed|verified|authenticated)\b|\b(?:owns?|owned)\b|\b(?:free of (?:all )?encumbrances|clear title|unencumbered|paid in full|legally valid)\b/i.test(draft)) return false;
  const facts = /\b\d[\d,]*(?:\.\d+)?\b|\b(?:[A-Za-z]+\d[\w-]*|\d+[A-Za-z][\w-]*)\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b|\b(?:USD|GBP|EUR|NGN|CAD|AUD|NZD|CHF|JPY|CNY|INR|ZAR|GHS|KES|AED|SAR|QAR)\b/gi;
  const key = (value: string) => value.toLowerCase().replace(/,/g, "");
  const known = new Set((source.match(facts) ?? []).map(key));
  if ((draft.match(facts) ?? []).some(fact => !known.has(key(fact)))) return false;
  // Reject new concrete multiword names; use placeholders for unsupplied parties.
  const names = draft.match(/\b\p{Lu}[\p{L}'’-]+(?:\s+\p{Lu}[\p{L}'’-]+)+\b/gu) ?? [];
  const roles = /^(?:The |This |A |An )?(?:Assignor|Assignee|Seller|Buyer|Vendor|Purchaser|Applicant|Party|Parties|Owner|Witness|Deed|Assignment|Agreement|Clause|Title|Dispute|Resolution|Governing|Law|Execution|Signature|Signatures|Legal|Review|Required)(?:\s+(?:of |and |the )?(?:Assignor|Assignee|Seller|Buyer|Vendor|Purchaser|Applicant|Party|Parties|Owner|Witness|Deed|Assignment|Agreement|Clause|Title|Dispute|Resolution|Governing|Law|Execution|Signature|Signatures|Legal|Review|Required))*$/i;
  return names.every(name => roles.test(name) || source.toLowerCase().replace(/\s+/g, " ").includes(name.toLowerCase().replace(/\s+/g, " ")));
}
