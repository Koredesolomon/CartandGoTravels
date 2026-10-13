import { europeanCountries } from "./cvBuilder";
import type { Flag } from "./localRewriteAnalysis";

export type CoverLetterKind = "job" | "study" | "visa";
export type CoverLetterData = {
  kind: CoverLetterKind; name: string; email: string; phone: string; address: string; date: string;
  recipientName: string; recipientTitle: string; organisation: string; organisationAddress: string;
  target: string; reference: string; source: string; intake: string; travelFrom: string; travelTo: string; passportNumber: string;
  background: string; achievements: string; motivation: string; plans: string; host: string; funding: string; ties: string; travelHistory: string;
  workAuthorization: string; availability: string; salary: string; enclosures: string;
};
export function emptyCoverLetter(): CoverLetterData {
  return {
    kind: "job", name: "", email: "", phone: "", address: "", date: "", recipientName: "", recipientTitle: "", organisation: "", organisationAddress: "",
    target: "", reference: "", source: "", intake: "", travelFrom: "", travelTo: "", passportNumber: "",
    background: "", achievements: "", motivation: "", plans: "", host: "", funding: "", ties: "", travelHistory: "",
    workAuthorization: "", availability: "", salary: "", enclosures: "",
  };
}
export const coverLetterKinds = [["job", "Job application"], ["study", "Study / admissions"], ["visa", "Visa application"]] as const;
export const coverLetterTitles: Record<CoverLetterKind, string> = { job: "Cover Letter", study: "Admissions Cover Letter", visa: "Visa Cover Letter" };

type Source = { title: string; url: string };
export type CoverLetterProfile = {
  label: string; paperSize: "A4" | "Letter"; dateLocale: "en-US" | "en-GB";
  /** Greeting when no person is named for a job application. */
  unknownSalutation: string;
  /** British-style rule: an unnamed greeting closes "Yours faithfully", a named one "Yours sincerely". */
  closingNamed: string; closingUnknown: string;
  subjectLine: boolean; omitPersonalData: boolean;
  guidance: string; sources: Source[];
};
const europassSource = { title: "Europass: cover letters", url: "https://europass.europa.eu/en/create-europass-cover-letter" };
const visaSources: Record<string, Source[]> = {
  "United Kingdom": [{ title: "GOV.UK: Standard Visitor visa", url: "https://www.gov.uk/standard-visitor/apply-standard-visitor-visa" }],
  schengen: [{ title: "European Commission: applying for a Schengen visa", url: "https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy/applying-schengen-visa_en" }],
};
const schengenCountries = new Set([...europeanCountries, "Germany"].filter(country => !["Cyprus", "Ireland"].includes(country)));

