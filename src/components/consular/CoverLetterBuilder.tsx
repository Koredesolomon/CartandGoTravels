"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { buildCoverLetter, coverLetterIssues, coverLetterLabels, coverLetterProfile, type CoverLetterData, type CoverLetterDraft } from "@/lib/coverLetter";

const input = "mt-1 w-full rounded-md border border-[#d7dfe5] bg-white px-3 py-2.5 text-sm font-normal text-[#07141a] outline-none focus:border-[#0098ba]";
function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <fieldset className="min-w-0 rounded-lg border border-[#d7dfe5] p-4 sm:p-5"><legend className="max-w-full px-2 text-base font-black text-[#07141a]">{title}</legend>{description ? <p className="mb-4 text-sm leading-6 text-[#5b6870]">{description}</p> : null}<div className="grid gap-4 sm:grid-cols-2">{children}</div></fieldset>;
}
function Field({ label, value, onChange, required = false, area = false, type = "text", help }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; area?: boolean; type?: string; help?: string }) {
  const helpId = useId();
  return <label className={`block text-[12.5px] font-semibold text-[#07141a] ${area ? "sm:col-span-2" : ""}`}>
    {label}{required ? <span aria-hidden="true"> *</span> : <span className="font-normal text-[#5b6870]"> (optional)</span>}
    {area ? <textarea required={required} aria-label={label} aria-describedby={help ? helpId : undefined} rows={4} className={input} value={value} onChange={event => onChange(event.target.value)} /> : <input required={required} aria-label={label} aria-describedby={help ? helpId : undefined} type={type} className={input} value={value} onChange={event => onChange(event.target.value)} />}
    {help ? <span id={helpId} className="mt-1 block text-xs font-normal leading-5 text-[#5b6870]">{help}</span> : null}
  </label>;
}

