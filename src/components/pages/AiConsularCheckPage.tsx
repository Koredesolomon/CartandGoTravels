"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { WhatsAppLeadActions } from "@/components/ui/WhatsAppLeadActions";

const sampleWeakSop =
  "I want to study in Canada because it is a good country. My uncle will send me money for my fees. I have finished my first degree and I want to do another one in business. I will come back to Nigeria after school if I get a good job here. Thank you for considering my application.";

const countries = [
  "Canada",
  "United Kingdom",
  "Germany",
  "Schengen (Europe)",
  "Ireland",
  "Finland",
  "France",
  "Malaysia",
  "Portugal",
] as const;

const visaClasses = [
  "Study Permit",
  "Skilled Worker / Work Visa",
  "Visit / Tourist Visa",
] as const;

const interviewSets = {
  "Canada Study Permit": [
    "Why did you choose to study in Canada specifically, and why now?",
    "Walk me through the source of the funds shown in your bank statement.",
    "What ties do you have to Nigeria that would bring you back after your studies?",
    "What do you know about your specific programme, and how does it fit your career plan?",
    "If your study permit is refused, what will you do?",
  ],
  "UK Skilled Worker": [
    "Why did this employer choose to sponsor you specifically for this role?",
    "Can you describe your day-to-day responsibilities in the role you are being sponsored for?",
    "What ties do you currently have to Nigeria?",
    "How does this role compare to your current or most recent job in Nigeria?",
    "What is your plan if your Certificate of Sponsorship is withdrawn before you travel?",
  ],
  "Germany National D-Visa": [
    "Why did you choose Germany over other study destinations?",
    "How did you fund your blocked account, and where did that money originally come from?",
    "What connects you to Nigeria that would bring you back after your studies or job-search period?",
    "What do you know about the university and programme you have been admitted to?",
    "What will you do if your visa application is delayed or refused?",
  ],
  "Schengen Tourist Visa": [
    "What is the specific purpose of this trip, and why this itinerary?",
    "Who is funding this trip, and can that be traced to a legitimate income source?",
    "What obligations are waiting for you back in Nigeria?",
    "Can you walk me through your day-by-day itinerary for the trip?",
    "Why should I believe you will leave the Schengen area before your visa expires?",
  ],
} as const;

type InterviewPathway = keyof typeof interviewSets;
type ActiveTab = "document" | "interview";

type Flag = {
  type: "risk" | "weak" | "excellent";
  title: string;
  body: string;
};

type Analysis = {
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

type ApiReport = {
  score: number;
  statusLabel: string;
  completeness: number;
  clarity: number;
  ties: number;
  flags: Flag[];
  roadmap: string[];
  showPaySmallSmall: boolean;
  summary: string;
  disclaimer: string;
};

const inputClass =
  "mt-1.5 w-full rounded-md border border-[#d7dfe5] bg-[#fbf8f2] px-3 py-2.5 text-[14.5px] text-[#1b1f27] outline-none transition focus:border-[#0098ba] focus:ring-2 focus:ring-[#0098ba]/20";

function countHits(text: string, keywords: readonly string[]) {
  return keywords.filter((keyword) => text.includes(keyword)).length;
}

function analyzeDocument(text: string): Analysis {
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
    roadmap.push(
      "Attach traceable financial evidence, including statement history and an explanation for large deposits.",
    );
  }

  if (clarity < 20) {
    roadmap.push(
      "Rewrite the purpose section to name the programme, employer or itinerary and explain why it is the logical next step.",
    );
  }

  if (ties < 20) {
    roadmap.push(
      "Add concrete ties such as employment letters, business registration, family responsibilities or property documents.",
    );
  }

  if (riskHits > 0 && fundsHits === 0) {
    roadmap.push(
      "Replace informal funding language with a sponsor affidavit and the sponsor's own income evidence.",
    );
  }

  roadmap.push(
    "Have a CartandGo visa officer verify the finished file before submission or embassy payment.",
  );

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
    summary:
      "This local fallback found basic readiness issues using keyword checks. Configure the AI backend for a deeper review.",
    disclaimer:
      "This fallback check is informational and is not legal advice, immigration advice, or a visa decision.",
    source: "local",
  };
}