export function coverLetterProfile(country: string, kind: CoverLetterKind): CoverLetterProfile {
  const base: CoverLetterProfile = {
    label: `International letter format — ${country}`, paperSize: "A4", dateLocale: "en-GB",
    unknownSalutation: "Dear Hiring Manager,", closingNamed: "Yours sincerely,", closingUnknown: "Yours sincerely,",
    subjectLine: true, omitPersonalData: false,
    guidance: "Keep the letter to one page: a clear opening naming the role, two or three paragraphs linking your genuine experience to the requirements, and a short closing. Country-specific conventions have not been verified for this destination; follow the employer or institution's instructions.",
    sources: [],
  };
  const british = { dateLocale: "en-GB" as const, unknownSalutation: "Dear Sir or Madam,", closingNamed: "Yours sincerely,", closingUnknown: "Yours faithfully," };
  const profiles: Record<string, Partial<CoverLetterProfile>> = {
    Canada: {
      label: "Canadian cover letter", paperSize: "Letter", dateLocale: "en-US", closingNamed: "Sincerely,", closingUnknown: "Sincerely,", subjectLine: false, omitPersonalData: true,
      guidance: "Tailor each letter to the posting: open with the role and your enthusiasm, give one or two concrete examples matched to the posting's requirements, and close by restating your interest. Keep it to one page and omit age, marital status and photos.",
      sources: [{ title: "Job Bank: stand out to employers", url: "https://www.jobbank.gc.ca/career-planning/resources/stand-out" }],
    },
    "United States": {
      label: "US cover letter", paperSize: "Letter", dateLocale: "en-US", closingNamed: "Sincerely,", closingUnknown: "Sincerely,", subjectLine: false, omitPersonalData: true,
      guidance: "Aim for about 200–400 words in three or four short paragraphs on one page: why you are writing, how your qualifications match the role, and how you will follow up. Omit age, marital status, photos and other personal details unrelated to the job.",
      sources: [{ title: "CareerOneStop: how to write a cover letter", url: "https://www.careeronestop.org/JobSearch/Resumes/cover-letters.aspx" }],
    },
    "United Kingdom": {
      label: "UK covering letter", ...british, omitPersonalData: true,
      guidance: "Keep it to one page. Say which job you are applying for and where you saw it, show how your skills and experience match the job description with examples, and say why you want to work for the organisation. Use “Yours sincerely” after a named greeting and “Yours faithfully” after “Dear Sir or Madam”.",
      sources: [{ title: "National Careers Service: cover letters", url: "https://nationalcareers.service.gov.uk/careers-advice/covering-letter" }],
    },
    Ireland: {
      label: "Irish cover letter", ...british, omitPersonalData: true,
      guidance: "Keep it to one page, name the role and reference, and match your experience to the stated requirements with specific examples. Use “Yours faithfully” after an unnamed greeting.",
      sources: [europassSource],
    },
    Australia: {
      label: "Australian cover letter", omitPersonalData: true,
      guidance: "Keep it to one page. State the job and where you found it, use the wording of the job advertisement, and only make claims you can back up with examples. Government roles often ask you to address selection criteria separately. Close by thanking the employer.",
      sources: [{ title: "Workforce Australia: write a cover letter", url: "https://www.workforceaustralia.gov.au/individuals/coaching/job-applications/cover-letters" }],
    },
    "New Zealand": {
      label: "New Zealand cover letter", omitPersonalData: true,
      guidance: "Keep it to one page, explain why you want this specific job and how your skills and experience suit it, and finish by saying you look forward to discussing your application.",
      sources: [{ title: "Tahatū (NZ Government): how to write a cover letter", url: "https://tahatu.govt.nz/work/applying-for-a-job/how-to-write-a-cover-letter" }],
    },
    Germany: {
      label: "German cover letter / Anschreiben", unknownSalutation: "Dear Sir or Madam,", closingNamed: "Kind regards,", closingUnknown: "Kind regards,",
      guidance: "German letters follow a formal one-page layout: your details, the recipient's address, the date, a subject line naming the position, a named greeting where possible, and a list of enclosures. State your earliest start date and salary expectations when the advert asks. Write in the language of the advert.",
      sources: [{ title: "Make it in Germany: applications", url: "https://www.make-it-in-germany.com/en/working-in-germany/job/application" }, europassSource],
    },
  };
  const regional: Partial<CoverLetterProfile> = europeanCountries.has(country) ? {
    label: `European cover letter — ${country}`, ...british,
    guidance: "European letters are normally formal and one page long, with a subject line naming the position, specific evidence matched to the vacancy, and a list of enclosures. Check whether the employer expects the letter in the local language.",
    sources: [europassSource],
  } : {};
  const profile: CoverLetterProfile = { ...base, ...regional, ...profiles[country] };
  if (kind === "study") {
    profile.label = `Admissions cover letter — ${country}`;
    profile.subjectLine = true;
    profile.guidance = "Address the admissions committee, name the programme and intake, then cover your academic background, why this programme and institution, relevant experience and your goals after graduation. Many universities ask for a personal statement or statement of purpose with their own prompts and word limits; those instructions take priority.";
    profile.sources = profile.sources.filter(source => source === europassSource);
  }
  if (kind === "visa") {
    profile.label = `Visa application cover letter — ${country}`;
    profile.subjectLine = true;
    profile.guidance = "A visa cover letter should be factual, not persuasive: state the visa type and travel dates, the purpose of the trip, where you will stay, who pays, your circumstances at home and why you will return, and list the documents enclosed. Every statement must match your application form and evidence. Some posts do not require a cover letter; follow the official checklist for your route.";
    profile.sources = visaSources[country] ?? (schengenCountries.has(country) ? visaSources.schengen : []);
  }
  return profile;
}

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);
type FieldLabels = Record<"target" | "reference" | "background" | "motivation" | "plans" | "funding" | "ties" | "organisation" | "achievements", string>;
export function coverLetterLabels(kind: CoverLetterKind): FieldLabels {
  if (kind === "study") return { target: "Programme / course", reference: "Applicant ID or application reference", organisation: "University / institution", background: "Academic background", achievements: "Relevant projects, research and achievements", motivation: "Why this programme and institution", plans: "Career goals after graduation", funding: "How you will fund your studies", ties: "" };
  if (kind === "visa") return { target: "Visa type", reference: "Application reference (e.g. GWF or VAF number)", organisation: "Embassy, high commission, consulate or visa centre", background: "Your current employment, studies or business at home", achievements: "", motivation: "Purpose of your trip", plans: "Itinerary and accommodation", funding: "Who is paying and your financial means", ties: "Ties to home and reasons you will return" };
  return { target: "Position / job title", reference: "Job reference number", organisation: "Employer / organisation", background: "Relevant experience and skills", achievements: "Key achievements (one per line)", motivation: "Why this role and organisation", plans: "", funding: "", ties: "" };
}

