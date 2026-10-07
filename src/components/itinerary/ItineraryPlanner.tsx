"use client";

import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ItineraryPdfDownload } from "@/components/itinerary/ItineraryPdfDownload";
import { worldCountries } from "@/data/countries";
import { itineraryCities, itineraryInterests, type ItineraryPlace } from "@/data/itineraryDestinations";
import { addDateDays, buildItinerary, clockTime, dayScheduleIssues, displayPlanDate, itineraryText, movePlanEvent, timeMinutes, tripDayCount, unscheduledPlaces, validateTrip, type ItineraryPlan, type PlanDay, type PlanEvent, type TripDetails, type TripStop } from "@/lib/itinerary";

const input = "mt-1.5 w-full min-w-0 rounded-md border border-[#d7dfe5] bg-[#fbf8f2] px-3 py-2.5 text-sm font-normal text-[#1b1f27] outline-none focus:border-[#0098ba] focus:ring-2 focus:ring-[#0098ba]/20";
const button = "rounded-md border border-[#d7dfe5] bg-white px-4 py-2.5 text-sm font-bold text-[#07141a] transition hover:border-[#0098ba] focus-visible:outline-2 focus-visible:outline-[#0098ba] disabled:cursor-not-allowed disabled:opacity-40";
const primary = "rounded-md bg-[#f0a42f] px-5 py-3 text-sm font-black text-[#07141a] focus-visible:outline-2 focus-visible:outline-[#0098ba] disabled:opacity-40";

