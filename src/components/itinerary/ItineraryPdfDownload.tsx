"use client";

import { cloneElement, useEffect, useId, useRef, useState } from "react";
import type { FormEvent, ReactElement, ReactNode } from "react";
import type { ItineraryPlan } from "@/lib/itinerary";
import { displayPlanDate } from "@/lib/itinerary";
import { homeCountryTies, reservationStatuses, visaCategories, type ItineraryAccommodation, type ItineraryTraveler } from "@/lib/itineraryExport";
import { itineraryDocumentRequirements, MAX_SUPPORT_FILE_BYTES, MAX_SUPPORT_TOTAL_BYTES, SUPPORT_FILE_ACCEPT } from "@/lib/itineraryDocumentRequirements";

const input = "mt-1.5 w-full min-w-0 rounded-md border border-[#d7dfe5] bg-[#fbf8f2] px-3 py-2.5 text-sm font-normal text-[#1b1f27] outline-none focus:border-[#0098ba] focus:ring-2 focus:ring-[#0098ba]/20";
function Field({ label, children }: { label: string; children: ReactElement<{ id?: string; "aria-label"?: string }> }) {
  const id = useId();
  return <div className="min-w-0"><label htmlFor={id} className="block text-xs font-bold text-[#07141a]">{label}</label>{cloneElement(children, { id, "aria-label": label })}</div>;
}
function Group({ title, children }: { title: string; children: ReactNode }) { return <div className="rounded-md border border-[#d7dfe5] p-4"><h3 className="mb-4 text-sm font-black text-[#1e6fb5]">{title}</h3><div className="grid gap-4 sm:grid-cols-2">{children}</div></div>; }