export function coverLetterIssues(data: CoverLetterData): string[] {
  const issues: string[] = [];
  const labels = coverLetterLabels(data.kind);
  const required: [keyof CoverLetterData, string][] = [["name", "Full name"], ["email", "Email address"], ["phone", "Phone number"], ["address", "Your address or city and country"], ["organisation", labels.organisation], ["target", labels.target], ["background", labels.background], ["motivation", labels.motivation]];
  if (data.kind === "study") required.push(["plans", labels.plans]);
  if (data.kind === "visa") required.push(["travelFrom", "Arrival date"], ["travelTo", "Departure date"], ["plans", labels.plans], ["funding", labels.funding], ["ties", labels.ties]);
  for (const [key, label] of required) if (!data[key].trim()) issues.push(`${label} is required.`);
  if (data.email.trim() && !validEmail(data.email.trim())) issues.push("Enter a valid email address.");
  if (data.phone.trim() && data.phone.replace(/\D/g, "").length < 7) issues.push("Enter a valid phone number, including its dialling code where needed.");
  if (data.date && !validDate(data.date)) issues.push("Enter a valid letter date, or leave it blank to use today's date.");
  if (data.kind === "visa") {
    for (const [key, label] of [["travelFrom", "Arrival date"], ["travelTo", "Departure date"]] as const) if (data[key] && !validDate(data[key])) issues.push(`${label} must be a valid date.`);
    if (validDate(data.travelFrom) && validDate(data.travelTo) && data.travelTo < data.travelFrom) issues.push("Departure date cannot be before the arrival date.");
  }
  return issues;
}

function formatDate(value: string, locale: CoverLetterProfile["dateLocale"]) {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}
const lines = (value: string) => value.split(/\r\n|\r|\n/).map(line => line.trim().replace(/^[-•*]\s*/, "")).filter(Boolean);
const paragraph = (value: string) => value.trim().replace(/\n{3,}/g, "\n\n");
const words = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;
const wordLimits: Record<CoverLetterKind, [number, number]> = { job: [200, 450], study: [250, 600], visa: [200, 600] };
const definiteCountries = new Set(["Bahamas", "Central African Republic", "Comoros", "Democratic Republic of the Congo", "Dominican Republic", "Gambia", "Maldives", "Marshall Islands", "Netherlands", "Philippines", "Seychelles", "Solomon Islands", "United Arab Emirates", "United Kingdom", "United States"]);
/** Country name as used mid-sentence, e.g. "the United Kingdom". */
export const inCountry = (country: string) => definiteCountries.has(country) ? `the ${country}` : country;
const isoToday = (today: Date) => new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())).toISOString().slice(0, 10);

