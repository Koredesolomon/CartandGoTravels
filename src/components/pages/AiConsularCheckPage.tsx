"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { UploadCard } from "@/components/ui/UploadCard";
import { worldCountries } from "@/data/countries";
import { ItineraryPlanner } from "@/components/itinerary/ItineraryPlanner";
import { extractDocumentText } from "@/lib/documentText";
import { AssessmentAccessError, readAssessmentFiles, validateAssessmentFiles } from "@/lib/assessmentFiles";
import { requestConsularResult } from "@/lib/consularRequest";
import { MAX_ASSESSMENT_CHARS, type ConsularReport } from "@/lib/consularReview";
import { AssessmentReport } from "@/components/consular/AssessmentReport";
import { DocumentPdfDownload } from "@/components/consular/DocumentPdfDownload";
import { CvTemplatePicker } from "@/components/consular/CvTemplatePicker";
import { CvPdfPreview } from "@/components/consular/CvPdfPreview";
import type { CvTemplateId } from "@/lib/cvTemplates";
import { CvScratchBuilder } from "@/components/consular/CvScratchBuilder";
import { cvCountryProfile, emptyCvBuilder, type CvBuilderData, type CvDraft } from "@/lib/cvBuilder";

const visaClasses = [
  "Study Permit",
  "Skilled Worker / Work Visa",
  "Visit / Tourist Visa",
] as const;

const toolTabs = [
  ["document", "Pre-Assessment"],
  ["rewrite", "Rewrite My Document"],
  ["cv", "CV & Resume"],
  ["cover", "Cover Letter"],
  ["appointments", "Appointments"],
  ["itinerary", "Itinerary Planner"],
  ["interview", "Practice Interview"],
] as const;

type ActiveTool = (typeof toolTabs)[number][0];
type EntryMode = "upload" | "paste" | "scratch";
type InterviewQuestion = readonly [string, string];

const appointmentCentres = {
  "Biometrics Enrolment": ["Lagos(VFS Global)", "Abuja(VFS global)", "BLS", "TLS"],
  "Medical Examination": ["Lagos(QLife)", "Abuja(QLife)", "IOM(Lagos)", "IOM(Abuja)", "IOM(Benin)", "St Nicholas Hospital"],
} as const;
type AppointmentType = keyof typeof appointmentCentres;

const interviewSets = {
  Study: {
    "Canada Study Permit": [
      ["Why did you choose to study in Canada specifically, and why now?", "Destination & Intent"],
      ["Walk me through the source of the funds shown in your bank statement.", "Funding Legitimacy"],
      ["What ties do you have to Nigeria that would bring you back after your studies?", "Home Country Ties"],
      ["What do you know about your specific programme, and how does it fit your career plan?", "Programme Knowledge"],
      ["Why this school and not a more affordable one closer to home?", "Destination & Intent"],
      ["Have you ever been refused a visa to Canada or any other country before?", "Prior Immigration History"],
      ["If your study permit is refused, what will you do?", "Contingency Planning"],
    ],
    "UK Student Visa": [
      ["Why did you choose this UK institution over others offering a similar course?", "Programme Knowledge"],
      ["How will you meet the maintenance funds requirement for the full length of your course?", "Funding Legitimacy"],
      ["What are your plans immediately after completing this course?", "Contingency Planning"],
      ["What ties, family, property or career, do you have in Nigeria?", "Home Country Ties"],
      ["Have you passed the English language requirement for this course?", "Programme Knowledge"],
    ],
    "Germany National D-Visa (Study)": [
      ["Why did you choose Germany over other study destinations?", "Destination & Intent"],
      ["How did you fund your blocked account, and where did that money originally come from?", "Funding Legitimacy"],
      ["What connects you to Nigeria that would bring you back after your studies or job-search period?", "Home Country Ties"],
      ["What do you know about the university and programme you have been admitted to?", "Programme Knowledge"],
      ["What will you do if your visa application is delayed or refused?", "Contingency Planning"],
    ],
    "USA F-1 Student Visa": [
      ["What school issued your I-20, and why did you choose that specific programme?", "Programme Knowledge"],
      ["Who is sponsoring your studies, and how do their finances support the full cost?", "Funding Legitimacy"],
      ["What ties will bring you back to Nigeria after this programme?", "Home Country Ties"],
      ["Why not study this same course in Nigeria or a cheaper destination?", "Destination & Intent"],
      ["US law presumes immigrant intent unless you prove otherwise. How do you prove otherwise?", "Contingency Planning"],
    ],
  },
  Work: {
    "UK Skilled Worker": [
      ["Why did this employer choose to sponsor you specifically for this role?", "Destination & Intent"],
      ["Can you describe your day-to-day responsibilities in the sponsored role?", "Programme Knowledge"],
      ["What ties do you currently have to Nigeria?", "Home Country Ties"],
      ["What is the salary being offered, and does it meet the going rate?", "Funding Legitimacy"],
      ["What is your plan if your Certificate of Sponsorship is withdrawn before you travel?", "Contingency Planning"],
    ],
    "Canada Work Permit": [
      ["What does your LMIA or exemption cover, and why were you selected for this role?", "Programme Knowledge"],
      ["How does your work experience in Nigeria qualify you for this position?", "Programme Knowledge"],
      ["What ties to Nigeria remain while you work abroad?", "Home Country Ties"],
      ["Who is your employer, and how did the job offer come about?", "Destination & Intent"],
      ["What will you do at the end of your work permit validity?", "Contingency Planning"],
    ],
    "UAE / Gulf Employment Visa": [
      ["How did you secure this job offer, and have you verified the employer directly?", "Destination & Intent"],
      ["What is your monthly salary, and how does it compare to the cost of living there?", "Funding Legitimacy"],
      ["What family or financial obligations do you have back home?", "Home Country Ties"],
      ["Do you have a copy of your employment contract, and do the terms match what was promised?", "Programme Knowledge"],
    ],
  },
  Visit: {
    "Schengen Tourist Visa": [
      ["What is the specific purpose of this trip, and why this itinerary?", "Destination & Intent"],
      ["Who is funding this trip, and can it be traced to a legitimate income source?", "Funding Legitimacy"],
      ["What obligations are waiting for you back in Nigeria?", "Home Country Ties"],
      ["Can you walk me through your day-by-day itinerary?", "Programme Knowledge"],
      ["Why should I believe you will leave the Schengen area before your visa expires?", "Contingency Planning"],
    ],
    "UK Visit Visa": [
      ["What is the main purpose of this visit, and where will you stay?", "Destination & Intent"],
      ["How is this trip funded, and can you show a clear paper trail?", "Funding Legitimacy"],
      ["What is pulling you back to Nigeria at the end of the trip?", "Home Country Ties"],
      ["Do you have return or onward flight booking already?", "Programme Knowledge"],
    ],
    "US B1/B2 Visitor Visa": [
      ["What is the purpose of your trip to the United States?", "Destination & Intent"],
      ["Who is paying for this trip, and what do you do for a living?", "Funding Legitimacy"],
      ["What do you own or owe in Nigeria that requires you to return?", "Home Country Ties"],
      ["How long do you intend to stay, and can you show your travel plans?", "Programme Knowledge"],
    ],
  },
} as const;

