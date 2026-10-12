export type Flag = {
  type: "risk" | "weak" | "excellent";
  title: string;
  body: string;
};

export type LocalRewriteAnalysis = {
  score: number;
  status: {
    label: string;
    className: string;
  };
  completeness: number;
  clarity: number;
  ties: number;
  flags: Flag[];
  roadmap: string[];
  showPaySmallSmall: boolean;
  summary?: string;
  disclaimer?: string;
  source?: "ai" | "local";
};

function countHits(text: string, keywords: readonly string[]) {
  return keywords.filter((keyword) => text.includes(keyword)).length;
}

export function analyzeDocument(text: string): LocalRewriteAnalysis & { fundsHits: number } {
  const lower = text.toLowerCase();
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const fundsHits = countHits(lower, [
    "bank statement",
    "savings",
    "sponsor",
    "salary",
    "income",
    "gic",
    "account balance",
    "payslip",
    "business income",
  ]);
  const intentHits = countHits(lower, [
    "intend to return",
    "purpose of my studies",
    "after completing",
    "plan to return",
    "upon completion",
    "career goal",
    "return to nigeria",
    "job offer",
    "why i chose",
  ]);
  const tiesHits = countHits(lower, [
    "family",
    "property",
    "business",
    "employment",
    "job",
    "children",
    "spouse",
    "house",
    "land",
    "parents",
  ]);
  const riskHits = countHits(lower, [
    "loan",
    "gift",
    "borrowed",
    "donation",
    "uncle will send",
    "friend will send",
  ]);

  const completeness = Math.min(30, Math.round((fundsHits / 3) * 30));
  const clarity = Math.min(30, (intentHits > 0 ? 20 : 8) + Math.round(wordCount / 40));
  let ties = Math.min(32, tiesHits * 10) + (fundsHits > 0 ? 8 : 0);

  if (riskHits > 0 && fundsHits === 0) {
    ties = Math.max(0, ties - 14);
  }

  ties = Math.min(40, ties);

  const score = Math.max(0, Math.min(100, completeness + clarity + ties));
  const flags: Flag[] = [];

  if (wordCount < 60) {
    flags.push({
      type: "weak",
      title: "Insufficient proof",
      body: "This document is too brief for a consular officer to assess intent or home-country ties. Expand it with specific, verifiable detail.",
    });
  }

  if (intentHits === 0) {
    flags.push({
      type: "weak",
      title: "Weak intent",
      body: "No clear statement explains why this route was chosen or what happens afterward. Officers look for a specific, logical narrative.",
    });
  }

  if (riskHits > 0 && fundsHits === 0) {
    flags.push({
      type: "risk",
      title: "Funding risk",
      body: "Informal third-party funding with no source-of-funds explanation can look like an unexplained lump-sum deposit pattern.",
    });
  }

  if (tiesHits === 0) {
    flags.push({
      type: "weak",
      title: "Weak home-country ties",
      body: "No family, property, employment or business ties were found. This is one of the most common refusal drivers.",
    });
  }

  if (flags.length === 0) {
    flags.push({
      type: "excellent",
      title: "Strong structure",
      body: "The document reads as specific, complete and connected to home-country ties. No structural red flags were detected.",
    });
  }

  const roadmap = [];

  if (completeness < 20) {
    roadmap.push("Attach traceable financial evidence, including statement history and an explanation for large deposits.");
  }
  if (clarity < 20) {
    roadmap.push("Rewrite the purpose section to name the programme, employer or itinerary and explain why it is the logical next step.");
  }
  if (ties < 20) {
    roadmap.push("Add concrete ties such as employment letters, business registration, family responsibilities or property documents.");
  }
  if (riskHits > 0 && fundsHits === 0) {
    roadmap.push("Replace informal funding language with a sponsor affidavit and the sponsor's own income evidence.");
  }

  roadmap.push("Have a CartandGo visa officer verify the finished file before submission or embassy payment.");

  return {
    score,
    status:
      score >= 80
        ? { label: "Excellent to apply", className: "bg-[#dff4e9] text-[#1e7a4c]" }
        : score >= 50
          ? { label: "Good profile", className: "bg-[#fdf2da] text-[#93670f]" }
          : { label: "Critical gaps", className: "bg-[#fbe4e1] text-[#b5473b]" },
    completeness,
    clarity,
    ties,
    flags,
    roadmap,
    showPaySmallSmall: completeness < 20 || fundsHits === 0,
    summary: "This local fallback found basic readiness issues using keyword checks. Configure the AI backend for a deeper review.",
    disclaimer: "This fallback check is informational and is not legal advice, immigration advice, or a visa decision.",
    source: "local",
    fundsHits,
  };
}