export function buildCoverLetter(data: CoverLetterData, country: string, today = new Date()) {
  const issues = coverLetterIssues(data);
  if (issues.length) throw new Error(issues.join("\n"));
  const profile = coverLetterProfile(country, data.kind);
  const t = (key: keyof CoverLetterData) => data[key].trim();
  const named = Boolean(t("recipientName"));
  const salutation = named ? `Dear ${t("recipientName")},`
    : data.kind === "study" ? "Dear Admissions Committee,"
    : data.kind === "visa" ? (profile.unknownSalutation === "Dear Sir or Madam," ? "Dear Sir or Madam," : "Dear Visa Officer,")
    : profile.unknownSalutation;
  const closing = named ? profile.closingNamed : profile.closingUnknown;
  const recipient = [named ? t("recipientName") : data.kind === "visa" ? "The Visa Officer" : "", t("recipientTitle"), t("organisation"), t("organisationAddress")].filter(Boolean).join("\n");
  const reference = t("reference");
  const subject = data.kind === "visa"
    ? `Re: ${t("target")} application — ${t("name")}${t("passportNumber") ? `, passport no. ${t("passportNumber")}` : ""}${reference ? ` (reference ${reference})` : ""}`
    : data.kind === "study"
      ? `Re: Application for ${t("target")}${reference ? ` (applicant ID ${reference})` : ""}`
      : `Re: Application for the position of ${t("target")}${reference ? ` (reference ${reference})` : ""}`;
  const body: string[] = [];
  const achievements = lines(data.achievements);
  if (data.kind === "job") {
    body.push(`I am writing to apply for the position of ${t("target")} at ${t("organisation")}${t("source") ? `, as advertised via ${t("source")}` : ""}.`);
    body.push(paragraph(data.background));
    if (achievements.length) body.push(["Achievements relevant to this role include:", ...achievements.map(item => `• ${item}`)].join("\n"));
    body.push(paragraph(data.motivation));
    const practical = [
      t("workAuthorization") ? `Right to work: ${t("workAuthorization")}` : "",
      t("availability") ? `Availability: ${t("availability")}` : "",
      t("salary") ? `Salary expectations: ${t("salary")}` : "",
    ].filter(Boolean);
    if (practical.length) body.push(practical.join("\n"));
    body.push(`Thank you for considering my application. I would welcome the opportunity to discuss how I can contribute to ${t("organisation")}, and I can be reached on ${t("phone")} or at ${t("email")}.`);
  } else if (data.kind === "study") {
    body.push(`I am writing to apply for admission to the ${t("target")} at ${t("organisation")}${t("intake") ? ` for the ${t("intake")} intake` : ""}.`);
    body.push(paragraph(data.background));
    if (achievements.length) body.push(["Relevant projects, research and achievements include:", ...achievements.map(item => `• ${item}`)].join("\n"));
    body.push(paragraph(data.motivation));
    body.push(paragraph(data.plans));
    if (t("funding")) body.push(paragraph(data.funding));
    body.push(`Thank you for considering my application. I would welcome the opportunity to provide any further information, and I can be reached on ${t("phone")} or at ${t("email")}.`);
  } else {
    const days = Math.round((Date.parse(data.travelTo) - Date.parse(data.travelFrom)) / 86_400_000) + 1;
    body.push(`I am applying for a ${t("target")} to travel to ${inCountry(country)} from ${formatDate(data.travelFrom, profile.dateLocale)} to ${formatDate(data.travelTo, profile.dateLocale)} (${days} day${days === 1 ? "" : "s"}). This letter explains the purpose of my trip and summarises my circumstances${t("enclosures") ? " and the supporting documents enclosed" : ""}.`);
    body.push(paragraph(data.motivation));
    if (t("host")) body.push(paragraph(data.host));
    body.push(paragraph(data.plans));
    body.push(paragraph(data.background));
    body.push(paragraph(data.funding));
    body.push(paragraph(data.ties));
    if (t("travelHistory")) body.push(paragraph(data.travelHistory));
    body.push(`I confirm that the information in this letter is true and complete to the best of my knowledge and consistent with my application. Thank you for considering my application. I can be contacted on ${t("phone")} or at ${t("email")} if you need any further information.`);
  }
  const enclosures = lines(data.enclosures);
  const text = [
    [t("name"), t("address"), [t("email"), t("phone")].join(" | ")].join("\n"),
    formatDate(data.date || isoToday(today), profile.dateLocale),
    recipient,
    profile.subjectLine || reference ? subject : "",
    salutation,
    ...body,
    `${closing}\n\n${t("name")}`,
    enclosures.length ? ["Enclosures:", ...enclosures.map(item => `• ${item}`)].join("\n") : "",
  ].filter(Boolean).join("\n\n");
  const count = words(body.join(" "));
  const [min, max] = wordLimits[data.kind];
  const notes: Flag[] = [
    `Formatted for ${inCountry(country)}: ${profile.paperSize} paper, ${profile.dateLocale === "en-US" ? "month-first" : "day-first"} date, “${salutation}” with “${closing.replace(/,$/, "")}”.`,
    count > max ? `The letter body is about ${count} words. Shorten it towards ${max} words so it fits on one page.` : count < min ? `The letter body is about ${count} words. Add a specific example or detail so it reaches at least ${min} words.` : `The letter body is about ${count} words, within the usual one-page range.`,
    named ? "The greeting names the recipient. Check the spelling and title against the advert or official contact page." : data.kind === "visa" ? `Addressed to the visa officer at ${t("organisation")}. Check the exact name and address on the official application instructions.` : "No recipient name was supplied. Address the letter to a named person when the advert or institution gives one.",
    "Only the details you entered were used. Check every fact, date and amount against your CV, application form and evidence before signing.",
  ].map((body, index) => ({ type: index === 1 && (count > max || count < min) || index === 2 && !named && data.kind !== "visa" ? "weak" : "excellent", title: ["Format", "Length", "Recipient", "Accuracy"][index], body }));
  return { name: t("name"), text, title: coverLetterTitles[data.kind], paperSize: profile.paperSize, notes };
}
export type CoverLetterDraft = ReturnType<typeof buildCoverLetter>;

