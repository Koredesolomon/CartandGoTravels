import { officialExcerpts, type Guidance, type OfficialSource } from "@/lib/consularReview";

const sources: Record<string, Record<string, [string, string][]>> = {
  Canada: {
    "Study Permit": [["IRCC study permit documents", "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents.html"], ["IRCC study permit financial support", "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html"]],
    "Visit / Tourist Visa": [["IRCC visitor eligibility", "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eligibility.html"]],
    "Skilled Worker / Work Visa": [["IRCC work permit routes", "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada.html"]],
  },
  "United Kingdom": {
    "Study Permit": [["UK Student visa documents", "https://www.gov.uk/student-visa/documents-you-must-provide"], ["UK Student visa financial requirements", "https://www.gov.uk/student-visa/money"]],
    "Visit / Tourist Visa": [["UK visitor supporting documents", "https://www.gov.uk/government/publications/visitor-visa-guide-to-supporting-documents/guide-to-supporting-documents-visiting-the-uk"]],
    "Skilled Worker / Work Visa": [["UK Skilled Worker documents", "https://www.gov.uk/skilled-worker-visa/documents-you-must-provide"], ["UK Skilled Worker job requirements", "https://www.gov.uk/skilled-worker-visa/your-job"]],
  },
  "United States": {
    "Study Permit": [["US student visas", "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html"]],
    "Visit / Tourist Visa": [["US visitor visas", "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html"]],
    "Skilled Worker / Work Visa": [["US temporary worker routes", "https://travel.state.gov/content/travel/en/us-visas/employment/temporary-worker-visas.html"]],
  },
};

export function officialPageText(html: string): string {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  return main.replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ").replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code: string) => {
      const value = code.toLowerCase().startsWith("x") ? parseInt(code.slice(1), 16) : Number(code);
      return value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : " ";
    }).replace(/&(amp|nbsp|quot|apos|lt|gt|ndash|mdash|rsquo|lsquo|pound|euro|dollar|cent);/g, (_, name: string) => ({ amp: "&", nbsp: " ", quot: '"', apos: "'", lt: "<", gt: ">", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", pound: "£", euro: "€", dollar: "$", cent: "¢" })[name] ?? " ")
    .replace(/\s+/g, " ").trim();
}

// Only server-owned official URLs are fetched; applicant details are never used in a search or URL.
export async function getConsularGuidance(country: string, visaClass: string): Promise<Guidance> {
  const configured = sources[country]?.[visaClass];
  if (!configured) return { status: "unsupported", sources: [] };
  const results = await Promise.allSettled(configured.map(async ([title, url], index): Promise<OfficialSource> => {
    const response = await fetch(url, { redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10_000), headers: { Accept: "text/html" } });
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) throw new Error("Official guidance unavailable.");
    const html = await response.text();
    if (html.length > 2_000_000) throw new Error("Official guidance too large.");
    const text = officialPageText(html);
    // Reject truncated pages rather than silently omitting requirements at the end.
    if (text.length < 300 || text.length > 60_000 || !/<h1\b/i.test(html) || /access denied|verify you are human|captcha/i.test(text)) throw new Error("Official guidance unreadable.");
    const id = `source-${index + 1}`;
    return { id, title, url, text, retrievedAt: new Date().toISOString(), excerpts: officialExcerpts(id, text) };
  }));
  const loaded = results.flatMap(result => result.status === "fulfilled" ? [result.value] : []);
  return { status: loaded.length === configured.length ? "available" : loaded.length ? "partial" : "unavailable", sources: loaded };
}
