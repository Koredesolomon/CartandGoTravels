"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { buildCvDraft, cvBuilderIssues, cvCountryProfile, emptyEducation, emptyHistory, emptyReferee, type CvBuilderData, type CvEducation, type CvHistory, type CvKind } from "@/lib/cvBuilder";

const input = "mt-1 w-full rounded-md border border-[#d7dfe5] bg-white px-3 py-2.5 text-sm font-normal text-[#07141a] outline-none focus:border-[#0098ba]";
const button = "rounded-md border border-[#0098ba] px-4 py-2 text-sm font-bold text-[#0f5e68] hover:bg-[#e8f6fb]";
function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <fieldset className="min-w-0 rounded-lg border border-[#d7dfe5] p-4 sm:p-5"><legend className="max-w-full px-2 text-base font-black text-[#07141a]">{title}</legend>{description ? <p className="mb-4 text-sm leading-6 text-[#5b6870]">{description}</p> : null}<div className="grid gap-4 sm:grid-cols-2">{children}</div></fieldset>;
}
function Field({ label, value, onChange, required = false, area = false, type = "text", help }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; area?: boolean; type?: string; help?: string }) {
  const helpId = useId();
  return <label className={`block text-[12.5px] font-semibold text-[#07141a] ${area ? "sm:col-span-2" : ""}`}>
    {label}{required ? <span aria-hidden="true"> *</span> : <span className="font-normal text-[#5b6870]"> (optional)</span>}
    {area ? <textarea required={required} aria-label={label} aria-describedby={help ? helpId : undefined} rows={4} className={input} value={value} onChange={event => onChange(event.target.value)} /> : <input required={required} aria-label={label} aria-describedby={help ? helpId : undefined} type={type} min={type === "month" ? "1900-01" : undefined} className={input} value={value} onChange={event => onChange(event.target.value)} />}
    {help ? <span id={helpId} className="mt-1 block text-xs font-normal leading-5 text-[#5b6870]">{help}</span> : null}
  </label>;
}
function HistoryEntries({ title, entries, education = false, academic, onChange }: { title: string; entries: CvHistory[]; education?: boolean; academic: boolean; onChange: (entries: CvHistory[]) => void }) {
  const update = (id: string, patch: Partial<CvEducation>) => onChange(entries.map(entry => entry.id === id ? { ...entry, ...patch } : entry));
  const entryLabel = education ? "Education" : title;
  return <Section title={title} description={education ? "Add each qualification, institution and attendance dates. The draft places your most recent education first." : "Add relevant paid roles, internships, placements or projects. Leave this section empty if you have no applicable experience."}>
    {entries.map((entry, index) => <div key={entry.id} className="grid gap-4 rounded-md bg-[#f6fbfd] p-4 sm:col-span-2 sm:grid-cols-2">
      <div className="flex items-center justify-between gap-3 sm:col-span-2"><h4 className="text-sm font-bold">{entryLabel} {index + 1}</h4><button type="button" disabled={education && entries.length === 1} className="text-xs font-bold text-red-700 disabled:opacity-40" onClick={() => onChange(entries.filter(item => item.id !== entry.id))}>Remove {entryLabel} {index + 1}</button></div>
      <Field required label={`${education ? "Qualification / degree" : "Role / position"} — ${entryLabel} ${index + 1}`} value={entry.title} onChange={title => update(entry.id, { title })} />
      <Field required label={`${education ? "School / university" : "Employer / institution"} — ${entryLabel} ${index + 1}`} value={entry.organisation} onChange={organisation => update(entry.id, { organisation })} />
      <Field label={`Location — ${entryLabel} ${index + 1}`} value={entry.location} onChange={location => update(entry.id, { location })} />
      <Field required type="month" label={`Start month — ${entryLabel} ${index + 1}`} value={entry.start} onChange={start => update(entry.id, { start })} />
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={entry.current} onChange={event => update(entry.id, { current: event.target.checked, ...(education ? { end: "" } : {}) })} />{education ? "Currently studying" : "Current position"} — {entryLabel} {index + 1}</label>
      {education || !entry.current ? <Field required={!entry.current} type="month" label={`${entry.current ? "Expected completion month" : "End month"} — ${entryLabel} ${index + 1}`} value={entry.end} onChange={end => update(entry.id, { end })} /> : null}
      {education ? <>
        <Field label={`Grade / classification — Education ${index + 1}`} value={(entry as CvEducation).grade} onChange={grade => update(entry.id, { grade })} help="State the result and grading scale as awarded; do not convert it to an assumed equivalent." />
        {academic ? <><Field label={`Thesis / dissertation title — Education ${index + 1}`} value={(entry as CvEducation).thesis} onChange={thesis => update(entry.id, { thesis })} /><Field label={`Supervisor — Education ${index + 1}`} value={(entry as CvEducation).supervisor} onChange={supervisor => update(entry.id, { supervisor })} /></> : null}
      </> : null}
      <Field area required={!education} label={`${education ? "Relevant coursework / distinctions" : "Responsibilities, contributions and achievements"} — ${entryLabel} ${index + 1}`} value={entry.details} onChange={details => update(entry.id, { details })} help={education ? "Include relevant modules, honours or practical work." : "Use one achievement per line. Include genuine outcomes, methods, course levels or team responsibilities relevant to this role."} />
    </div>)}
    <div className="sm:col-span-2"><button type="button" className={button} onClick={() => { const id = crypto.randomUUID(); onChange([...entries, education ? emptyEducation(id) : emptyHistory(id)]); }}>Add {education ? "education" : title.toLowerCase()}</button></div>
  </Section>;
}