export function ItineraryPdfDownload({ plan, disabled }: { plan: ItineraryPlan; disabled: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const request = useRef<AbortController | null>(null);
  const titleId = useId();
  const requirements = itineraryDocumentRequirements(plan);
  const [traveler, setTraveler] = useState<ItineraryTraveler>({ fullName: "", passportNumber: "", visaCategory: "", primaryTie: "", tieEvidence: "", financialEvidence: "", inbound: { date: plan.days[0].date, reference: "", status: "" }, outbound: { date: plan.days.at(-1)!.date, reference: "", status: "" } });
  const [stays, setStays] = useState<Record<string, ItineraryAccommodation>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);
  useEffect(() => () => request.current?.abort(), []);
  const readyFiles = requirements.filter(entry => files[entry.key]).length;
  const allReady = !disabled && traveler.fullName.trim() && traveler.passportNumber.trim() && traveler.visaCategory && traveler.primaryTie && traveler.tieEvidence.trim() && traveler.financialEvidence.trim() && traveler.inbound.reference.trim() && traveler.inbound.status && traveler.outbound.reference.trim() && traveler.outbound.status && plan.details.stops.every(stop => { const stay = getStay(stop.id); return stay.name.trim() && stay.reference.trim() && stay.status; }) && readyFiles === requirements.length;

  function getStay(id: string): ItineraryAccommodation { return stays[id] ?? { stopId: id, name: plan.details.stops.find(stop => stop.id === id)?.hotel ?? "", reference: "", status: "" }; }
  function updateStay(id: string, field: "name" | "reference" | "status", value: string) { setStays(current => ({ ...current, [id]: { ...getStay(id), [field]: value } })); setCompleted(false); }
  function update(field: "fullName" | "passportNumber" | "visaCategory" | "primaryTie" | "tieEvidence" | "financialEvidence", value: string) { setTraveler(current => ({ ...current, [field]: value })); setCompleted(false); }
  function updateFlight(segment: "inbound" | "outbound", field: "reference" | "status", value: string) { setTraveler(current => ({ ...current, [segment]: { ...current[segment], [field]: value } })); setCompleted(false); }
  function close() { request.current?.abort(); request.current = null; setPending(false); dialog.current?.close(); }
  function chooseFile(key: string, file: File | undefined, target: HTMLInputElement) {
    setCompleted(false);
    setError("");
    if (!file) { setFiles(current => { const next = { ...current }; delete next[key]; return next; }); return; }
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name) || !file.size || file.size > MAX_SUPPORT_FILE_BYTES) {
      target.value = "";
      setFiles(current => { const next = { ...current }; delete next[key]; return next; });
      setError("Use a non-empty PDF, JPG or PNG file no larger than 5 MB.");
      return;
    }
    const total = Object.entries(files).filter(([entry]) => entry !== key).reduce((sum, [, entry]) => sum + entry.size, file.size);
    if (total > MAX_SUPPORT_TOTAL_BYTES) { target.value = ""; setFiles(current => { const next = { ...current }; delete next[key]; return next; }); setError("Keep all supporting documents below 30 MB in total."); return; }
    setFiles(current => ({ ...current, [key]: file }));
  }
  async function download(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (request.current || !allReady) return;
    const controller = new AbortController();
    request.current = controller; setPending(true); setError(""); setCompleted(false);
    const form = new FormData();
    form.set("itinerary", JSON.stringify({ traveler: { ...traveler, inbound: { ...traveler.inbound, date: plan.days[0].date }, outbound: { ...traveler.outbound, date: plan.days.at(-1)!.date } }, accommodations: plan.details.stops.map(stop => getStay(stop.id)), plan }));
    for (const entry of requirements) form.set(entry.key, files[entry.key]);
    try {
      const response = await fetch("/api/itinerary-pdf", { method: "POST", body: form, signal: controller.signal });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || "Unable to download the PDF. Please try again."); }
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob), anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Flight-Accommodation-Itinerary-${plan.details.destination.replace(/[^a-z0-9]+/gi, "-")}-${plan.details.start}.pdf`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setCompleted(true);
    } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to prepare the PDF."); }
    finally { if (request.current === controller) { request.current = null; setPending(false); } }
  }

  return <>
    <button type="button" disabled={disabled} onClick={() => { setError(""); dialog.current?.showModal(); }} className="rounded-md bg-[#f0a42f] px-4 py-2.5 text-sm font-black text-[#07141a] focus-visible:outline-2 focus-visible:outline-[#0098ba] disabled:cursor-not-allowed disabled:opacity-40">Download PDF for official use</button>
    <dialog ref={dialog} aria-labelledby={titleId} onCancel={close} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-lg border border-[#d7dfe5] bg-white p-4 text-[#07141a] shadow-xl backdrop:bg-[#07141a]/60 sm:p-7">
      <form onSubmit={download}>
        <h2 id={titleId} className="text-xl font-black">Flight & Accommodation Itinerary</h2>
        <p className="mt-2 text-sm leading-6 text-[#5b6870]">{plan.details.destination} · {displayPlanDate(plan.days[0].date)} – {displayPlanDate(plan.days.at(-1)!.date)}</p>
        <p className="mt-3 text-sm leading-6 text-[#5b6870]">Complete the required details and upload supporting documents to download the visa-support itinerary. Your generated daily schedule is carried into the document.</p>
        <fieldset disabled={pending} className="mt-5 space-y-4">
          <Group title="1. Personal & passport information">
            <Field label="Full name (as in passport)"><input autoComplete="name" required maxLength={120} className={input} value={traveler.fullName} onChange={event => update("fullName", event.target.value)} /></Field>
            <Field label="Passport number"><input autoComplete="off" required maxLength={40} className={input} value={traveler.passportNumber} onChange={event => update("passportNumber", event.target.value)} /></Field>
            <Field label="Visa category applied for"><select required className={input} value={traveler.visaCategory} onChange={event => update("visaCategory", event.target.value)}><option value="">Choose visa category</option>{visaCategories.map(category => <option key={category}>{category}</option>)}</select></Field>
            <Field label="Main destination country"><input className={input} value={plan.details.destination} readOnly /></Field>
          </Group>
          <Group title="2. Flight reservations (proof of return)">
            {(["inbound", "outbound"] as const).map(segment => <div key={segment} className="min-w-0 space-y-3"><p className="text-xs font-black">{segment === "inbound" ? "Inbound (entry)" : "Outbound (exit)"}</p><Field label={`${segment === "inbound" ? "Inbound" : "Outbound"} flight date`}><input type="date" className={input} readOnly value={segment === "inbound" ? plan.days[0].date : plan.days.at(-1)!.date} /></Field><Field label={`${segment === "inbound" ? "Inbound" : "Outbound"} flight / PNR reference`}><input required maxLength={300} className={input} placeholder="Flight number and reservation reference" value={traveler[segment].reference} onChange={event => updateFlight(segment, "reference", event.target.value)} /></Field><Field label={`${segment === "inbound" ? "Inbound" : "Outbound"} booking status`}><select required className={input} value={traveler[segment].status} onChange={event => updateFlight(segment, "status", event.target.value)}><option value="">Select actual status</option>{reservationStatuses.map(status => <option key={status}>{status}</option>)}</select></Field></div>)}
            <p className="text-xs leading-5 text-[#5b6870] sm:col-span-2">Flight dates match your itinerary. Change trip dates and rebuild first if your reservations use different dates.</p>
          </Group>
          <Group title="3. Accommodation details">
            {plan.details.stops.map((stop, index) => { const stay = getStay(stop.id); return <div key={stop.id} className="min-w-0 space-y-3 rounded-md bg-[#fbf8f2] p-3 sm:col-span-2"><p className="text-sm font-bold">Stop {index + 1} · {stop.cityName}</p><Field label={`Accommodation name and address · stop ${index + 1}`}><input required maxLength={300} className={input} value={stay.name} onChange={event => updateStay(stop.id, "name", event.target.value)} /></Field><Field label={`Accommodation booking reference · stop ${index + 1}`}><input required maxLength={200} className={input} value={stay.reference} onChange={event => updateStay(stop.id, "reference", event.target.value)} /></Field><Field label={`Accommodation booking status · stop ${index + 1}`}><select required className={input} value={stay.status} onChange={event => updateStay(stop.id, "status", event.target.value)}><option value="">Select actual status</option>{reservationStatuses.map(status => <option key={status}>{status}</option>)}</select></Field></div>; })}
          </Group>
          <Group title="4. Home-country ties & financial evidence">
            <div className="sm:col-span-2"><Field label="Primary home-country tie"><select required className={input} value={traveler.primaryTie} onChange={event => update("primaryTie", event.target.value)}><option value="">Choose home-country tie</option>{homeCountryTies.map(tie => <option key={tie}>{tie}</option>)}</select></Field></div>
            <div className="sm:col-span-2"><Field label="Home-country tie evidence description"><textarea required rows={2} maxLength={1000} className={input} placeholder="Describe your employment letter, business records, family responsibilities, property documents or study evidence." value={traveler.tieEvidence} onChange={event => update("tieEvidence", event.target.value)} /></Field></div>
            <div className="sm:col-span-2"><Field label="Financial means evidence description"><textarea required rows={2} maxLength={1000} className={input} placeholder="Describe your bank statements, sponsor evidence or other source-of-funds documents." value={traveler.financialEvidence} onChange={event => update("financialEvidence", event.target.value)} /></Field></div>
          </Group>
          <Group title="5. Required supporting documents">
            <p className="text-xs leading-5 text-[#5b6870] sm:col-span-2">PDF, JPG or PNG · up to 5 MB per file and 30 MB total. Every upload below is required. Documents are attached to the downloaded PDF; use a PDF reader that supports file attachments to open them.</p>
            {requirements.map(entry => <div key={entry.key} className="min-w-0 rounded-md border border-[#d7dfe5] p-3"><Field label={entry.label}><input type="file" required accept={SUPPORT_FILE_ACCEPT} className={`${input} text-xs file:mr-2 file:rounded file:border-0 file:bg-[#e8f6fb] file:px-2 file:py-2 file:text-xs`} onChange={event => chooseFile(entry.key, event.target.files?.[0], event.target)} /></Field>{files[entry.key] ? <p className="mt-2 break-all text-xs text-[#0098ba]">{files[entry.key].name} · {Math.ceil(files[entry.key].size / 1024)} KB</p> : null}</div>)}
          </Group>
        </fieldset>
        <p className="mt-4 text-xs leading-5 text-[#5b6870]">The PDF uses the reservation statuses you provide. Files are processed for this download, and are not saved or emailed by the tool. Page exit or session wipe clears your details and selected uploads.</p>
        {error ? <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm leading-6 text-red-800">{error}</p> : null}
        {completed ? <p role="status" className="mt-4 rounded-md bg-[#e8f6fb] p-3 text-sm text-[#07141a]">Your itinerary PDF has downloaded with the supporting documents attached.</p> : null}
        <div className="sticky bottom-0 mt-5 border-t border-[#d7dfe5] bg-white pb-1 pt-4"><p className="mb-3 text-xs text-[#5b6870]" aria-live="polite">{readyFiles} of {requirements.length} required documents provided. {allReady ? "Ready to download." : "Complete all details and uploads to enable download."}</p><div className="flex flex-wrap gap-3"><button type="submit" disabled={pending || !allReady} className="rounded-md bg-[#f0a42f] px-5 py-3 text-sm font-black text-[#07141a] disabled:opacity-40">{pending ? "Preparing PDF…" : "Download flight & accommodation PDF"}</button><button type="button" onClick={close} className="rounded-md border border-[#d7dfe5] px-5 py-3 text-sm font-bold">Close</button></div></div>
      </form>
    </dialog>
  </>;
}