function flagClass(type: Flag["type"]) {
  if (type === "excellent") {
    return "border-[#0098ba] bg-[#e8f6fb]";
  }

  if (type === "weak") {
    return "border-[#f0a42f] bg-[#fff7e8]";
  }

  return "border-[#f00000] bg-[#fff0f0]";
}

function statusClass(label: string, score: number) {
  if (label === "Excellent to apply" || score >= 80) {
    return "bg-[#dff4e9] text-[#1e7a4c]";
  }

  if (label === "Good profile" || score >= 50) {
    return "bg-[#fdf2da] text-[#93670f]";
  }

  return "bg-[#fbe4e1] text-[#b5473b]";
}

function normalizeApiReport(report: ApiReport): Analysis {
  return {
    score: report.score,
    status: {
      label: report.statusLabel,
      className: statusClass(report.statusLabel, report.score),
    },
    completeness: report.completeness,
    clarity: report.clarity,
    ties: report.ties,
    flags: report.flags,
    roadmap: report.roadmap,
    showPaySmallSmall: report.showPaySmallSmall,
    summary: report.summary,
    disclaimer: report.disclaimer,
    source: "ai",
  };
}

export function AiConsularCheckPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("document");
  const [country, setCountry] = useState<(typeof countries)[number]>("Canada");
  const [visaClass, setVisaClass] = useState<(typeof visaClasses)[number]>("Study Permit");
  const [documentText, setDocumentText] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [assessmentError, setAssessmentError] = useState("");
  const [isAssessing, setIsAssessing] = useState(false);
  const [pathway, setPathway] = useState<InterviewPathway>("Canada Study Permit");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [answerDraft, setAnswerDraft] = useState("");

  const interviewQuestions = interviewSets[pathway];
  const currentQuestion = interviewQuestions[questionIndex];
  const interviewComplete = questionIndex >= interviewQuestions.length;
  const answeredWords = useMemo(
    () => answers.join(" ").trim().split(/\s+/).filter(Boolean).length,
    [answers],
  );
  const interviewScore = Math.min(100, 35 + answers.length * 10 + Math.min(25, answeredWords));

  async function runAssessment() {
    const trimmedDocument = documentText.trim();

    setAssessmentError("");

    if (!trimmedDocument) {
      setAssessmentError("Paste a document first so the check has something to review.");
      setAnalysis(null);
      return;
    }

    setIsAssessing(true);

    try {
      const response = await fetch("/api/ai-consular-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country,
          visaClass,
          documentText: trimmedDocument,
        }),
      });

      const data = (await response.json()) as {
        report?: ApiReport;
        error?: string;
      };

      if (!response.ok || !data.report) {
        throw new Error(data.error ?? "The AI review could not be completed.");
      }

      setAnalysis(normalizeApiReport(data.report));
    } catch (error) {
      const fallback = analyzeDocument(trimmedDocument);
      setAnalysis(fallback);
      setAssessmentError(
        error instanceof Error
          ? `${error.message} Showing a local fallback check for now.`
          : "The AI review could not be completed. Showing a local fallback check for now.",
      );
    } finally {
      setIsAssessing(false);
    }
  }

  function submitAnswer() {
    const trimmed = answerDraft.trim();

    if (!trimmed) {
      return;
    }

    setAnswers((current) => [...current, trimmed]);
    setAnswerDraft("");
    setQuestionIndex((current) => current + 1);
  }

  function resetInterview(nextPathway = pathway) {
    setPathway(nextPathway);
    setAnswers([]);
    setAnswerDraft("");
    setQuestionIndex(0);
  }

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#07141a] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(7,20,26,.98),rgba(0,60,78,.82),rgba(0,152,186,.28))]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-[#f0a42f] text-[#07141a]">
              <Icon name="Shield" />
            </div>
            <p className="mt-8 text-xs font-black uppercase text-[#04f1f1]">
              AI Consular Check
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.04] md:text-7xl">
              Meet your virtual consular officer.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78">
              Before you pay an embassy fee, review your documents and practise
              interview answers against the same credibility, funding and
              home-ties questions that often decide applications.
            </p>
          </div>

          <div className="rounded-lg border border-white/15 bg-white p-5 text-[#07141a] shadow-[0_30px_90px_-42px_rgba(0,0,0,.75)] md:p-7">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["01", "Document scan"],
                ["02", "Interview drill"],
                ["03", "Fix roadmap"],
              ].map(([number, label]) => (
                <div key={number} className="rounded-md bg-[#e8f6fb] p-4">
                  <span className="text-xs font-black text-[#0098ba]">{number}</span>
                  <p className="mt-2 text-sm font-black text-[#07141a]">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 rounded-md bg-[#fff7e8] p-4 text-sm leading-6 text-[#5b6870]">
              This is a private readiness tool. It does not submit information to
              any embassy and should be followed by a human document review.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#f6fbfd] px-5 py-18 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap gap-2 border-b border-[#d7dfe5]">
            {[
              ["document", "Document Pre-Assessment"],
              ["interview", "Practice Interview"],
            ].map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab as ActiveTab)}
                className={`mb-[-1px] border-b-2 px-4 py-3 text-sm font-black transition ${
                  activeTab === tab
                    ? "border-[#f0a42f] text-[#07141a]"
                    : "border-transparent text-[#5b6870] hover:text-[#07141a]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "document" ? (
            <div className="grid gap-8 lg:grid-cols-[.95fr_1.05fr]">
              <div className="rounded-lg border border-[#d7dfe5] bg-white p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-[12.5px] font-semibold text-[#07141a]">
                    Target Country
                    <select
                      className={inputClass}
                      value={country}
                      onChange={(event) =>
                        setCountry(event.target.value as (typeof countries)[number])
                      }
                    >
                      {countries.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-[12.5px] font-semibold text-[#07141a]">
                    Visa Class
                    <select
                      className={inputClass}
                      value={visaClass}
                      onChange={(event) =>
                        setVisaClass(event.target.value as (typeof visaClasses)[number])
                      }
                    >
                      {visaClasses.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="mt-4 block text-[12.5px] font-semibold text-[#07141a]">
                  Paste document text
                  <textarea
                    value={documentText}
                    onChange={(event) => setDocumentText(event.target.value)}
                    placeholder="Statement of purpose, sponsor affidavit, financial summary, employment letter..."
                    className={`${inputClass} min-h-56 resize-y leading-7`}
                    required
                  />
                </label>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentText(sampleWeakSop);
                      setAnalysis(null);
                      setAssessmentError("");
                    }}
                    className="rounded-md border border-[#0098ba] px-4 py-2 text-sm font-bold text-[#0098ba] transition hover:bg-[#e8f6fb]"
                  >
                    Load sample weak SOP
                  </button>
                  <button
                    type="button"
                    onClick={runAssessment}
                    disabled={isAssessing}
                    className="rounded-md bg-[#f0a42f] px-5 py-2 text-sm font-black text-[#07141a] transition hover:bg-[#ffb347] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isAssessing ? "Checking..." : "Run Pre-Assessment Check"}
                  </button>
                </div>
                {assessmentError ? (
                  <p className="mt-4 rounded-md bg-[#fff7e8] p-3 text-sm leading-6 text-[#93670f]">
                    {assessmentError}
                  </p>
                ) : null}
                <p className="mt-4 text-xs leading-5 text-[#5b6870]">
                  For privacy, only the text you paste here is sent to the server-side
                  AI review endpoint. Do not paste passwords, payment details or
                  unrelated private records.
                </p>
              </div>

              <div className="rounded-lg border border-[#d7dfe5] bg-white p-6">
                {analysis ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase text-[#0098ba]">
                        Consular pre-assessment report
                      </p>
                      <span className="rounded-full bg-[#e8f6fb] px-3 py-1 text-xs font-black text-[#0098ba]">
                        {analysis.source === "ai" ? "AI review" : "Local fallback"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#5b6870]">
                      <b>Target:</b> {country} | <b>Class:</b> {visaClass}
                    </p>
                    {analysis.summary ? (
                      <p className="mt-4 rounded-md bg-[#f6fbfd] p-4 text-sm leading-6 text-[#5b6870]">
                        {analysis.summary}
                      </p>
                    ) : null}

                    <div className="mt-6 flex flex-wrap items-center gap-5">
                      <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-[7px] border-[#d7dfe5]">
                        <span className="font-serif text-3xl font-black text-[#07141a]">
                          {analysis.score}
                        </span>
                        <span className="text-xs text-[#5b6870]">/ 100</span>
                      </div>
                      <span
                        className={`rounded-full px-4 py-2 text-sm font-black ${analysis.status.className}`}
                      >
                        {analysis.status.label}
                      </span>
                    </div>

                    <div className="mt-8 space-y-3 text-sm leading-6 text-[#5b6870]">
                      <p>
                        <b>Intent and credibility ({analysis.clarity}/30):</b>{" "}
                        {analysis.clarity >= 20
                          ? "A reasonably clear statement of purpose was found."
                          : "The stated purpose is vague or generic."}
                      </p>
                      <p>
                        <b>Financial sufficiency ({analysis.completeness}/30):</b>{" "}
                        {analysis.completeness >= 20
                          ? "Financial evidence appears traceable."
                          : "Financial evidence is thin or not clearly traceable."}
                      </p>
                      <p>
                        <b>Home-country ties ({analysis.ties}/40):</b>{" "}
                        {analysis.ties >= 25
                          ? "Reasonable evidence of ties was found."
                          : "Little evidence of ties was found."}
                      </p>
                    </div>

                    <ReportSection title="Flags">
                      {analysis.flags.map((flag) => (
                        <div
                          key={`${flag.title}-${flag.body}`}
                          className={`rounded-md border-l-4 p-4 text-sm leading-6 ${flagClass(flag.type)}`}
                        >
                          <b className="block text-[#07141a]">{flag.title}</b>
                          <span className="text-[#5b6870]">{flag.body}</span>
                        </div>
                      ))}
                    </ReportSection>

                    <ReportSection title="Roadmap to improve">
                      {analysis.roadmap.map((step, index) => (
                        <div key={step} className="flex gap-3 text-sm leading-6">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#07141a] text-xs font-black text-white">
                            {index + 1}
                          </span>
                          <span className="text-[#5b6870]">{step}</span>
                        </div>
                      ))}
                    </ReportSection>

                    {analysis.disclaimer ? (
                      <p className="mt-6 rounded-md bg-[#fff7e8] p-4 text-xs leading-5 text-[#93670f]">
                        {analysis.disclaimer}
                      </p>
                    ) : null}

                    <div className="mt-7 flex flex-wrap gap-3">
                      <WhatsAppLeadActions
                        message={`Hello Cart&Go, I want help with my AI Consular Check report.\nTarget: ${country}\nVisa class: ${visaClass}\nScore: ${analysis.score}/100\nStatus: ${analysis.status.label}`}
                      />
                      {analysis.showPaySmallSmall ? (
                        <Link
                          href="/services?service=pay-small-small"
                          className="rounded-md border border-[#07141a] px-5 py-3 text-sm font-black text-[#07141a] transition hover:bg-[#07141a] hover:text-white"
                        >
                          Activate Pay Small Small
                        </Link>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-96 flex-col justify-center rounded-md bg-[#e8f6fb] p-6">
                    <Icon name="Search" className="h-10 w-10 text-[#0098ba]" />
                    <h2 className="mt-5 font-serif text-3xl text-[#07141a]">
                      Your readiness report will appear here.
                    </h2>
                    <p className="mt-3 max-w-xl leading-7 text-[#5b6870]">
                      Paste a document or load the sample, then run the check to
                      see score, vulnerabilities and practical next steps.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
              <div className="rounded-lg border border-[#d7dfe5] bg-white p-6">
                <label className="block text-[12.5px] font-semibold text-[#07141a]">
                  Choose a pathway
                  <select
                    className={inputClass}
                    value={pathway}
                    onChange={(event) => resetInterview(event.target.value as InterviewPathway)}
                  >
                    {Object.keys(interviewSets).map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <p className="mt-4 text-sm leading-6 text-[#5b6870]">
                  Practise one question at a time. The scorecard rewards complete,
                  specific answers that explain funds, purpose and ties.
                </p>
                <button
                  type="button"
                  onClick={() => resetInterview()}
                  className="mt-5 rounded-md bg-[#f0a42f] px-5 py-3 text-sm font-black text-[#07141a] transition hover:bg-[#ffb347]"
                >
                  Restart practice
                </button>
              </div>

              <div className="rounded-lg border border-[#d7dfe5] bg-white p-6">
                {!interviewComplete ? (
                  <>
                    <p className="text-xs font-black uppercase text-[#0098ba]">
                      Question {questionIndex + 1} of {interviewQuestions.length}
                    </p>
                    <div className="mt-4 rounded-md bg-[#07141a] p-5 text-white">
                      <p className="max-w-none text-base leading-7 text-white/85">
                        {currentQuestion}
                      </p>
                    </div>

                    {answers.length > 0 ? (
                      <div className="mt-5 space-y-3">
                        {answers.map((answer, index) => (
                          <div key={`${answer}-${index}`} className="rounded-md bg-[#f6fbfd] p-4">
                            <p className="text-xs font-black text-[#0098ba]">
                              Answer {index + 1}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[#5b6870]">
                              {answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                      <input
                        value={answerDraft}
                        onChange={(event) => setAnswerDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            submitAnswer();
                          }
                        }}
                        placeholder="Type your answer..."
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={submitAnswer}
                        className="rounded-md bg-[#f0a42f] px-5 py-3 text-sm font-black text-[#07141a] transition hover:bg-[#ffb347]"
                      >
                        Send
                      </button>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-xs font-black uppercase text-[#0098ba]">
                      Interview scorecard
                    </p>
                    <h2 className="mt-3 font-serif text-4xl text-[#07141a]">
                      Practice complete.
                    </h2>
                    <div className="mt-6 flex flex-wrap items-center gap-5">
                      <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-[7px] border-[#d7dfe5]">
                        <span className="font-serif text-3xl font-black text-[#07141a]">
                          {interviewScore}
                        </span>
                        <span className="text-xs text-[#5b6870]">/ 100</span>
                      </div>
                      <p className="max-w-xl text-sm leading-7 text-[#5b6870]">
                        Strong answers should be specific, consistent with your
                        documents and supported by traceable evidence. Review weak
                        answers with a CartandGo advisor before interview day.
                      </p>
                    </div>
                    <div className="mt-7 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => resetInterview()}
                        className="rounded-md bg-[#f0a42f] px-5 py-3 text-sm font-black text-[#07141a] transition hover:bg-[#ffb347]"
                      >
                        Practise again
                      </button>
                      <Link
                        href="/contact"
                        className="rounded-md border border-[#07141a] px-5 py-3 text-sm font-black text-[#07141a] transition hover:bg-[#07141a] hover:text-white"
                      >
                        Book interview prep
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-7">
      <h3 className="mb-3 text-xs font-black uppercase text-[#f0a42f]">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