function initialStop(destination: string, id: string, days = "3"): TripStop {
  const city = itineraryCities.find((entry) => entry.country === destination);
  return { id, cityId: city?.id ?? `custom-${id}`, cityName: city?.name ?? "", days, transferHours: "3", hotel: "" };
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block min-w-0 text-xs font-bold text-[#07141a]">{label}{children}</label>;
}
function Section({ number, title, description, children }: { number: number; title: string; description: string; children: ReactNode }) {
  return <section className="min-w-0 rounded-lg border border-[#d7dfe5] bg-white p-4 sm:p-6">
    <div className="mb-5 flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#07141a] text-sm font-bold text-white">{number}</span><div><h2 className="text-lg font-black text-[#07141a]">{title}</h2><p className="mt-1 text-sm leading-6 text-[#5b6870]">{description}</p></div></div>
    {children}
  </section>;
}
function hours(minutes: number) {
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`;
}
function mapUrl(place: ItineraryPlace, cityName: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${cityName}, ${place.country}`)}`;
}

export function ItineraryPlanner() {
  const nextId = useRef(1);
  const [details, setDetails] = useState<TripDetails>({ destination: "Qatar", start: "", arrival: "10:00", departure: "18:00", pace: "balanced", interests: ["Culture & history", "Food & markets"], notes: "", stops: [initialStop("Qatar", "stop-0")] });
  const [customPlaces, setCustomPlaces] = useState<ItineraryPlace[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [cityFilter, setCityFilter] = useState("all");
  const [custom, setCustom] = useState({ cityId: "", name: "", area: "", minutes: "90" });
  const [plan, setPlan] = useState<ItineraryPlan | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [personal, setPersonal] = useState({ dayId: "", title: "", start: "18:00", end: "19:00" });
  const [pendingDay, setPendingDay] = useState<Record<string, string>>({});
  const resultRef = useRef<HTMLDivElement>(null);

  const routeCities = useMemo(() => details.stops.filter((stop, index, all) => all.findIndex((entry) => entry.cityId === stop.cityId) === index), [details.stops]);
  const available = useMemo(() => [...itineraryCities.flatMap((city) => city.places), ...customPlaces].filter((place) => place.country === details.destination && details.stops.some((stop) => stop.cityId === place.cityId)), [details.destination, details.stops, customPlaces]);
  const matching = available.filter((place) => (cityFilter === "all" || place.cityId === cityFilter) && (!details.interests.length || place.interests.some((interest) => details.interests.includes(interest))));
  const totalDays = tripDayCount(details.stops);
  const tripErrors = validateTrip(details);
  const endDate = !tripErrors.length ? addDateDays(details.start, totalDays - 1) : "";
  const dirty = !!plan && (JSON.stringify(details) !== JSON.stringify(plan.details) || [...selectedIds].sort().join("|") !== plan.places.map((place) => place.id).sort().join("|"));
  const pending = plan ? unscheduledPlaces(plan) : [];
  const conflictCount = plan?.days.reduce((sum, day) => sum + dayScheduleIssues(day, plan.places).length, 0) ?? 0;

  function changeDestination(destination: string) {
    setDetails((current) => ({ ...current, destination, stops: [initialStop(destination, `stop-${nextId.current++}`)] }));
    setSelectedIds([]);
    setCustomPlaces([]);
    setCityFilter("all");
    setCustom({ cityId: "", name: "", area: "", minutes: "90" });
    setPlan(null);
    setPendingDay({});
    setPersonal({ dayId: "", title: "", start: "18:00", end: "19:00" });
    setError("");
    setNotice(`Destination changed to ${destination}. Choose cities and places for this trip.`);
  }
  function changeStops(stops: TripStop[]) {
    setDetails((current) => ({ ...current, stops }));
    setSelectedIds((current) => current.filter((id) => available.some((place) => place.id === id && stops.some((stop) => stop.cityId === place.cityId))));
    if (!stops.some((stop) => stop.cityId === cityFilter)) setCityFilter("all");
  }
  function updateStop(id: string, patch: Partial<TripStop>) {
    changeStops(details.stops.map((stop) => stop.id === id ? { ...stop, ...patch } : stop));
  }
  function addCustomPlace() {
    const cityId = custom.cityId || routeCities[0]?.cityId;
    const city = routeCities.find((stop) => stop.cityId === cityId);
    const minutes = Number(custom.minutes);
    if (!city?.cityName.trim() || !custom.name.trim() || !Number.isInteger(minutes) || minutes < 30 || minutes > 480) { setError("Choose a named city, add a place name, and allow 30–480 minutes for the visit."); return; }
    const place: ItineraryPlace = { id: `custom-place-${nextId.current++}`, country: details.destination, cityId, name: custom.name.trim(), area: custom.area.trim() || city.cityName, minutes, interests: [...details.interests], custom: true };
    setCustomPlaces((current) => [...current, place]);
    setSelectedIds((current) => [...current, place.id]);
    setCustom((current) => ({ ...current, name: "", area: "" }));
    setError("");
    setNotice(`${place.name} added to ${city.cityName} and selected. Confirm the location before travel.`);
  }
  function build() {
    try {
      const next = buildItinerary(details, available, selectedIds);
      setPlan(next);
      setPendingDay({});
      setError("");
      setNotice(`Built ${next.days.length} days. ${unscheduledPlaces(next).length ? "Some selected places need another day or a manual time slot." : "All selected places are scheduled."}`);
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Check the trip details and try again."); }
  }
  function editDay(id: string, patch: Partial<PlanDay>) {
    setPlan((current) => current ? { ...current, days: current.days.map((day) => day.id === id ? { ...day, ...patch } : day) } : current);
  }
  function editEvent(dayId: string, eventId: string, patch: Partial<PlanEvent>) {
    setPlan((current) => current ? { ...current, days: current.days.map((day) => day.id === dayId ? { ...day, events: day.events.map((item) => item.id === eventId ? { ...item, ...patch } : item) } : day) } : current);
  }
  function removeEvent(dayId: string, eventId: string) {
    setPlan((current) => current ? { ...current, days: current.days.map((day) => day.id === dayId ? { ...day, events: day.events.filter((item) => item.id !== eventId && item.id !== `${eventId}-buffer`) } : day) } : current);
  }
  function moveEvent(eventId: string, dayId: string) {
    if (!plan) return;
    try { setPlan(movePlanEvent(plan, eventId, dayId)); setError(""); setNotice("Visit moved with its travel buffer. Check the times for overlaps."); } catch (cause) { setError((cause as Error).message); }
  }
  function schedulePending(place: ItineraryPlace) {
    if (!plan) return;
    const day = plan.days.find((entry) => entry.id === pendingDay[place.id]) ?? plan.days.find((entry) => entry.cityId === place.cityId);
    if (!day || day.cityId !== place.cityId) return;
    const start = 9 * 60;
    editDay(day.id, { events: [...day.events, { id: `manual-${nextId.current++}`, title: place.name, start: clockTime(start), end: clockTime(start + place.minutes), type: "place", placeId: place.id, notes: `${place.area}. Set a suitable visit time and allow travel time.` }] });
    setNotice(`${place.name} added to ${day.cityName}. Adjust its time and check any overlaps.`);
  }
  function addPersonal() {
    if (!plan) return;
    const day = plan.days.find((entry) => entry.id === personal.dayId) ?? plan.days[0];
    if (!personal.title.trim() || !Number.isFinite(timeMinutes(personal.start)) || !Number.isFinite(timeMinutes(personal.end)) || timeMinutes(personal.start) >= timeMinutes(personal.end)) { setError("Give the activity a name and an end time after its start time."); return; }
    editDay(day.id, { events: [...day.events, { id: `personal-${nextId.current++}`, title: personal.title.trim(), start: personal.start, end: personal.end, type: "personal", notes: "" }] });
    setPersonal((current) => ({ ...current, title: "" }));
    setError("");
    setNotice("Personal activity added. Check the day's times for overlaps.");
  }
  function download() {
    if (!plan) return;
    const url = URL.createObjectURL(new Blob([itineraryText(plan)], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `CartandGo-${plan.details.destination.replace(/[^a-z0-9]+/gi, "-")}-itinerary.txt`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="min-w-0 space-y-6" data-testid="itinerary-planner">
    <div className="rounded-lg bg-[#f6fbfd] p-4 text-sm leading-6 text-[#5b6870]">Choose your destination, arrange your city stops, then select real places to visit. Build a schedule and adjust it to your flights, bookings and personal plans. Your draft stays here while you switch tools; leaving the page or wiping session data clears it.</div>
    <Section number={1} title="Set up your trip" description="City days add up to the full trip. Dates include arrival and departure days; all times are local to each city.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Destination"><select aria-label="Itinerary destination" className={input} value={details.destination} onChange={(e) => changeDestination(e.target.value)}>{worldCountries.map((country) => <option key={country}>{country}</option>)}</select></Field>
        <Field label="Start date"><input aria-label="Itinerary start date" type="date" min="1900-01-01" max="2100-12-31" className={input} value={details.start} onChange={(e) => setDetails({ ...details, start: e.target.value })} /></Field>
        <Field label="Travel pace"><select className={input} value={details.pace} onChange={(e) => setDetails({ ...details, pace: e.target.value as TripDetails["pace"] })}><option value="relaxed">Relaxed · up to 2 visits/day</option><option value="balanced">Balanced · up to 3 visits/day</option><option value="full">Full · up to 4 visits/day</option></select></Field>
        <Field label="Arrival time · first day"><input type="time" className={input} value={details.arrival} onChange={(e) => setDetails({ ...details, arrival: e.target.value })} /></Field>
        <Field label="Departure time · last day"><input type="time" className={input} value={details.departure} onChange={(e) => setDetails({ ...details, departure: e.target.value })} /></Field>
        <div className="rounded-md bg-[#fbf8f2] p-3 text-sm"><p className="font-bold text-[#07141a]">{Number.isFinite(totalDays) ? totalDays : "—"} days total</p><p className="mt-1 text-[#5b6870]">{endDate ? `Ends ${displayPlanDate(endDate)}` : "Choose a date and allocate your days."}</p></div>
      </div>
      <div className="mt-6 space-y-4">
        {details.stops.map((stop, index) => <div key={stop.id} className="rounded-md border border-[#d7dfe5] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-black text-[#0098ba]">Stop {index + 1}</h3><div className="flex gap-2">{index > 0 ? <button className={button} type="button" aria-label={`Move stop ${index + 1} earlier`} onClick={() => { const stops = [...details.stops]; [stops[index - 1], stops[index]] = [stops[index], stops[index - 1]]; changeStops(stops); }}>Move earlier</button> : null}{details.stops.length > 1 ? <button type="button" className={button} aria-label={`Remove stop ${index + 1}`} onClick={() => changeStops(details.stops.filter((entry) => entry.id !== stop.id))}>Remove</button> : null}</div></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={`City · stop ${index + 1}`}><select className={input} value={stop.cityId.startsWith("custom-") ? "custom" : stop.cityId} onChange={(e) => { const city = itineraryCities.find((entry) => entry.id === e.target.value && entry.country === details.destination); updateStop(stop.id, { cityId: city?.id ?? `custom-${stop.id}`, cityName: city?.name ?? "" }); }}>{itineraryCities.filter((city) => city.country === details.destination).map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}<option value="custom">Add another city…</option></select></Field>
            {stop.cityId.startsWith("custom-") ? <Field label={`City name · stop ${index + 1}`}><input className={input} maxLength={80} placeholder="Enter a city in this destination" value={stop.cityName} onChange={(e) => updateStop(stop.id, { cityName: e.target.value })} /></Field> : null}
            <Field label={`Days · stop ${index + 1}`}><input type="number" min={1} max={30} step={1} className={input} value={stop.days} onChange={(e) => updateStop(stop.id, { days: e.target.value })} /></Field>
            {index > 0 ? <Field label={`Transfer allowance (hours) · stop ${index + 1}`}><input type="number" min={0.5} max={12} step={0.5} className={input} value={stop.transferHours} onChange={(e) => updateStop(stop.id, { transferHours: e.target.value })} /></Field> : null}
            <Field label={`Accommodation / base · stop ${index + 1}`}><input className={input} maxLength={160} placeholder="Hotel or neighbourhood (optional)" value={stop.hotel} onChange={(e) => updateStop(stop.id, { hotel: e.target.value })} /></Field>
          </div>
          {stop.cityId.startsWith("custom-") ? <p className="mt-3 text-xs leading-5 text-[#5b6870]">This city has no attraction list yet. Add your own places in step 2 and confirm that they belong to {details.destination}.</p> : null}
        </div>)}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" className={button} disabled={details.stops.length >= 8} onClick={() => { const id = `stop-${nextId.current++}`; const city = itineraryCities.find((entry) => entry.country === details.destination && !details.stops.some((stop) => stop.cityId === entry.id)); changeStops([...details.stops, { ...initialStop(details.destination, id, "1"), cityId: city?.id ?? `custom-${id}`, cityName: city?.name ?? "" }]); }}>+ Add city stop</button><p className="text-xs text-[#5b6870]">Up to 8 stops and 30 days. Include transfer time between cities.</p></div>
      <Field label="Trip notes / special requirements"><textarea className={input} rows={2} maxLength={2000} placeholder="Accessibility needs, dietary preferences, appointment dates…" value={details.notes} onChange={(e) => setDetails({ ...details, notes: e.target.value })} /></Field>
    </Section>

    <Section number={2} title="Choose your places" description="Attractions belong to the cities in your route. Interests filter the suggestions; your checked places stay selected until you remove them.">
      <fieldset><legend className="mb-2 text-xs font-bold text-[#07141a]">Your interests · leave all unchecked to see every place</legend><div className="flex flex-wrap gap-2">{itineraryInterests.map((interest) => <label key={interest} className="flex cursor-pointer items-center gap-2 rounded-full border border-[#d7dfe5] bg-[#fbf8f2] px-3 py-2 text-sm text-[#07141a]"><input type="checkbox" checked={details.interests.includes(interest)} onChange={(e) => setDetails({ ...details, interests: e.target.checked ? [...details.interests, interest] : details.interests.filter((entry) => entry !== interest) })} />{interest}</label>)}</div></fieldset>
      <div className="my-5 flex flex-wrap items-end gap-3"><div className="w-full sm:w-56"><Field label="Show places in"><select className={input} value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}><option value="all">All route cities</option>{routeCities.map((stop) => <option key={stop.cityId} value={stop.cityId}>{stop.cityName || "Unnamed city"}</option>)}</select></Field></div><button type="button" className={button} disabled={!matching.length} onClick={() => setSelectedIds((current) => [...new Set([...current, ...matching.map((place) => place.id)])])}>Select matching places</button><button type="button" className={button} disabled={!selectedIds.length} onClick={() => setSelectedIds([])}>Clear selection</button><span className="py-2 text-sm font-bold text-[#0098ba]" aria-live="polite">{selectedIds.length} selected</span></div>
      {!matching.length ? <p className="rounded-md bg-[#fbf8f2] p-4 text-sm leading-6 text-[#5b6870]">No suggestions match these cities and interests. Clear the interest filters to see more places, or add a place below.</p> : <div className="grid gap-3 md:grid-cols-2">{matching.map((place) => {
        const city = routeCities.find((stop) => stop.cityId === place.cityId);
        return <div key={place.id} className={`rounded-md border p-4 ${selectedIds.includes(place.id) ? "border-[#0098ba] bg-[#f6fbfd]" : "border-[#d7dfe5]"}`}>
          <label className="flex cursor-pointer items-start gap-3"><input className="mt-1 shrink-0" type="checkbox" checked={selectedIds.includes(place.id)} onChange={(e) => setSelectedIds((current) => e.target.checked ? [...current, place.id] : current.filter((id) => id !== place.id))} /><div className="min-w-0"><span className="text-sm font-bold text-[#07141a]">{place.name}</span><p className="mt-1 text-xs leading-5 text-[#5b6870]">{city?.cityName} · {place.area} · about {hours(place.minutes)}</p><p className="mt-1 text-xs text-[#5b6870]">{place.custom ? "Added by you · location to confirm" : place.interests.join(" · ")}</p>{place.visiting ? <p className="mt-2 text-xs leading-5 text-[#0098ba]">{place.visiting.summary} Schedule checked {displayPlanDate(place.visiting.checked)}.</p> : null}</div></label>
          <div className="mt-3 flex flex-wrap gap-4 pl-6 text-xs font-bold text-[#0098ba]"><a href={mapUrl(place, city?.cityName ?? "")} target="_blank" rel="noopener noreferrer">Find on map ↗</a>{place.source ? <a href={place.source} target="_blank" rel="noopener noreferrer">Visitor information ↗</a> : null}{place.custom ? <button type="button" onClick={() => { setCustomPlaces((current) => current.filter((entry) => entry.id !== place.id)); setSelectedIds((current) => current.filter((id) => id !== place.id)); }}>Delete place</button> : null}</div>
        </div>;
      })}</div>}
      <details className="mt-5 rounded-md border border-[#d7dfe5] p-4" open={!available.length}><summary className="cursor-pointer text-sm font-bold text-[#07141a]">+ Add a place of your own</summary><p className="mt-3 text-xs leading-5 text-[#5b6870]">Use a real attraction, restaurant or meeting location in a route city. Custom places are attached to that city and selected automatically.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Place city"><select className={input} value={routeCities.some((stop) => stop.cityId === custom.cityId) ? custom.cityId : routeCities[0]?.cityId ?? ""} onChange={(e) => setCustom({ ...custom, cityId: e.target.value })}>{routeCities.map((stop) => <option key={stop.cityId} value={stop.cityId}>{stop.cityName || "Name this city first"}</option>)}</select></Field><Field label="Place name"><input className={input} maxLength={120} value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} /></Field><Field label="Neighbourhood / area"><input className={input} maxLength={100} value={custom.area} onChange={(e) => setCustom({ ...custom, area: e.target.value })} /></Field><Field label="Visit duration (minutes)"><input type="number" min={30} max={480} step={15} className={input} value={custom.minutes} onChange={(e) => setCustom({ ...custom, minutes: e.target.value })} /></Field></div><button type="button" className={`${button} mt-4`} onClick={addCustomPlace}>Add place</button></details>
      <p className="mt-4 text-xs leading-5 text-[#5b6870]">Visit lengths and travel buffers are estimates. Known museum closures are respected where listed. Check opening days, weather, tickets and any visitor requirements using the source links. Suggestions do not confirm a booking or entry permission.</p>
    </Section>

    <div className="rounded-lg border border-[#d7dfe5] bg-white p-4 sm:p-6"><div className="flex flex-wrap items-center gap-3"><button type="button" className={primary} onClick={build}>{plan ? "Rebuild itinerary" : "Build my itinerary"}</button><p className="text-sm text-[#5b6870]">{plan ? "Rebuilding replaces your schedule edits with the current selections." : "We group areas, allow breaks and fit your selected visits around travel."}</p></div>{error ? <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm leading-6 text-red-800">{error}</p> : null}{notice ? <p role="status" className="mt-3 text-sm leading-6 text-[#0098ba]">{notice}</p> : null}</div>

    {plan ? <div ref={resultRef} className="scroll-mt-6 space-y-5">
      <Section number={3} title="Review and work with your itinerary" description="Edit times and notes, move visits between days in the same city, or add personal plans. Keep travel buffers when adjusting your schedule.">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-serif text-2xl text-[#07141a]">{plan.days.length} days in {plan.details.destination}</h3><p className="mt-2 text-sm text-[#5b6870]">{displayPlanDate(plan.days[0].date)} – {displayPlanDate(plan.days.at(-1)!.date)}</p></div><div className="flex flex-wrap gap-2"><ItineraryPdfDownload key={JSON.stringify([plan.details.destination, plan.details.start, plan.details.arrival, plan.details.departure, plan.details.stops])} plan={plan} disabled={dirty || conflictCount > 0} /><button type="button" className={button} onClick={download} disabled={dirty || conflictCount > 0}>Download text copy</button></div></div>
        {plan.details.notes ? <p className="mt-4 whitespace-pre-wrap rounded-md bg-[#fbf8f2] p-3 text-sm text-[#5b6870]">Trip notes: {plan.details.notes}</p> : null}
        {dirty ? <p role="status" className="mt-4 rounded-md bg-amber-50 p-3 text-sm leading-6 text-amber-900">Trip details or selected places have changed. This schedule shows your previous selections. Rebuild to sync it before downloading.</p> : null}
        {conflictCount > 0 ? <p role="status" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">Resolve {conflictCount} schedule {conflictCount === 1 ? "issue" : "issues"} below before downloading.</p> : null}
        {pending.length ? <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4"><h4 className="text-sm font-bold text-amber-900">Not yet scheduled · {pending.length} places</h4><p className="mt-1 text-xs leading-5 text-amber-900">These visits could not fit, fall on a known closed day, or were removed. Add more city days and rebuild, or add one to a matching day and set its time.</p><div className="mt-3 space-y-3">{pending.map((place) => <div key={place.id} className="flex flex-wrap items-center gap-2"><span className="min-w-0 flex-1 text-sm text-[#07141a]">{place.name} · {hours(place.minutes)}</span><select aria-label={`Day for ${place.name}`} className="max-w-full rounded-md border border-[#d7dfe5] bg-white p-2 text-sm" value={pendingDay[place.id] ?? plan.days.find((day) => day.cityId === place.cityId)?.id} onChange={(e) => setPendingDay({ ...pendingDay, [place.id]: e.target.value })}>{plan.days.filter((day) => day.cityId === place.cityId).map((day) => <option key={day.id} value={day.id}>Day {plan.days.indexOf(day) + 1} · {day.cityName}</option>)}</select><button type="button" className={button} onClick={() => schedulePending(place)}>Add to day</button></div>)}</div></div> : null}
      </Section>

      {plan.days.map((day, index) => {
        const conflicts = dayScheduleIssues(day, plan.places);
        return <section key={day.id} className="min-w-0 overflow-hidden rounded-lg border border-[#d7dfe5] bg-white" aria-label={`Itinerary day ${index + 1}`}>
          <div className="bg-[#f6fbfd] p-4 sm:p-5"><p className="text-xs font-black uppercase text-[#0098ba]">Day {index + 1} · {displayPlanDate(day.date)}</p><h3 className="mt-1 font-serif text-2xl text-[#07141a]">{day.cityName}</h3>{day.hotel ? <p className="mt-1 text-sm text-[#5b6870]">Base: {day.hotel}</p> : null}</div>
          <div className="space-y-4 p-4 sm:p-5">
            {conflicts.length ? <ul className="list-disc rounded-md bg-red-50 py-3 pl-7 pr-3 text-sm leading-6 text-red-800" aria-label={`Schedule issues for day ${index + 1}`}>{conflicts.map((issue, issueIndex) => <li key={issueIndex}>{issue}</li>)}</ul> : null}
            {[...day.events].sort((a, b) => timeMinutes(a.start) - timeMinutes(b.start)).map((item) => {
              const place = plan.places.find((entry) => entry.id === item.placeId);
              return <div key={item.id} className={`rounded-md border p-3 sm:p-4 ${item.type === "place" ? "border-[#0098ba]/40" : "border-[#d7dfe5] bg-[#fbf8f2]"}`} data-event-title={item.title}>
                <div className="flex flex-wrap items-center justify-between gap-2"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-[#5b6870]">{item.type === "place" ? "Visit" : item.type === "travel" ? "Travel allowance" : item.type === "personal" ? "Personal plan" : "Break"}</p><h4 className="mt-1 break-words text-sm font-bold text-[#07141a]">{item.title}</h4></div><button type="button" className="rounded-md px-2 py-2 text-xs font-bold text-[#5b6870] hover:bg-[#d7dfe5]/30" aria-label={`Remove ${item.title} on day ${index + 1}`} onClick={() => removeEvent(day.id, item.id)}>Remove</button></div>
                <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3"><Field label={`Start · ${item.title}`}><input aria-label={`Start ${item.title} day ${index + 1}`} type="time" className={input} value={item.start} onChange={(e) => editEvent(day.id, item.id, { start: e.target.value })} /></Field><Field label={`End · ${item.title}`}><input aria-label={`End ${item.title} day ${index + 1}`} type="time" className={input} value={item.end} onChange={(e) => editEvent(day.id, item.id, { end: e.target.value })} /></Field>{item.type === "place" || item.type === "personal" ? <div className="col-span-2 lg:col-span-1"><Field label={`Move · ${item.title}`}><select aria-label={`Move ${item.title} day ${index + 1}`} className={input} value={day.id} onChange={(e) => moveEvent(item.id, e.target.value)}>{plan.days.filter((candidate) => !place || candidate.cityId === place.cityId).map((candidate) => <option key={candidate.id} value={candidate.id}>Day {plan.days.indexOf(candidate) + 1} · {candidate.cityName}</option>)}</select></Field></div> : null}</div>
                <details className="mt-3"><summary className="cursor-pointer text-xs font-bold text-[#5b6870]">Notes {place ? "& visitor links" : "& details"}</summary><Field label={`Notes · ${item.title}`}><textarea aria-label={`Notes ${item.title} day ${index + 1}`} className={input} maxLength={1000} rows={2} value={item.notes} onChange={(e) => editEvent(day.id, item.id, { notes: e.target.value })} /></Field>{place ? <div className="mt-2 flex flex-wrap gap-4 text-xs font-bold text-[#0098ba]"><a href={mapUrl(place, day.cityName)} target="_blank" rel="noopener noreferrer">Find on map ↗</a>{place.source ? <a href={place.source} target="_blank" rel="noopener noreferrer">Visitor information ↗</a> : null}</div> : null}</details>
              </div>;
            })}
            {!day.events.some((item) => item.type === "place" || item.type === "personal") ? <p className="text-sm leading-6 text-[#5b6870]">No visits scheduled. Keep this day flexible or add a selected place or personal activity.</p> : <p className="text-xs leading-5 text-[#5b6870]">Unallocated time is yours for meals, rest and exploring. Confirm travel times on the map.</p>}
            <Field label={`Day ${index + 1} notes`}><textarea className={input} rows={2} maxLength={1000} placeholder="Reservation details, contacts, reminders…" value={day.notes} onChange={(e) => editDay(day.id, { notes: e.target.value })} /></Field>
          </div>
        </section>;
      })}

      <section className="rounded-lg border border-[#d7dfe5] bg-white p-4 sm:p-6"><h3 className="text-base font-black text-[#07141a]">Add a personal activity</h3><p className="mt-1 text-sm leading-6 text-[#5b6870]">Add dinner, an appointment or a booking with a fixed time.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Activity day"><select className={input} value={plan.days.some((day) => day.id === personal.dayId) ? personal.dayId : plan.days[0].id} onChange={(e) => setPersonal({ ...personal, dayId: e.target.value })}>{plan.days.map((day, index) => <option key={day.id} value={day.id}>Day {index + 1} · {day.cityName}</option>)}</select></Field><Field label="Activity name"><input className={input} maxLength={120} value={personal.title} onChange={(e) => setPersonal({ ...personal, title: e.target.value })} /></Field><Field label="Activity start"><input type="time" className={input} value={personal.start} onChange={(e) => setPersonal({ ...personal, start: e.target.value })} /></Field><Field label="Activity end"><input type="time" className={input} value={personal.end} onChange={(e) => setPersonal({ ...personal, end: e.target.value })} /></Field></div><button type="button" className={`${button} mt-4`} onClick={addPersonal}>Add activity</button></section>
    </div> : null}
  </div>;
}