type InterviewCategory = keyof typeof interviewSets;

type Flag = {
  type: "risk" | "weak" | "excellent";
  title: string;
  body: string;
};

type LocalRewriteAnalysis = {
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

const inputClass =
  "mt-1.5 w-full rounded-md border border-[#d7dfe5] bg-[#fbf8f2] px-3 py-2.5 text-[14.5px] text-[#1b1f27] outline-none transition focus:border-[#0098ba] focus:ring-2 focus:ring-[#0098ba]/20";

function countHits(text: string, keywords: readonly string[]) {
  return keywords.filter((keyword) => text.includes(keyword)).length;
}

function analyzeDocument(text: string): LocalRewriteAnalysis & { fundsHits: number } {
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

function flagClass(type: Flag["type"]) {
  if (type === "excellent") {
    return "border-[#0098ba] bg-[#e8f6fb]";
  }

  if (type === "weak") {
    return "border-[#f0a42f] bg-[#fff7e8]";
  }

  return "border-[#f00000] bg-[#fff0f0]";
}

export function AiConsularCheckPage({
  paymentRequired = false,
  initialUnlocked = false,
  paymentStatus,
  paymentAmount = 49.99,
  paymentCurrency = "USD",
}: {
  paymentRequired?: boolean;
  initialUnlocked?: boolean;
  paymentStatus?: "success" | "failed";
  paymentAmount?: number;
  paymentCurrency?: string;
}) {
  const paymentFailed = paymentRequired && paymentStatus === "failed";
  const paymentSucceeded = paymentRequired && initialUnlocked && paymentStatus === "success";
  const price = `${paymentAmount.toFixed(2)} ${paymentCurrency}`;
  const [unlocked, setUnlocked] = useState(!paymentRequired || initialUnlocked);
  const [paymentEmail, setPaymentEmail] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isStartingPayment, setIsStartingPayment] = useState(false);
  const checkoutPending = useRef(false);
  const [uploadError, setUploadError] = useState("");
  const [isReadingFile, setIsReadingFile] = useState(false);
  const uploadVersion = useRef(0);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [activeTool, setActiveTool] = useState<ActiveTool>("document");
  const [country, setCountry] = useState("Canada");
  const [visaClass, setVisaClass] = useState<(typeof visaClasses)[number]>("Study Permit");
  const [documentText, setDocumentText] = useState("");
  const [documentMode, setDocumentMode] = useState<"upload" | "paste">("upload");
  const [assessmentFiles, setAssessmentFiles] = useState<File[]>([]);
  const [assessmentFileError, setAssessmentFileError] = useState("");
  const [analysis, setAnalysis] = useState<ConsularReport | null>(null);
  const [nationality, setNationality] = useState("");
  const [residence, setResidence] = useState("");
  const [routeDetails, setRouteDetails] = useState("");
  const assessmentVersion = useRef(0);
  const assessmentController = useRef<AbortController | null>(null);
  useEffect(() => () => { uploadVersion.current++; assessmentVersion.current++; assessmentController.current?.abort(); }, []);
  const [assessmentError, setAssessmentError] = useState("");
  const [isAssessing, setIsAssessing] = useState(false);
  const [rewriteText, setRewriteText] = useState("");
  const [rewriteResult, setRewriteResult] = useState<{ draft: string; fixes: string[] } | null>(null);
  const [cvMode, setCvMode] = useState<EntryMode>("upload");
  const [cvCountry, setCvCountry] = useState("Canada");
  const [cvText, setCvText] = useState("");
  const [cvFileName, setCvFileName] = useState("");
  const [cvScratch, setCvScratch] = useState<CvBuilderData>(emptyCvBuilder);
  const [cvTemplate, setCvTemplate] = useState<CvTemplateId>("classic");
  const [cvResult, setCvResult] = useState<{ changes: string[]; draft?: CvDraft } | null>(null);
  const [coverMode, setCoverMode] = useState<EntryMode>("upload");
  const [coverText, setCoverText] = useState("");
  const [coverFileName, setCoverFileName] = useState("");
  const [coverScratch, setCoverScratch] = useState({ name: "", target: "", strengths: "" });
  const [coverResult, setCoverResult] = useState("");
  const [appointment, setAppointment] = useState<{ type: AppointmentType; city: string; date: string; slot: string }>({
    type: "Biometrics Enrolment",
    city: appointmentCentres["Biometrics Enrolment"][0],
    date: "",
    slot: "",
  });
  const [interviewCategory, setInterviewCategory] = useState<InterviewCategory>("Study");
  const [pathway, setPathway] = useState("Canada Study Permit");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [answerDraft, setAnswerDraft] = useState("");

  useEffect(() => {
    if (!paymentRequired) return;
    const channel = typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("cartandgo-consular-payment") : null;
    let controller: AbortController | null = null;
    let disposed = false;
    let retryRequested = false;
    async function checkAccess() {
      if (unlocked || disposed) return;
      if (controller) { retryRequested = true; return; }
      const requestController = new AbortController();
      controller = requestController;
      const timeout = window.setTimeout(() => requestController.abort(), 10000);
      try {
        // A tab notification only prompts this check; signed server access grants the unlock.
        const response = await fetch("/api/flutterwave/verify", {
          method: "POST", credentials: "same-origin", cache: "no-store", signal: requestController.signal,
        });
        const data = await response.json();
        if (!disposed && response.ok && data.verified === true) {
          setUnlocked(true);
          setShowPaymentPrompt(false);
          setPaymentError("");
        }
      } catch {
        // Keep the page locked if the status check fails; returning to the tab retries it.
      } finally {
        window.clearTimeout(timeout);
        controller = null;
        if (retryRequested && !disposed) { retryRequested = false; void checkAccess(); }
      }
    }
    const onVisible = () => { if (document.visibilityState === "visible") void checkAccess(); };
    const onFocus = () => { void checkAccess(); };
    if (channel) {
      channel.onmessage = event => {
        if (event.data?.type === "payment-verified") void checkAccess();
      };
      if (paymentSucceeded) channel.postMessage({ type: "payment-verified" });
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      controller?.abort();
      channel?.close();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [unlocked, paymentSucceeded, paymentRequired]);

  const categoryInterviewSets = interviewSets[interviewCategory] as Record<
    string,
    readonly InterviewQuestion[]
  >;
  const availablePathways = Object.keys(categoryInterviewSets);
  const interviewQuestions = categoryInterviewSets[pathway] ?? [];
  const currentQuestion = interviewQuestions[questionIndex];
  const interviewComplete = questionIndex >= interviewQuestions.length;
  const answeredWords = useMemo(
    () => answers.join(" ").trim().split(/\s+/).filter(Boolean).length,
    [answers],
  );
  const weakInterviewAnswers = answers.filter((answer) => answer.trim().split(/\s+/).filter(Boolean).length < 8).length;
  const interviewScore = interviewQuestions.length
    ? Math.max(20, 100 - weakInterviewAnswers * Math.round(90 / interviewQuestions.length))
    : Math.min(100, 35 + answers.length * 10 + Math.min(25, answeredWords));

  function invalidateAssessment() {
    assessmentVersion.current++;
    assessmentController.current?.abort();
    setIsAssessing(false);
    setAnalysis(null);
    setAssessmentError("");
  }

  async function runAssessment() {
    if (isAssessing) return;
    setAssessmentError("");
    setAnalysis(null);
    if (documentMode === "upload" && !assessmentFiles.length) { setAssessmentError("Upload your documents before clicking Proofread."); return; }
    if (documentMode === "paste" && !documentText.trim()) { setAssessmentError("Paste your document text before clicking Proofread."); return; }
    if (documentMode === "paste" && documentText.trim().length > MAX_ASSESSMENT_CHARS) { setAssessmentError(`Please supply at most ${MAX_ASSESSMENT_CHARS.toLocaleString()} characters.`); return; }
    const version = ++assessmentVersion.current;
    assessmentController.current?.abort();
    const controller = new AbortController();
    assessmentController.current = controller;
    setIsAssessing(true);
    try {
      const documents = documentMode === "upload" ? await readAssessmentFiles(assessmentFiles, controller.signal) : [{ id: "document-1", name: "Pasted document", text: documentText.trim() }];
      if (version !== assessmentVersion.current || controller.signal.aborted) return;
      const { response, data } = await requestConsularResult<{ report?: ConsularReport }>("review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, visaClass, nationality, residence, routeDetails, documents }),
      }, controller.signal);
      if (version !== assessmentVersion.current) return;
      if (response.status === 401 || response.status === 402) {
        if (!paymentRequired) throw new Error("Your document session could not be resumed. Please reload the page and retry.");
        setUnlocked(false); setShowPaymentPrompt(true); return;
      }
      if (version !== assessmentVersion.current || controller.signal.aborted) return;
      if (!response.ok || !data.report) {
        const reference = response.status !== 504 && typeof data.requestId === "string" && /^[a-f0-9-]{36}$/.test(data.requestId) ? ` Reference: ${data.requestId}` : "";
        throw new Error(`${data.error ?? "The AI review could not be completed."}${reference}`);
      }
      setAnalysis(data.report);
    } catch (error) {
      if (version !== assessmentVersion.current || controller.signal.aborted) return;
      if (error instanceof AssessmentAccessError) {
        if (!paymentRequired) { setAssessmentError("Your document session could not be resumed. Please reload the page and retry."); return; }
        setUnlocked(false); setShowPaymentPrompt(true); return;
      }
      setAnalysis(null);
      setAssessmentError(error instanceof Error ? error.message : "The AI review could not be completed. Please retry.");
    } finally {
      if (version === assessmentVersion.current) {
        if (documentMode === "paste") setRewriteText(current => current || documentText.trim());
        setIsAssessing(false);
      }
    }
  }

  function selectAssessmentFiles(files: File[]) {
    if (!files.length) return;
    invalidateAssessment();
    setAssessmentFileError("");
    try {
      validateAssessmentFiles(files);
      setAssessmentFiles(files);
    } catch (error) {
      setAssessmentFileError(error instanceof Error ? error.message : "Unable to select those files.");
    }
  }

  function changeDocumentMode(mode: "upload" | "paste") {
    if (mode === documentMode) return;
    invalidateAssessment();
    setAssessmentFileError("");
    setDocumentMode(mode);
  }

  async function processFile(file: File | undefined, target: "cv" | "cover") {
    if (!file) return;
    const version = ++uploadVersion.current;
    setUploadError("");
    setIsReadingFile(true);
    if (target === "cv") { setCvText(""); setCvFileName(""); setCvResult(null); }
    else { setCoverText(""); setCoverFileName(""); setCoverResult(""); }
    try {
      const text = await extractDocumentText(file);
      if (version !== uploadVersion.current) return;
      if (target === "cv") { setCvText(text); setCvFileName(file.name); }
      else { setCoverText(text); setCoverFileName(file.name); }
    } catch (error) {
      if (version === uploadVersion.current) setUploadError(error instanceof Error ? error.message : "Unable to read that file.");
    } finally {
      if (version === uploadVersion.current) setIsReadingFile(false);
    }
  }

  function changeCvMode(mode: EntryMode) {
    if (mode === cvMode) return;
    uploadVersion.current++;
    setIsReadingFile(false);
    setUploadError("");
    setCvResult(null);
    setCvMode(mode);
  }

  function changeCoverMode(mode: EntryMode) {
    if (mode === coverMode) return;
    uploadVersion.current++;
    setIsReadingFile(false);
    setUploadError("");
    setCoverResult("");
    setCoverMode(mode);
  }

  async function startPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentRequired) return;
    if (checkoutPending.current) return;
    const paymentTab = window.open("about:blank", "_blank");
    if (!paymentTab) {
      setPaymentError("Allow pop-ups for this site, then try payment again.");
      return;
    }
    paymentTab.opener = null;
    checkoutPending.current = true;
    setIsStartingPayment(true);
    setPaymentError("");
    try {
      const response = await fetch("/api/flutterwave/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: paymentEmail }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error ?? "Unable to start payment.");
      if (paymentTab.closed) throw new Error("The payment tab was closed. Please try again.");
      paymentTab.location.replace(data.url);
    } catch (error) {
      paymentTab.close();
      setPaymentError(error instanceof Error ? error.message : "Unable to start payment.");
    } finally {
      checkoutPending.current = false;
      setIsStartingPayment(false);
    }
  }

  function runRewrite() {
    const text = rewriteText.trim() || documentText.trim();

    if (!text) {
      setRewriteResult(null);
      return;
    }

    const local = analyzeDocument(text);
    const fixes: string[] = [];
    let draft = text;

    if (local.clarity < 20) {
      draft = `I am submitting this application with a clear and specific purpose. ${draft}`;
      fixes.push("Opened with an explicit statement of intent so the purpose is visible immediately.");
    }
    if (local.completeness < 20) {
      draft += "\n\nAll funds referenced above are documented through bank statements covering at least the last six months, with any third-party contribution supported by proof of income and a signed affidavit of support.";
      fixes.push("Added a traceable-funds paragraph so financial evidence reads as verifiable.");
    }
    if (local.ties < 20) {
      draft += "\n\nI hold ongoing ties to Nigeria, including family responsibilities and/or property, employment or business interests that require my return on completion of this trip.";
      fixes.push("Added a home-country-ties paragraph, a common weak point in refusals.");
    }
    if (/loan|gift|borrowed|donation|uncle will send/i.test(text) && local.fundsHits === 0) {
      fixes.push("Flagged informal funding language for replacement with a documented sponsor affidavit.");
    }

    draft += "\n\nI confirm that all information provided is accurate and complete.";
    fixes.push("Closed with an accuracy and completeness confirmation line.");
    setRewriteResult({ draft, fixes });
  }

  function runCvOptimize() {
    const source = cvText.trim();

    if (!source) {
      setCvResult(null);
      return;
    }

    const hasNumbers = /\d/.test(source);

    const changes = [
      "Use a clean single-column layout with standard headings for recruiter and ATS readability.",
      `Country guidance for ${cvCountry}: ${cvCountryProfile(cvCountry, "job").guidance}`,
      hasNumbers
        ? "Your uploaded text includes numbers. Check that they describe your achievements accurately."
        : "Consider quantifying achievements such as team size, revenue or output where supported by your record.",
      "Tailor your profile and relevant skills to the target role and job description.",
    ];
    setCvResult({ changes });
  }

  function runCoverLetter() {
    if (coverMode === "scratch") {
      if (!coverScratch.name.trim() || !coverScratch.target.trim()) {
        setCoverResult("");
        return;
      }

      setCoverResult(
        `Dear Admissions/Hiring Committee,\n\nI am writing to express my strong interest in ${coverScratch.target}. My name is ${coverScratch.name}, and I bring ${coverScratch.strengths || "a clear record of achievement and readiness for this opportunity"}.\n\nThis opportunity aligns directly with my professional trajectory, and I have researched it carefully to confirm it is the right next step. I am confident I can contribute meaningfully and welcome the opportunity to discuss my application further.\n\nSincerely,\n${coverScratch.name}`,
      );
      return;
    }

    if (!coverText.trim()) {
      setCoverResult("");
      return;
    }

    setCoverResult(
      `${coverText.trim()}\n\nI have researched this opportunity thoroughly and am confident it is the right next step, after which I intend to apply what I have gained toward my long-term plans.`,
    );
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

  function resetInterview(nextCategory = interviewCategory, nextPathway = pathway) {
    setInterviewCategory(nextCategory);
    setPathway(nextPathway);
    setAnswers([]);
    setAnswerDraft("");
    setQuestionIndex(0);
  }

  return (
    <>
      {paymentSucceeded && unlocked ? (
        <section role="status" className="border-b border-green-200 bg-green-50 px-5 py-5 text-green-900 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="font-bold">Payment Successful, you can close tab and return to Consular page</p>
            <Link href="/ai-consular-check#consular-tools" className="mt-2 inline-block font-semibold underline underline-offset-4">
              Continue to AI Consular
            </Link>
          </div>
        </section>
      ) : null}
      <section className="relative isolate overflow-hidden bg-[#07141a] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(7,20,26,.98),rgba(0,60,78,.82),rgba(0,152,186,.28))]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-[#f0a42f] text-[#07141a]">
              <Icon name="Shield" />
            </div>
            <p className="mt-8 text-xs font-black uppercase text-[#04f1f1]">
              AI Consular+
            </p>
            <h1 className="mt-4 font-serif text-[45px] leading-[1.04] md:text-[60px]">
              Your full document and travel-prep suite.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78">
              Review documents, rewrite weak sections, build CVs and cover letters,
              schedule prep, plan itineraries and practise consular interviews before
              you pay an embassy fee.
            </p>
          </div>

          <div className="rounded-lg border border-white/15 bg-white p-5 text-[#07141a] shadow-[0_30px_90px_-42px_rgba(0,0,0,.75)] md:p-7">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Document readiness score",
                "AI document rewriter",
                "ATS CV builder",
                "Cover letter generator",
                "Appointment scheduler",
                "Interview simulator",
              ].map((label, index) => (
                <div key={label} className="rounded-md bg-[#e8f6fb] p-4">
                  <span className="text-xs font-black text-[#0098ba]">
                    0{index + 1}
                  </span>
                  <p className="mt-2 text-sm font-black text-[#07141a]">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 rounded-md bg-[#fff7e8] p-4 text-sm leading-6 text-[#5b6870]">
              Private readiness tools only. Nothing is submitted to an embassy.
              {paymentRequired ? " Payments are processed securely by Flutterwave." : " All tools are currently available without payment."}
            </p>
          </div>
        </div>
      </section>

      <section id="consular-tools" className="scroll-mt-20 bg-[#f6fbfd] px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {isReadingFile ? <p role="status" className="mb-4">Reading your document…</p> : null}
          {uploadError && activeTool !== "document" ? <p role="alert" className="mb-4 text-red-700">{uploadError}</p> : null}

          {paymentFailed && !unlocked ? (
            <div className="mb-8 rounded-md border border-[#f0a42f] bg-[#fff7e8] px-4 py-3 text-sm leading-6 text-[#93670f]">
              Payment was not verified. Please try again or contact CartandGo if
              your account was debited.
            </div>
          ) : null}

          {!unlocked ? (
            <div className="mx-auto max-w-3xl rounded-lg border border-[#d7dfe5] bg-white p-8 text-center md:p-11">
              <span className="inline-flex rounded-full bg-[#07141a] px-4 py-2 text-xs font-black uppercase text-white">
                One-time unlock
              </span>
              <h2 className="mt-5 font-serif text-4xl text-[#07141a]">
                AI Consular+ Full Suite
              </h2>
              <p className="mt-3 font-serif text-5xl font-black text-[#f0a42f]">
                {price}{" "}
                <span className="font-sans text-sm font-semibold text-[#5b6870]">
                  per document / session
                </span>
              </p>
              <p className="mx-auto mt-3 max-w-xl leading-7 text-[#5b6870]">
                Unlock every tool below for a one-hour session after your payment
                has been verified.
              </p>
              <div className="mt-7 grid gap-3 text-left text-sm text-[#1b1f27] sm:grid-cols-2">
                {[
                  "Document Pre-Assessment and Consular Readiness Score",
                  "AI Document Rewriter",
                  "ATS-Optimised CV/Resume Builder",
                  "Cover Letter Generator",
                  "Biometrics/Medical Appointment Scheduler",
                  "Day-by-Day Travel Itinerary Planner",
                  "Expanded Practice Interview Simulator",
                ].map((item) => (
                  <div key={item} className="rounded-md bg-[#fbf8f2] p-3">
                    <b className="text-[#0098ba]">✓</b> {item}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentPrompt(true)}
                className="mt-8 rounded-md bg-[#f0a42f] px-6 py-3 text-sm font-black text-[#07141a] transition hover:bg-[#ffb347]"
              >
                Unlock tools for this session
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 rounded-md border border-[#0098ba] bg-[#e8f6fb] px-4 py-3 text-sm font-bold text-[#0f5e68]">
                {paymentRequired ? "✓ Unlocked for this session. All 7 tools below are available." : "✓ All 7 tools are available. No payment required."}
              </div>

              <div className="mb-8 flex flex-wrap gap-2 border-b border-[#d7dfe5] pb-4">
                {toolTabs.map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTool(tab)}
                    className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                      activeTool === tab
                        ? "border-[#07141a] bg-[#07141a] text-white"
                        : "border-[#d7dfe5] bg-[#fbf8f2] text-[#1b1f27] hover:border-[#07141a]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTool === "document" ? (
                <div className="grid gap-8 lg:grid-cols-[.95fr_1.05fr]">
                  <Panel>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <SelectField
                        label="Target Country"
                        value={country}
                        onChange={value => { invalidateAssessment(); setCountry(value); }}
                        options={worldCountries}
                      />
                      <SelectField
                        label="Visa Class"
                        value={visaClass}
                        onChange={value => { invalidateAssessment(); setVisaClass(value as (typeof visaClasses)[number]); }}
                        options={visaClasses}
                      />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <ScratchInput label="Nationality (optional)" value={nationality} onChange={value => { invalidateAssessment(); setNationality(value); }} />
                      <ScratchInput label="Country of residence (optional)" value={residence} onChange={value => { invalidateAssessment(); setResidence(value); }} />
                    </div>
                    <ScratchInput label="Exact visa route and relevant circumstances (optional)" value={routeDetails} onChange={value => { invalidateAssessment(); setRouteDetails(value); }} />
                    <p className="text-xs leading-5 text-[#5b6870]">Current official guidance is connected for Canada, the UK and the US. Other destinations receive a limited document review with unverified requirements.</p>
                    <p className="mt-5 text-sm leading-6 text-[#5b6870]">
                      Upload your travel or visa documents, then click Proofread to review them. You can also paste text. A statement of purpose alone cannot establish the strength of a full application.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Document input method">
                      {([["upload", "Upload documents"], ["paste", "Paste text"]] as const).map(([mode, label]) => (
                        <button key={mode} type="button" aria-pressed={documentMode === mode} onClick={() => changeDocumentMode(mode)} className={`rounded-md border px-4 py-2 text-sm font-bold ${documentMode === mode ? "border-[#07141a] bg-[#07141a] text-white" : "border-[#d7dfe5] bg-[#fbf8f2] text-[#1b1f27]"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {documentMode === "upload" ? (
                      <UploadCard documentName="documents" multiple onFilesSelect={selectAssessmentFiles} onFileSelect={file => selectAssessmentFiles([file])}
                        description="Select your statement of purpose, financial evidence, sponsor letter, employment letter, itinerary or other travel documents."
                        fileName={assessmentFiles.map(file => file.name).join(", ")} isReading={isAssessing} readingMessage="Proofreading…" error={assessmentFileError}
                        onRemove={() => { invalidateAssessment(); setAssessmentFiles([]); setAssessmentFileError(""); }}
                        helpText="Up to 6 PDF, DOCX or TXT files · 10MB per file, 30MB total, 100 pages per PDF. Processing starts when you click Proofread. Document text is limited to 60,000 characters total."
                        className="mt-4" />
                    ) : (
                    <label className="mt-4 block text-[12.5px] font-semibold text-[#07141a]">
                      Paste your document text
                      <textarea
                        value={documentText}
                        onChange={(event) => {
                          invalidateAssessment();
                          setDocumentText(event.target.value);
                        }}
                        placeholder="Statement of purpose, sponsor affidavit, financial summary, employment letter..."
                        className={`${inputClass} min-h-52 resize-y leading-7`}
                      />
                    </label>
                    )}
                    <p className="mt-2 text-xs text-[#5b6870]">
                      {documentMode === "paste" ? `${documentText.length.toLocaleString()} / ${MAX_ASSESSMENT_CHARS.toLocaleString()} characters` : assessmentFiles.length ? `${assessmentFiles.length} document${assessmentFiles.length === 1 ? "" : "s"} selected. Click Proofread to begin.` : "Upload your documents to begin."}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={runAssessment}
                        disabled={isAssessing}
                        className="rounded-md bg-[#f0a42f] px-5 py-3 text-sm font-black text-[#07141a] transition hover:bg-[#ffb347] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isAssessing ? "Proofreading and reviewing…" : "Proofread"}
                      </button>
                      <p className="m-0 text-xs leading-5 text-[#5b6870]">
                        Nothing is submitted to any embassy.
                      </p>
                    </div>
                    {assessmentError ? (
                      <p className="mt-4 rounded-md bg-[#fff7e8] p-3 text-sm leading-6 text-[#93670f]">
                        {assessmentError}
                      </p>
                    ) : null}
                  </Panel>

                  <Panel>{analysis ? <AssessmentReport report={analysis} country={country} visaClass={visaClass} documentNames={documentMode === "upload" ? Object.fromEntries(assessmentFiles.map((file, index) => [`document-${index + 1}`, file.name])) : { "document-1": "Pasted document" }} /> : <EmptyReport />}</Panel>
                </div>
              ) : null}

              {activeTool === "rewrite" ? (
                <Panel>
                  <p className="mb-5 max-w-2xl leading-7 text-[#5b6870]">
                    Run a pre-assessment first or paste text below. The rewriter
                    fixes weak intent, funding and home-ties sections.
                  </p>
                  <textarea
                    value={rewriteText}
                    onChange={(event) => setRewriteText(event.target.value)}
                    placeholder="Paste text here, or run Pre-Assessment first to auto-fill this box..."
                    className={`${inputClass} min-h-52 resize-y leading-7`}
                  />
                  <button
                    type="button"
                    onClick={runRewrite}
                    className="mt-4 rounded-md bg-[#f0a42f] px-5 py-3 text-sm font-black text-[#07141a] transition hover:bg-[#ffb347]"
                  >
                    Rewrite My Document
                  </button>
                  {rewriteResult ? (
                    <ReportSection title="What was fixed">
                      {rewriteResult.fixes.map((fix) => (
                        <FlagCard key={fix} type="excellent" title="Applied" body={fix} />
                      ))}
                      <textarea
                        readOnly
                        value={rewriteResult.draft}
                        className={`${inputClass} min-h-60 resize-y leading-7`}
                      />
                    </ReportSection>
                  ) : null}
                </Panel>
              ) : null}

              {activeTool === "cv" ? (
                <div className="space-y-6">
                  <Panel>
                    <EntryToggle value={cvMode} onChange={changeCvMode} modes={["upload", "scratch"]} labels={["Upload CV", "Start from Scratch"]} />
                    <label className="mt-5 block max-w-md text-[12.5px] font-semibold text-[#07141a]">
                      Optimise for destination country
                      <select className={inputClass} value={cvCountry} onChange={(event) => { setCvCountry(event.target.value); setCvResult(null); }}>
                        {worldCountries.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                  </Panel>
                  {cvMode === "upload" ? (
                    <UploadCard
                      documentName="CV"
                      description="Click the button below to upload your CV or resume for a review tailored to your destination."
                      fileName={cvFileName}
                      isReading={isReadingFile}
                      onFileSelect={(file) => void processFile(file, "cv")}
                      onRemove={() => { setCvText(""); setCvFileName(""); setCvResult(null); setUploadError(""); }}
                    />
                  ) : null}
                  {cvMode === "scratch" ? (
                    <Panel>
                      {!cvResult?.draft ? <div className="mb-8"><CvTemplatePicker value={cvTemplate} onChange={setCvTemplate} /></div> : null}
                      <CvScratchBuilder country={cvCountry} value={cvScratch} onChange={value => { setCvScratch(value); setCvResult(null); }} onBuild={draft => setCvResult({ draft, changes: [
                        `Built your ${cvScratch.kind === "academic" ? "Academic CV" : "Job CV"} from the completed sections.`,
                        `Prepared for ${cvCountry} using ${draft.paperSize} paper and reverse-chronological education and experience.`,
                        "Only supplied details were included. Check the draft against the application instructions before sending it.",
                      ] })} />
                    </Panel>
                  ) : null}
                  {cvMode === "upload" ? <div className="flex justify-center">
                    <button type="button" onClick={runCvOptimize} disabled={isReadingFile || !cvText.trim()} className="rounded-lg bg-[#07141a] px-6 py-3 text-sm font-black text-white transition hover:bg-[#07324a] disabled:cursor-not-allowed disabled:opacity-40">
                      Optimise for ATS
                    </button>
                  </div> : null}
                  {cvResult ? (
                    <Panel>
                      <ReportSection title={`${cvMode === "scratch" ? "Build summary" : "CV guidance"} - ${cvCountry}`}>
                        {cvResult.changes.map((item) => (
                          <FlagCard key={item} type="excellent" title={cvMode === "scratch" ? "Prepared" : "Guidance"} body={item} />
                        ))}
                      </ReportSection>
                      {cvResult.draft ? (
                        <ReportSection title="Your CV draft">
                          <CvTemplatePicker value={cvTemplate} onChange={setCvTemplate} />
                          <CvPdfPreview key={`${cvTemplate}-${cvResult.draft.paperSize}-${cvResult.draft.text}`} draft={cvResult.draft} template={cvTemplate} />
                          <details className="mt-5"><summary className="cursor-pointer text-sm font-bold text-[#0f5e68]">View CV text</summary><textarea aria-label="Your CV draft" readOnly value={cvResult.draft.text} className={`${inputClass} mt-3 min-h-60 resize-y leading-7`} /></details>
                        </ReportSection>
                      ) : null}
                    </Panel>
                  ) : null}
                </div>
              ) : null}

              {activeTool === "cover" ? (
                <Panel>
                  <EntryToggle value={coverMode} onChange={changeCoverMode} modes={["upload", "scratch"]} labels={["Upload Draft", "Start from Scratch"]} />
                  {coverMode === "upload" ? (
                    <UploadCard
                      documentName="cover letter"
                      description="Click the button below to upload your draft cover letter and prepare it for your application."
                      fileName={coverFileName}
                      isReading={isReadingFile}
                      onFileSelect={(file) => void processFile(file, "cover")}
                      onRemove={() => { setCoverText(""); setCoverFileName(""); setCoverResult(""); setUploadError(""); }}
                      className="mt-4"
                    />
                  ) : null}
                  {coverMode === "scratch" ? (
                    <div className="mt-4 grid gap-4">
                      <ScratchInput label="Your name" value={coverScratch.name} onChange={(value) => { setCoverScratch((current) => ({ ...current, name: value })); setCoverResult(""); }} />
                      <ScratchInput label="Target programme / employer" value={coverScratch.target} onChange={(value) => { setCoverScratch((current) => ({ ...current, target: value })); setCoverResult(""); }} />
                      <ScratchInput label="Key strengths" value={coverScratch.strengths} onChange={(value) => { setCoverScratch((current) => ({ ...current, strengths: value })); setCoverResult(""); }} />
                    </div>
                  ) : null}
                  <button type="button" onClick={runCoverLetter} disabled={isReadingFile} className="mt-5 rounded-md bg-[#f0a42f] px-5 py-3 text-sm font-black text-[#07141a]">
                    Generate Cover Letter
                  </button>
                  {coverResult ? (
                    <ReportSection title="Your cover letter draft">
                      <textarea aria-label="Your cover letter draft" readOnly value={coverResult} className={`${inputClass} min-h-60 resize-y leading-7`} />
                      {coverMode === "scratch" ? <DocumentPdfDownload key={coverResult} kind="Cover Letter" name={coverScratch.name.trim()} text={coverResult} /> : null}
                    </ReportSection>
                  ) : null}
                </Panel>
              ) : null}

              {activeTool === "appointments" ? (
                <Panel>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField label="Appointment type" value={appointment.type} onChange={(value) => {
                      if (value !== "Biometrics Enrolment" && value !== "Medical Examination") return;
                      setAppointment((current) => ({ ...current, type: value, city: appointmentCentres[value][0], slot: "" }));
                    }} options={Object.keys(appointmentCentres)} />
                    <SelectField label="City / Visa Application Centre" value={appointment.city} onChange={(value) => setAppointment((current) => ({ ...current, city: value, slot: "" }))} options={appointmentCentres[appointment.type]} />
                  </div>
                  <label className="mt-4 block text-[12.5px] font-semibold text-[#07141a]">
                    Preferred date
                    <input className={inputClass} type="date" value={appointment.date} onChange={(event) => setAppointment((current) => ({ ...current, date: event.target.value }))} />
                  </label>
                  <div className="mt-5 grid gap-2 sm:grid-cols-4">
                    {["08:00 AM", "09:30 AM", "11:00 AM", "12:30 PM", "02:00 PM", "03:30 PM", "05:00 PM", "06:30 PM"].map((slot, index) => {
                      const taken = index === 2 || index === 5;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={taken}
                          onClick={() => setAppointment((current) => ({ ...current, slot }))}
                          className={`rounded-md border px-3 py-2 text-sm font-bold ${
                            appointment.slot === slot
                              ? "border-[#07141a] bg-[#07141a] text-white"
                              : "border-[#d7dfe5] bg-[#fbf8f2] text-[#1b1f27]"
                          } disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                  {appointment.date && appointment.slot ? (
                    <FlagCard
                      type="excellent"
                      title="Appointment held"
                      body={`${appointment.type} at ${appointment.city} on ${appointment.date} at ${appointment.slot}. A confirmation would be sent to WhatsApp/email in the live build.`}
                    />
                  ) : null}
                </Panel>
              ) : null}

              <div className={activeTool === "itinerary" ? "" : "hidden"}>
                <ItineraryPlanner />
              </div>

              {activeTool === "interview" ? (
                <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
                  <Panel>
                    <SelectField
                      label="Visa category"
                      value={interviewCategory}
                      onChange={(value) => {
                        const nextCategory = value as InterviewCategory;
                        resetInterview(nextCategory, Object.keys(interviewSets[nextCategory])[0]);
                      }}
                      options={Object.keys(interviewSets)}
                    />
                    <SelectField
                      label="Choose a pathway to practise"
                      value={pathway}
                      onChange={(value) => resetInterview(interviewCategory, value)}
                      options={availablePathways}
                    />
                    <p className="mt-4 text-sm leading-6 text-[#5b6870]">
                      One question at a time, drawn from consular focus areas:
                      funding, intent, ties, programme knowledge and contingency planning.
                    </p>
                    <button type="button" onClick={() => resetInterview()} className="mt-5 rounded-md bg-[#f0a42f] px-5 py-3 text-sm font-black text-[#07141a]">
                      Restart practice
                    </button>
                  </Panel>

                  <Panel>
                    {!interviewComplete ? (
                      <>
                        <div className="mb-4 flex gap-2">
                          {interviewQuestions.map((_, index) => (
                            <span
                              key={index}
                              className={`h-2 w-2 rounded-full ${index < questionIndex ? "bg-[#0098ba]" : index === questionIndex ? "bg-[#f0a42f]" : "bg-[#d7dfe5]"}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs font-black uppercase text-[#0098ba]">
                          Question {questionIndex + 1} of {interviewQuestions.length} · {currentQuestion?.[1]}
                        </p>
                        <div className="mt-4 rounded-md bg-[#07141a] p-5 text-white">
                          <p className="max-w-none text-base leading-7 text-white/85">{currentQuestion?.[0]}</p>
                        </div>
                        {answers.length > 0 ? (
                          <div className="mt-5 space-y-3">
                            {answers.map((answer, index) => (
                              <div key={`${answer}-${index}`} className="rounded-md bg-[#f6fbfd] p-4">
                                <p className="text-xs font-black text-[#0098ba]">Answer {index + 1}</p>
                                <p className="mt-2 text-sm leading-6 text-[#5b6870]">{answer}</p>
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
                          <button type="button" onClick={submitAnswer} className="rounded-md bg-[#f0a42f] px-5 py-3 text-sm font-black text-[#07141a]">
                            Send
                          </button>
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="text-xs font-black uppercase text-[#0098ba]">Interview scorecard</p>
                        <h2 className="mt-3 font-serif text-4xl text-[#07141a]">Practice complete.</h2>
                        <div className="mt-6 flex flex-wrap items-center gap-5">
                          <Score score={interviewScore} />
                          <p className="max-w-xl text-sm leading-7 text-[#5b6870]">
                            Short answers are treated as weak. Strong answers give
                            names, dates, amounts, route logic and evidence.
                          </p>
                        </div>
                        <ReportSection title="Answer review">
                          {interviewQuestions.map((question, index) => {
                            const answer = answers[index] ?? "";
                            const weak = answer.trim().split(/\s+/).filter(Boolean).length < 8;
                            return (
                              <FlagCard
                                key={question[0]}
                                type={weak ? "weak" : "excellent"}
                                title={question[1]}
                                body={weak ? "This answer is too short to sound credible. Add a specific name, date, amount or reason." : "Specific enough to sound credible. Keep this level of detail in the real interview."}
                              />
                            );
                          })}
                        </ReportSection>
                        <div className="mt-7 flex flex-wrap gap-3">
                          <button type="button" onClick={() => resetInterview()} className="rounded-md bg-[#f0a42f] px-5 py-3 text-sm font-black text-[#07141a]">
                            Practise again
                          </button>
                          <Link href="/contact" className="rounded-md border border-[#07141a] px-5 py-3 text-sm font-black text-[#07141a] transition hover:bg-[#07141a] hover:text-white">
                            Book interview prep
                          </Link>
                        </div>
                      </div>
                    )}
                  </Panel>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      {paymentRequired && showPaymentPrompt ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#07141a]/70 px-5 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-payment-title"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 text-[#07141a] shadow-[0_30px_90px_-42px_rgba(0,0,0,.85)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-[#0098ba]">
                  Secure payment
                </p>
                <h2 id="ai-payment-title" className="mt-2 font-serif text-3xl">
                  Unlock AI Consular+
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentPrompt(false)}
                className="rounded-full border border-[#d7dfe5] px-3 py-1 text-sm font-black text-[#5b6870] transition hover:border-[#07141a] hover:text-[#07141a]"
                aria-label="Close payment prompt"
              >
                ×
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#5b6870]">
              Make the {price} payment securely on Flutterwave. After successful
              payment, the payment tab will show a confirmation and this page
              will unlock automatically.
            </p>

            <div className="mt-5 rounded-md bg-[#fff7e8] p-4 text-sm leading-6 text-[#93670f]">
              Card details are handled by Flutterwave. CartandGo does not collect
              or store your payment card information.
            </div>

            <form onSubmit={startPayment} className="mt-6 grid gap-3">
              <label className="text-sm font-semibold">
                Email for your payment receipt
                <input type="email" required maxLength={254} value={paymentEmail} onChange={(event) => setPaymentEmail(event.target.value)} className={inputClass} />
              </label>
              {paymentError ? <p role="alert" className="text-sm text-red-700">{paymentError}</p> : null}
              <button
                type="submit"
                disabled={isStartingPayment}
                className="rounded-md bg-[#f0a42f] px-5 py-3 text-center text-sm font-black text-[#07141a] transition hover:bg-[#ffb347]"
              >
                {isStartingPayment ? "Opening secure checkout…" : "Proceed to Flutterwave payment"}
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentPrompt(false)}
                className="rounded-md border border-[#07141a] px-5 py-3 text-sm font-black text-[#07141a] transition hover:bg-[#07141a] hover:text-white"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function EmptyReport() {
  return (
    <div className="flex min-h-96 flex-col justify-center rounded-md bg-[#e8f6fb] p-6">
      <Icon name="Search" className="h-10 w-10 text-[#0098ba]" />
      <h2 className="mt-5 font-serif text-3xl text-[#07141a]">
        Your readiness report will appear here.
      </h2>
      <p className="mt-3 max-w-xl leading-7 text-[#5b6870]">
        Upload travel documents or paste their text, then run the review to see evidence-based findings, proofreading corrections and questions to resolve.
      </p>
    </div>
  );
}

function Score({ score }: { score: number }) {
  return (
    <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-[7px] border-[#d7dfe5]">
      <span className="font-serif text-3xl font-black text-[#07141a]">{score}</span>
      <span className="text-xs text-[#5b6870]">/ 100</span>
    </div>
  );
}

function FlagCard({ type, title, body }: Flag) {
  return (
    <div className={`mt-4 rounded-md border-l-4 p-4 text-sm leading-6 ${flagClass(type)}`}>
      <b className="block text-[#07141a]">{title}</b>
      <span className="text-[#5b6870]">{body}</span>
    </div>
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

function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-[#d7dfe5] bg-white p-6">{children}</div>;
}

function ScratchInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mb-3 block text-[12.5px] font-semibold text-[#07141a]">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="block text-[12.5px] font-semibold text-[#07141a]">
      {label}
      <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

function EntryToggle({
  value,
  onChange,
  labels,
  modes = ["upload", "paste", "scratch"],
}: {
  value: EntryMode;
  onChange: (mode: EntryMode) => void;
  labels: readonly string[];
  modes?: readonly EntryMode[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {modes.map((mode, index) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`rounded-md border px-4 py-2 text-sm font-bold ${
            value === mode
              ? "border-[#07141a] bg-[#07141a] text-white"
              : "border-[#d7dfe5] bg-[#fbf8f2] text-[#1b1f27]"
          }`}
        >
          {labels[index]}
        </button>
      ))}
    </div>
  );
}