/** Checks an uploaded letter against the destination's conventions without changing it. */
export function reviewCoverLetter(text: string, country: string, kind: CoverLetterKind): Flag[] {
  const profile = coverLetterProfile(country, kind);
  const source = text.trim();
  const checks: Flag[] = [];
  const pass = (title: string, body: string) => checks.push({ type: "excellent", title, body });
  const fix = (title: string, body: string) => checks.push({ type: "weak", title, body });
  const count = words(source);
  const [min, max] = wordLimits[kind];
  if (count > max) fix("Length", `About ${count} words. Cut it towards ${max} words so it fits on one page.`);
  else if (count < min) fix("Length", `About ${count} words. Expand it with a specific example or detail so it reaches at least ${min} words.`);
  else pass("Length", `About ${count} words, within the usual one-page range.`);
  const blocks = source.split(/\n\s*\n/).filter(block => block.trim()).length;
  if (blocks < 4) fix("Structure", "Separate your contact details, greeting, opening, body paragraphs and sign-off with blank lines so each part is easy to scan.");
  if (!/[^\s@]+@[^\s@]+\.[^\s@]+/.test(source) || !/\+?\d[\d\s()-]{6,}\d/.test(source)) fix("Contact details", "Include your email address and phone number (with the international dialling code) at the top of the letter.");
  else pass("Contact details", "Email address and phone number found.");
  if (!/\b(\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+\d{4}|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(st|nd|rd|th)?,?\s+\d{4}|\d{1,4}[/.-]\d{1,2}[/.-]\d{2,4})\b/i.test(source))
    fix("Date", `Add the date written in full, for example ${formatDate("2026-10-12", profile.dateLocale)}.`);
  const greeting = source.match(/^\s*(dear\s+[^\n,:]*|to whom it may concern)/im)?.[1]?.trim();
  const unnamedGreeting = Boolean(greeting && /^(dear\s+(sir|madam|sir or madam|hiring|recruit|admissions|visa|selection|team|committee|officer)|to whom)/i.test(greeting));
  if (!greeting) fix("Greeting", `Add a greeting such as “Dear [Name],” or, if no name is available, “${kind === "study" ? "Dear Admissions Committee," : kind === "visa" ? "Dear Visa Officer," : profile.unknownSalutation}”.`);
  else if (/^to whom/i.test(greeting)) fix("Greeting", `Replace “To whom it may concern” with a named greeting or “${kind === "study" ? "Dear Admissions Committee," : kind === "visa" ? "Dear Visa Officer," : profile.unknownSalutation}”.`);
  else pass("Greeting", `Found “${greeting}”.`);
  const signOff = source.match(/\b(yours sincerely|yours faithfully|sincerely|kind regards|best regards|warm regards|regards|respectfully)\b/i)?.[1];
  const expected = unnamedGreeting ? profile.closingUnknown : profile.closingNamed;
  if (!signOff) fix("Sign-off", `End with “${expected}” followed by your full name.`);
  else if (profile.closingNamed !== profile.closingUnknown && greeting && signOff.toLowerCase() !== expected.replace(/,$/, "").toLowerCase() && /yours/i.test(signOff))
    fix("Sign-off", `In letters for ${inCountry(country)}, “${greeting}” is normally followed by “${expected.replace(/,$/, "")}”, not “${signOff}”.`);
  else pass("Sign-off", `Found “${signOff}”.`);
  if (profile.subjectLine && !/^\s*(re:|subject:|ref:|application for|betreff)/im.test(source)) fix("Subject line", `Add a subject line above the greeting, for example “Re: ${kind === "visa" ? "Visitor visa application — [your name]" : kind === "study" ? "Application for [programme]" : "Application for the position of [job title]"}”.`);
  if (profile.omitPersonalData && /\b(date of birth|d\.o\.b|dob|marital status|married|single mother|religion|religious|years old|age:\s*\d)\b/i.test(source)) fix("Personal details", `Remove age, date of birth, marital status and religion. They are not expected in applications for ${inCountry(country)}.`);
  if (/\b(hard[- ]?working|team player|go-getter|perfect candidate|best candidate|think outside the box|passionate about everything)\b/i.test(source)) fix("Generic claims", "Replace generic claims such as “hard-working” or “team player” with a specific example of what you did and the result.");
  if (kind === "job" && !/(^|\bi\s+|[•*-]\s*)(led|managed|built|delivered|increased|reduced|improved|created|developed|trained|organised|organized|achieved)\b|\d+(\.\d+)?\s?%|\b\d+ (people|staff|colleagues|clients|customers|projects|students)\b/im.test(source)) fix("Evidence", "Add at least one concrete achievement with a genuine result, for example the size of a team or project, or an improvement you can verify.");
  if (kind === "study" && !/\b(career|after (graduat|complet)|goal|plan to|intend to)\b/i.test(source)) fix("Future plans", "Explain what you plan to do after completing the programme and how it connects to your background.");
  if (kind === "visa") {
    if (!/\b(from|between|arriv|depart|return)\b[^.\n]*\d{4}/i.test(source)) fix("Travel dates", "State your exact arrival and departure dates, matching your application form and bookings.");
    if (!/\b(fund|bank|statement|savings|salary|sponsor|pay|paid|cover the cost)\b/i.test(source)) fix("Funding", "Explain who is paying for the trip and point to the financial evidence enclosed.");
    if (!/\b(return|employ|job|business|family|property|studies|enrolled|leave approved)\b/i.test(source)) fix("Ties and return", "Explain your employment, studies, family or other commitments at home and when you will return.");
    if (!/\b(stay|hotel|accommodation|host|address)\b/i.test(source)) fix("Accommodation", "Say where you will stay, with the address or host's details, matching your booking or invitation.");
  }
  if (/\benclos|attached|attachment|anlage/i.test(source)) pass("Enclosures", "Enclosed documents are mentioned.");
  else if (kind === "visa" || country === "Germany") fix("Enclosures", "List the documents enclosed with the letter at the end, for example your CV, certificates or financial evidence.");
  return checks;
}