export function CoverLetterBuilder({ country, value, onChange, onBuild }: { country: string; value: CoverLetterData; onChange: (value: CoverLetterData) => void; onBuild: (draft: CoverLetterDraft) => void }) {
  const [issues, setIssues] = useState<string[]>([]);
  const errorRef = useRef<HTMLDivElement>(null);
  const { kind } = value;
  const profile = coverLetterProfile(country, kind);
  const labels = coverLetterLabels(kind);
  const set = (key: keyof CoverLetterData, next: string) => { setIssues([]); onChange({ ...value, [key]: next }); };
  const field = (key: keyof CoverLetterData, label: string, options: { required?: boolean; area?: boolean; type?: string; help?: string } = {}) => <Field key={key} label={label} value={value[key]} onChange={next => set(key, next)} {...options} />;
  const firstPerson = "Write in the first person using your own facts; it is inserted into the letter as written.";
  return <form noValidate className="mt-6 space-y-6" onSubmit={event => {
    event.preventDefault();
    const nextIssues = coverLetterIssues(value);
    setIssues(nextIssues);
    if (nextIssues.length) { requestAnimationFrame(() => errorRef.current?.focus()); return; }
    onBuild(buildCoverLetter(value, country));
  }}>
    <div className="rounded-md bg-[#e8f6fb] p-4 text-sm leading-6 text-[#0f5e68]">
      <p className="font-black">{profile.label}</p><p className="mt-1">{profile.guidance}</p>
      <p className="mt-2">Fields marked * are needed to build this letter. The letter uses {profile.paperSize} paper, a {profile.dateLocale === "en-US" ? "month-first" : "day-first"} date and the greeting and sign-off expected for {country}.</p>
      {profile.sources.length ? <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">{profile.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="underline">{source.title}</a>)}</p> : null}
    </div>
    <Section title="Your details">
      {field("name", "Full name", { required: true })}
      {field("email", "Email address", { required: true, type: "email" })}
      {field("phone", "Phone number", { required: true, type: "tel", help: "Include the international dialling code when applying abroad." })}
      {field("address", "Your address or city and country", { required: true })}
      {field("date", "Letter date", { type: "date", help: "Leave blank to use today's date." })}
    </Section>
    <Section title="Recipient" description={kind === "visa" ? "Address the letter to the embassy, high commission, consulate or visa centre processing your application." : "Use a named person from the advert or institution's website whenever possible."}>
      {field("recipientName", "Recipient name for the greeting", { help: "For example Ms Okafor or Dr Weber. Leave blank to use the standard unnamed greeting." })}
      {field("recipientTitle", "Recipient job title / department")}
      {field("organisation", labels.organisation, { required: true })}
      {field("organisationAddress", "Organisation address")}
    </Section>
    <Section title={kind === "visa" ? "Visa and travel details" : kind === "study" ? "Programme details" : "Job details"}>
      {field("target", labels.target, { required: true, help: kind === "visa" ? "Use the official visa name, for example Standard Visitor visa or Schengen short-stay visa." : undefined })}
      {field("reference", labels.reference)}
      {kind === "job" ? field("source", "Where you saw the advert", { help: "For example the company careers page, LinkedIn or Job Bank." }) : null}
      {kind === "study" ? field("intake", "Intake / start term", { help: "For example September 2027." }) : null}
      {kind === "visa" ? <>
        {field("travelFrom", "Arrival date", { required: true, type: "date" })}
        {field("travelTo", "Departure date", { required: true, type: "date" })}
        {field("passportNumber", "Passport number", { help: "Include it only if your checklist asks for it in the cover letter." })}
      </> : null}
    </Section>
    <Section title="Letter content" description={firstPerson}>
      {kind === "visa" ? <>
        {field("motivation", labels.motivation, { required: true, area: true, help: "Explain exactly why you are travelling, for example tourism, a conference or visiting family, and what you will do." })}
        {field("host", "Who you are visiting or who invited you", { area: true, help: "Give the host or inviting organisation's name, relationship and address, if applicable." })}
        {field("plans", labels.plans, { required: true, area: true, help: "List the places you will visit and where you will stay, matching your bookings or invitation." })}
        {field("background", labels.background, { required: true, area: true, help: "State your job title, employer and approved leave, or your course and institution." })}
        {field("funding", labels.funding, { required: true, area: true, help: "Say who pays for the trip and what evidence is enclosed, such as bank statements or a sponsor letter." })}
        {field("ties", labels.ties, { required: true, area: true, help: "Describe your actual commitments at home, such as your job, studies, family or property, and when you will return." })}
        {field("travelHistory", "Previous travel", { area: true, help: "List recent international trips and visas, if relevant. Disclose any previous refusals exactly as required on the form." })}
      </> : <>
        {field("background", labels.background, { required: true, area: true, help: kind === "study" ? "Summarise your qualifications, grades as awarded and relevant subjects." : "Match your experience and skills to the main requirements in the advert." })}
        {field("achievements", labels.achievements, { area: true, help: "Use one line per achievement, with genuine results you can support." })}
        {field("motivation", labels.motivation, { required: true, area: true, help: kind === "study" ? "Refer to specific modules, research groups or features of the programme." : "Show what you know about the organisation and why the role suits you." })}
        {kind === "study" ? <>
          {field("plans", labels.plans, { required: true, area: true, help: "Explain your goals after graduation and how the programme supports them." })}
          {field("funding", labels.funding, { area: true, help: "Include only if the institution asks for it, for example a scholarship or sponsor." })}
        </> : <>
          {field("workAuthorization", "Right to work / visa sponsorship", { help: "State your actual status, for example whether you need visa sponsorship. Do not include passport numbers." })}
          {field("availability", "Availability / notice period")}
          {field("salary", "Salary expectations", { help: "Include only when the advert asks for them." })}
        </>}
      </>}
      {field("enclosures", "Enclosures (one per line)", { area: true, help: kind === "visa" ? "List the supporting documents you are submitting, in the order of your checklist." : "For example CV, certificates or a portfolio." })}
    </Section>
    {issues.length ? <div role="alert" ref={errorRef} tabIndex={-1} className="rounded-md bg-red-50 p-4 text-sm text-red-800"><p className="font-bold">Complete or correct these fields before building your letter:</p><ul className="mt-2 list-disc space-y-1 pl-5">{issues.map(issue => <li key={issue}>{issue}</li>)}</ul></div> : null}
    <button type="submit" className="rounded-md bg-[#f0a42f] px-5 py-3 text-sm font-black text-[#07141a] hover:bg-[#ffb347]">Generate Cover Letter</button>
  </form>;
}