export function CvScratchBuilder({ country, value, onChange, onBuild }: { country: string; value: CvBuilderData; onChange: (value: CvBuilderData) => void; onBuild: (draft: ReturnType<typeof buildCvDraft>) => void }) {
  const [issues, setIssues] = useState<string[]>([]);
  const errorRef = useRef<HTMLDivElement>(null);
  const academic = value.kind === "academic";
  const profile = cvCountryProfile(country, value.kind);
  const set = <K extends keyof CvBuilderData>(key: K, next: CvBuilderData[K]) => { setIssues([]); onChange({ ...value, [key]: next }); };
  const text = (key: keyof Pick<CvBuilderData, "projects" | "certifications" | "awards" | "volunteering" | "memberships" | "publications" | "workingPapers" | "presentations" | "grants" | "service" | "patents" | "training">, label: string, help?: string) => <Field key={key} area label={label} value={value[key]} onChange={next => set(key, next)} help={help} />;
  return <form noValidate className="space-y-6" onSubmit={event => {
    event.preventDefault();
    const nextIssues = cvBuilderIssues(value);
    setIssues(nextIssues);
    if (nextIssues.length) { requestAnimationFrame(() => errorRef.current?.focus()); return; }
    onBuild(buildCvDraft(value, country));
  }}>
    <label className="block max-w-md text-sm font-bold">CV type<select aria-label="CV type" className={input} value={value.kind} onChange={event => set("kind", event.target.value as CvKind)}><option value="job">Job CV / Résumé</option><option value="academic">Academic CV</option></select></label>
    <div className="rounded-md bg-[#e8f6fb] p-4 text-sm leading-6 text-[#0f5e68]">
      <p className="font-black">{profile.label}</p><p className="mt-1">{profile.guidance}</p>
      <p className="mt-2">Fields marked * are needed to build this draft. Leave optional sections blank when they do not apply. The employer or university&apos;s application instructions take priority.</p>
      {profile.sources.length ? <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">{profile.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="underline">{source.title}</a>)}</p> : null}
    </div>
    <Section title="Contact and application details">
      <Field required label="Full name" value={value.name} onChange={next => set("name", next)} />
      <Field required type="email" label="Email address" value={value.email} onChange={next => set("email", next)} />
      <Field required type="tel" label="Phone number" value={value.phone} onChange={next => set("phone", next)} help="Include the international dialling code when applying abroad." />
      <Field required label={profile.locationLabel} value={value.location} onChange={next => set("location", next)} />
      <Field required label={academic ? "Target programme / academic role" : "Target job title"} value={value.target} onChange={next => set("target", next)} />
      <Field type="url" label="LinkedIn profile URL" value={value.linkedin} onChange={next => set("linkedin", next)} />
      <Field type="url" label={academic ? "Academic / personal website URL" : "Portfolio / website URL"} value={value.website} onChange={next => set("website", next)} />
      {academic ? <><Field type="url" label="ORCID profile URL" value={value.orcid} onChange={next => set("orcid", next)} /><Field type="url" label="Google Scholar / research profile URL" value={value.scholar} onChange={next => set("scholar", next)} /></> : null}
    </Section>
    <Section title={academic ? "Academic profile and research skills" : "Professional profile and skills"}>
      <Field required area label={academic ? "Research interests / academic profile" : "Professional summary"} value={academic ? value.researchInterests : value.summary} onChange={next => set(academic ? "researchInterests" : "summary", next)} help={academic ? "Describe your research themes, academic focus and relevant methods." : "Write a short summary tailored to the role, using your actual experience and strengths."} />
      <Field required area label={academic ? "Research, technical and laboratory skills" : "Key skills and tools"} value={value.skills} onChange={next => set("skills", next)} help="List relevant skills, methods, software or equipment. Use a new line for each item." />
      <Field area label="Languages and proficiency" value={value.languages} onChange={next => set("languages", next)} help={profile.languageHint} />
    </Section>
    <HistoryEntries title="Education" education academic={academic} entries={value.education} onChange={entries => set("education", entries as CvEducation[])} />
    <HistoryEntries title="Work experience" academic={academic} entries={value.employment} onChange={entries => set("employment", entries)} />
    {academic ? <>
      <HistoryEntries title="Research experience" academic entries={value.research} onChange={entries => set("research", entries)} />
      <HistoryEntries title="Teaching experience" academic entries={value.teaching} onChange={entries => set("teaching", entries)} />
      <Section title="Research outputs and academic contributions" description="Add the sections relevant to your career stage. Publications, funding and teaching experience are not compulsory for applicants who do not yet have them.">
        {text("publications", "Publications", "Give author(s), title, journal / publisher, year and DOI or URL. Distinguish published and accepted work.")}
        {text("workingPapers", "Working papers / work in progress", "Label each item accurately as submitted, under review, preprint or in preparation.")}
        {text("presentations", "Conference presentations and posters", "Include title, authors, event, location, date and whether it was a talk, invited talk or poster.")}
        {text("grants", "Grants, scholarships and funding", "Include award, funder, year, your role and the actual amount / currency where relevant.")}
        {text("service", "Academic service and leadership", "Include committees, reviewing, editorial roles, outreach and event organisation, with dates.")}
        {text("patents", "Patents and intellectual property", "Include title, inventors, identifier and status / date.")}
      </Section>
    </> : null}
    <Section title="Additional qualifications and achievements" description="These sections are optional. Include material that supports the application.">
      {text("projects", "Relevant projects", "Include project title, dates, your role, methods and outcomes; add a portfolio link where relevant.")}
      {text("certifications", "Certifications and professional licences", "Include issuer, award date and expiry date where applicable.")}
      {text("awards", "Awards and honours", "Include awarding organisation and year.")}
      {text("training", "Professional development and training")}
      {text("volunteering", "Volunteering and community engagement")}
      {text("memberships", "Professional memberships", "Include organisation, membership status and relevant dates.")}
      {profile.showWorkAuthorization ? <Field area label="Work authorisation (if requested)" value={value.workAuthorization} onChange={next => set("workAuthorization", next)} help="Enter your actual status only if the employer asks for it. Do not include passport or identity-document numbers." /> : null}
      {!academic ? <Field label="Availability / notice period" value={value.availability} onChange={next => set("availability", next)} /> : null}
      <Field area label="Additional application information" value={value.additional} onChange={next => set("additional", next)} help="Include any further relevant details specifically requested by this employer or institution." />
    </Section>
    <Section title={academic ? "Academic referees" : "References"} description={profile.referenceHint}>
      <label className="block text-sm font-semibold">Reference preference<select aria-label="Reference preference" className={input} value={value.referenceMode} onChange={event => set("referenceMode", event.target.value as CvBuilderData["referenceMode"])}><option value="omit">Omit references</option><option value="on_request">References available on request</option><option value="include">Include referee details (when requested)</option></select></label>
      {value.referenceMode === "include" ? <>
        {value.referees.map((referee, index) => <div key={referee.id} className="grid gap-4 rounded-md bg-[#f6fbfd] p-4 sm:col-span-2 sm:grid-cols-2">
          <div className="flex justify-between sm:col-span-2"><h4 className="text-sm font-bold">Referee {index + 1}</h4><button type="button" className="text-xs font-bold text-red-700" onClick={() => set("referees", value.referees.filter(entry => entry.id !== referee.id))}>Remove referee {index + 1}</button></div>
          {([['name', 'Name'], ['position', 'Role / title'], ['organisation', 'Organisation / institution'], ['email', 'Email address'], ['phone', 'Phone number']] as const).map(([key, label]) => <Field key={key} required={key !== "phone"} type={key === "email" ? "email" : key === "phone" ? "tel" : "text"} label={`${label} — Referee ${index + 1}`} value={referee[key]} onChange={next => set("referees", value.referees.map(entry => entry.id === referee.id ? { ...entry, [key]: next } : entry))} />)}
        </div>)}
        <div className="sm:col-span-2"><button type="button" className={button} onClick={() => set("referees", [...value.referees, emptyReferee(crypto.randomUUID())])}>Add referee</button></div>
      </> : null}
    </Section>
    {issues.length ? <div role="alert" ref={errorRef} tabIndex={-1} className="rounded-md bg-red-50 p-4 text-sm text-red-800"><p className="font-bold">Complete or correct these fields before building your CV:</p><ul className="mt-2 list-disc space-y-1 pl-5">{issues.map(issue => <li key={issue}>{issue}</li>)}</ul></div> : null}
    <button type="submit" className="rounded-md bg-[#07141a] px-6 py-3 text-sm font-black text-white hover:bg-[#07324a]">{academic ? "Build Academic CV" : "Build Job CV"}</button>
  </form>;
}
