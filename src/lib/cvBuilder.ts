import type { CvDocumentContent } from "./cvTemplates";

export type CvKind = "job" | "academic";
export type CvHistory = { id: string; title: string; organisation: string; location: string; start: string; end: string; current: boolean; details: string };
export type CvEducation = CvHistory & { grade: string; thesis: string; supervisor: string };
export type CvReferee = { id: string; name: string; position: string; organisation: string; email: string; phone: string };
export type CvBuilderData = {
  kind: CvKind; name: string; email: string; phone: string; location: string; target: string;
  linkedin: string; website: string; orcid: string; scholar: string;
  summary: string; researchInterests: string; skills: string; languages: string;
  education: CvEducation[]; employment: CvHistory[]; research: CvHistory[]; teaching: CvHistory[];
  projects: string; certifications: string; awards: string; volunteering: string; memberships: string;
  publications: string; workingPapers: string; presentations: string; grants: string; service: string; patents: string; training: string;
  workAuthorization: string; availability: string; additional: string;
  referenceMode: "omit" | "on_request" | "include"; referees: CvReferee[];
};
export const emptyHistory = (id: string): CvHistory => ({ id, title: "", organisation: "", location: "", start: "", end: "", current: false, details: "" });
export const emptyEducation = (id: string): CvEducation => ({ ...emptyHistory(id), grade: "", thesis: "", supervisor: "" });
export const emptyReferee = (id: string): CvReferee => ({ id, name: "", position: "", organisation: "", email: "", phone: "" });
export function emptyCvBuilder(): CvBuilderData {
  return {
    kind: "job", name: "", email: "", phone: "", location: "", target: "", linkedin: "", website: "", orcid: "", scholar: "",
    summary: "", researchInterests: "", skills: "", languages: "", education: [emptyEducation("education-1")], employment: [], research: [], teaching: [],
    projects: "", certifications: "", awards: "", volunteering: "", memberships: "", publications: "", workingPapers: "", presentations: "", grants: "", service: "", patents: "", training: "",
    workAuthorization: "", availability: "", additional: "", referenceMode: "omit", referees: [],
  };
}
const academicSource = { title: "Oxford: academic CVs", url: "https://www.ox.ac.uk/careers/careers-guidance/job-search-and-applications/writing-applications/academic-applications" };
const europassSource = { title: "Europass: CV sections", url: "https://europass.europa.eu/en/how-complete-my-europass-profile" };
type CvCountryProfile = {
  label: string; locationLabel: string; paperSize: "A4" | "Letter"; languageHint: string; guidance: string;
  referenceHint: string; showWorkAuthorization: boolean; sources: { title: string; url: string }[];
};
const europeanCountries = new Set(["Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark", "Estonia", "Finland", "France", "Greece", "Hungary", "Iceland", "Italy", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Netherlands", "Norway", "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland"]);
export function cvCountryProfile(country: string, kind: CvKind): CvCountryProfile {
  const base: CvCountryProfile = {
    label: `International template — ${country}`, locationLabel: "Current city and country", paperSize: "A4",
    languageHint: "List languages and your actual proficiency, for example English — fluent.",
    guidance: "Use clear section headings and list the most recent qualifications and experience first. Country-specific requirements have not been verified for this destination; follow the employer or university instructions.",
    referenceHint: "Include referee details only when the application asks for them; otherwise omit them or choose available on request.",
    showWorkAuthorization: false, sources: [],
  };
  const profiles: Record<string, Partial<CvCountryProfile>> = {
    Canada: {
      label: "Canadian résumé", locationLabel: "Current city, province / region and country", paperSize: "Letter",
      guidance: "For job applications, aim for a concise résumé of up to two pages, emphasise relevant achievements, and omit photos, age and marital status.",
      referenceHint: "Canadian job résumés normally omit references. Include details only if specifically requested.",
      sources: [{ title: "Canada Job Bank: résumé guidance", url: "https://www.jobbank.gc.ca/findajob/resources/write-good-resume" }],
    },
    "United States": {
      label: "US résumé", locationLabel: "Current city, state / region and country", paperSize: "Letter",
      guidance: "Use a targeted résumé for general employment, with contact details, relevant qualifications, skills and dated achievements. Federal roles and specialist applications may ask for additional details in their vacancy instructions.",
      sources: [{ title: "CareerOneStop: résumé contact details", url: "https://cloudfront.careeronestop.org/JobSearch/Resumes/ResumeGuide/top-portion-of-resume.aspx" }],
    },
    "United Kingdom": {
      label: "UK CV", showWorkAuthorization: true,
      guidance: "Include contact details, a short introduction, education and dated work history. Highlight projects or volunteering when applying for your first job. Omit age, date of birth, marital status and nationality.",
      referenceHint: "UK guidance recommends references available on request rather than listing a referee's contact details, unless the application asks for them.",
      sources: [{ title: "UK National Careers Service: CV sections", url: "https://nationalcareers.service.gov.uk/careers-advice/cv-sections" }],
    },
    Germany: {
      label: "German CV / Lebenslauf", showWorkAuthorization: true,
      guidance: "Provide a clear dated education and employment history, relevant qualifications and language proficiency. Check the advert's application language and requested supporting certificates. A photo is not a compulsory field in this text-based builder.",
      languageHint: "For German and other languages, state a CEFR level (A1–C2) when known, or describe your actual proficiency.",
      sources: [{ title: "Make it in Germany: applications", url: "https://www.make-it-in-germany.com/en/working-in-germany/job/application" }, europassSource],
    },
    Ireland: {
      label: "Irish CV — European section guidance", showWorkAuthorization: true,
      guidance: "Use a targeted CV with dated qualifications, employment, language and digital skills. This builder uses general European section guidance; check the employer's specific Irish application instructions.",
      sources: [europassSource],
    },
    Australia: {
      label: "Australian résumé", showWorkAuthorization: true,
      guidance: "Include contact details, a professional profile, relevant skills, dated work history and qualifications. Follow the employer's requested length and referee instructions.",
      sources: [{ title: "Australian Government: résumé guidance", url: "https://www.pev.gov.au/sites/default/files/2025-11/Creating%20your%20resume%20for%20the%20Australian%20job%20market%7CEnglish.pdf" }],
    },
    "New Zealand": {
      label: "New Zealand CV", showWorkAuthorization: true,
      guidance: "Cover contact details, relevant skills, dated experience and qualifications. Use referee details when requested by the employer.",
      sources: [{ title: "Careers NZ: writing a CV", url: "https://knowyourcv.careers.govt.nz/job-hunting/cvs-and-cover-letters/how-to-write-a-cv/" }],
    },
  };
  const regional = europeanCountries.has(country) ? {
    label: `European CV section guidance — ${country}`, showWorkAuthorization: true,
    guidance: "European section guidance covers dated education, work experience, language and digital skills. This is a custom CV draft; follow the specific employer or institution's preferred template.",
    languageHint: "State a CEFR language level (A1–C2) when known, alongside any language certificate.", sources: [europassSource],
  } : {};
  const profile = { ...base, ...regional, ...profiles[country] };
  if (kind === "academic") {
    const hasCountryGuidance = profile.sources.length > 0;
    profile.label = `Academic CV — ${country}`;
    profile.guidance = "Lead with your academic profile and education, then relevant research, teaching and scholarly outputs. Academic CV length depends on your record and the institution's instructions; the job résumé length guidance does not apply.";
    if (!hasCountryGuidance) profile.guidance += " Country-specific requirements have not been verified for this destination; this uses general academic section guidance.";
    profile.referenceHint = "Academic applications may ask for academic referees. Add their role, institution and contact details when requested, with their agreement.";
    profile.sources = [academicSource, ...profile.sources];
  }
  return profile;
}
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validMonth = (value: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && Number(value.slice(0, 4)) >= 1900;
const urlFields = ["linkedin", "website", "orcid", "scholar"] as const;
export function cvBuilderIssues(data: CvBuilderData): string[] {
  const issues: string[] = [];
  for (const [key, label] of [["name", "Full name"], ["email", "Email address"], ["phone", "Phone number"], ["location", "Current location"], ["target", "Target role or programme"], ["skills", "Relevant skills"]] as const) if (!data[key].trim()) issues.push(`${label} is required.`);
  if (data.email.trim() && !validEmail(data.email.trim())) issues.push("Enter a valid email address.");
  if (data.phone.trim() && data.phone.replace(/\D/g, "").length < 7) issues.push("Enter a valid phone number, including its dialling code where needed.");
  if (!(data.kind === "job" ? data.summary : data.researchInterests).trim()) issues.push(data.kind === "job" ? "Professional summary is required." : "Research interests / academic profile is required.");
  for (const key of urlFields) {
    if (data.kind === "job" && (key === "orcid" || key === "scholar")) continue;
    if (!data[key].trim()) continue;
    try { if (!["http:", "https:"].includes(new URL(data[key].trim()).protocol)) throw new Error(); }
    catch { issues.push(`${key === "website" ? "Portfolio / website" : key} must be a full http or https URL.`); }
  }
  if (!data.education.length) issues.push("Add at least one education entry.");
  const histories = [["Education", data.education], ["Work experience", data.employment], ...(data.kind === "academic" ? [["Research experience", data.research], ["Teaching experience", data.teaching]] as const : [])] as const;
  for (const [label, entries] of histories) for (const [index, entry] of entries.entries()) {
    const prefix = `${label} ${index + 1}`;
    if (!entry.title.trim() || !entry.organisation.trim()) issues.push(`${prefix}: title / qualification and organisation are required.`);
    if (!validMonth(entry.start) || !entry.current && !validMonth(entry.end)) issues.push(`${prefix}: enter valid start and end months, or mark it as current.`);
    else if (!entry.current && entry.end < entry.start) issues.push(`${prefix}: end date cannot be before start date.`);
    if (label === "Education" && entry.current && entry.end && (!validMonth(entry.end) || entry.end < entry.start)) issues.push(`${prefix}: expected completion must be a valid month after the start date.`);
    if (label !== "Education" && !entry.details.trim()) issues.push(`${prefix}: describe your responsibilities or contributions.`);
  }
  if (data.referenceMode === "include" && !data.referees.length) issues.push("Add at least one referee, or choose to omit references.");
  if (data.referenceMode === "include") for (const [index, referee] of data.referees.entries()) {
    if (![referee.name, referee.position, referee.organisation, referee.email].every(value => value.trim())) issues.push(`Referee ${index + 1}: name, role, organisation and email are required.`);
    else if (!validEmail(referee.email.trim())) issues.push(`Referee ${index + 1}: enter a valid email address.`);
  }
  return issues;
}
function month(value: string) {
  const [year, number] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, number - 1, 1)));
}
function chronological<T extends CvHistory>(entries: T[]): T[] {
  return [...entries].sort((a, b) => Number(b.current) - Number(a.current) || (a.current && b.current ? b.start.localeCompare(a.start) : b.end.localeCompare(a.end) || b.start.localeCompare(a.start)));
}
function historyText(entries: CvHistory[]) {
  return chronological(entries).map(entry => [
    `${entry.title.trim()} — ${entry.organisation.trim()}`,
    [entry.location.trim(), `${month(entry.start)} – ${entry.current ? "Present" : month(entry.end)}`].filter(Boolean).join(" | "),
    entry.details.trim(),
  ].filter(Boolean).join("\n")).join("\n\n");
}
export function buildCvDraft(data: CvBuilderData, country: string) {
  const issues = cvBuilderIssues(data);
  if (issues.length) throw new Error(issues.join("\n"));
  const profile = cvCountryProfile(country, data.kind);
  const education = chronological(data.education).map(entry => [
    `${entry.title.trim()} — ${entry.organisation.trim()}`,
    [entry.location.trim(), `${month(entry.start)} – ${entry.current ? `Present${entry.end ? ` (expected completion: ${month(entry.end)})` : ""}` : month(entry.end)}`].filter(Boolean).join(" | "),
    entry.grade.trim() ? `Grade / classification: ${entry.grade.trim()}` : "",
    data.kind === "academic" && entry.thesis.trim() ? `Thesis / dissertation: ${entry.thesis.trim()}` : "",
    data.kind === "academic" && entry.supervisor.trim() ? `Supervisor: ${entry.supervisor.trim()}` : "",
    entry.details.trim(),
  ].filter(Boolean).join("\n")).join("\n\n");
  const sections: string[] = [
    data.name.trim(), [data.email.trim(), data.phone.trim(), data.location.trim()].join(" | "),
    [data.linkedin.trim(), data.website.trim(), ...(data.kind === "academic" ? [data.orcid.trim(), data.scholar.trim()] : [])].filter(Boolean).join("\n"),
    `${data.kind === "academic" ? "Target programme / academic role" : "Target role"}: ${data.target.trim()}`,
  ].filter(Boolean);
  const content: CvDocumentContent = { name: data.name.trim(), contact: sections.slice(1), sections: [] };
  const add = (heading: string, text: string) => {
    if (text.trim()) { sections.push(`${heading}\n${text.trim()}`); content.sections.push({ heading, body: text.trim() }); }
  };
  if (data.kind === "academic") {
    add("RESEARCH INTERESTS / ACADEMIC PROFILE", data.researchInterests);
    add("EDUCATION", education);
    add("RESEARCH EXPERIENCE", historyText(data.research));
    add("TEACHING AND SUPERVISION", historyText(data.teaching));
    add("PUBLICATIONS", data.publications);
    add("WORKING PAPERS AND WORK IN PROGRESS", data.workingPapers);
    add("CONFERENCE PRESENTATIONS AND POSTERS", data.presentations);
    add("GRANTS AND FUNDING", data.grants);
    add("ACADEMIC SERVICE AND LEADERSHIP", data.service);
    add("PATENTS AND INTELLECTUAL PROPERTY", data.patents);
    add("RELEVANT PROFESSIONAL EXPERIENCE", historyText(data.employment));
  } else {
    add("PROFESSIONAL SUMMARY", data.summary);
    add("KEY SKILLS", data.skills);
    add("WORK EXPERIENCE", historyText(data.employment));
    add("EDUCATION", education);
  }
  add("PROJECTS", data.projects);
  add("CERTIFICATIONS AND LICENCES", data.certifications);
  add("AWARDS AND HONOURS", data.awards);
  if (data.kind === "academic") add("RESEARCH, TECHNICAL AND LABORATORY SKILLS", data.skills);
  add("LANGUAGES", data.languages);
  add("PROFESSIONAL DEVELOPMENT", data.training);
  add("VOLUNTEERING AND COMMUNITY ENGAGEMENT", data.volunteering);
  add("PROFESSIONAL MEMBERSHIPS", data.memberships);
  if (profile.showWorkAuthorization) add("WORK AUTHORISATION (AS SUPPLIED)", data.workAuthorization);
  if (data.kind === "job") add("AVAILABILITY", data.availability);
  add("ADDITIONAL APPLICATION INFORMATION", data.additional);
  if (data.referenceMode === "on_request") add("REFERENCES", "Available on request.");
  if (data.referenceMode === "include") add("REFEREES", data.referees.map(referee => [referee.name.trim(), `${referee.position.trim()} — ${referee.organisation.trim()}`, [referee.email.trim(), referee.phone.trim()].filter(Boolean).join(" | ")].join("\n")).join("\n\n"));
  return { name: data.name.trim(), text: sections.join("\n\n"), content, title: data.kind === "academic" ? "Academic CV" : "Job CV", paperSize: profile.paperSize };
}
export type CvDraft = ReturnType<typeof buildCvDraft>;
