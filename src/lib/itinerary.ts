import type { ItineraryInterest, ItineraryPlace } from "@/data/itineraryDestinations";

export type TripStop = { id: string; cityId: string; cityName: string; days: string; transferHours: string; hotel: string };
export type TripDetails = { destination: string; start: string; arrival: string; departure: string; pace: "relaxed" | "balanced" | "full"; interests: ItineraryInterest[]; notes: string; stops: TripStop[] };
export type PlanEvent = { id: string; title: string; start: string; end: string; type: "place" | "travel" | "break" | "personal"; notes: string; placeId?: string };
export type PlanDay = { id: string; date: string; cityId: string; cityName: string; hotel: string; notes: string; events: PlanEvent[] };
export type ItineraryPlan = { details: TripDetails; days: PlanDay[]; places: ItineraryPlace[] };

export function timeMinutes(value: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return NaN;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}
export function clockTime(minutes: number): string {
  const safe = Math.max(0, Math.min(1439, Math.round(minutes)));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}
export function addDateDays(date: string, offset: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}
export function displayPlanDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
export function tripDayCount(stops: TripStop[]): number {
  return stops.reduce((total, stop) => total + Number(stop.days), 0);
}
export function validateTrip(details: TripDetails): string[] {
  const errors: string[] = [];
  const date = new Date(`${details.start}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(details.start) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== details.start || Number(details.start.slice(0, 4)) < 1900 || Number(details.start.slice(0, 4)) > 2100) errors.push("Choose a valid start date between 1900 and 2100.");
  if (!details.destination || !details.stops.length || details.stops.length > 8) errors.push("Add between 1 and 8 city stops.");
  if (details.stops.some((stop) => !stop.cityName.trim() || !stop.cityId || !/^\d+$/.test(stop.days) || Number(stop.days) < 1 || Number(stop.days) > 30)) errors.push("Give every city a name and between 1 and 30 whole days.");
  if (new Set(details.stops.map((stop) => stop.id)).size !== details.stops.length) errors.push("Each city stop must have its own identifier.");
  const total = tripDayCount(details.stops);
  if (!Number.isInteger(total) || total < 1 || total > 30) errors.push("Keep the whole trip between 1 and 30 days.");
  if (!["relaxed", "balanced", "full"].includes(details.pace)) errors.push("Choose a valid travel pace.");
  if (!Number.isFinite(timeMinutes(details.arrival)) || !Number.isFinite(timeMinutes(details.departure))) errors.push("Enter valid arrival and departure times.");
  if ((total - 1) * 1440 + timeMinutes(details.departure) - timeMinutes(details.arrival) < 300) errors.push("Allow at least 5 hours between arrival and departure for airport and hotel transfers.");
  if (details.stops.slice(1).some((stop) => !stop.transferHours.trim() || !Number.isFinite(Number(stop.transferHours)) || Number(stop.transferHours) < 0.5 || Number(stop.transferHours) > 12)) errors.push("Allow between 0.5 and 12 hours for each city transfer, including check-out and check-in.");
  return errors;
}

function event(id: string, title: string, start: number, end: number, type: PlanEvent["type"], notes = ""): PlanEvent {
  return { id, title, start: clockTime(start), end: clockTime(end), type, notes };
}

export function visitWindow(place: ItineraryPlace, date: string): { open: number; close: number } | null {
  const rules = place.visiting;
  if (!rules) return { open: 0, close: 1439 };
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (rules.closedWeekdays.includes(weekday) || rules.closedDates.includes(date.slice(5))) return null;
  const hours = rules.dayHours?.[weekday] ?? rules;
  return { open: timeMinutes(hours.open), close: timeMinutes(hours.close) };
}

export function buildItinerary(details: TripDetails, available: ItineraryPlace[], selectedIds: string[]): ItineraryPlan {
  const errors = validateTrip(details);
  if (errors.length) throw new Error(errors.join(" "));
  const allowed = available.filter((place) => place.country === details.destination && details.stops.some((stop) => stop.cityId === place.cityId));
  const places = [...new Set(selectedIds)].map((id) => allowed.find((place) => place.id === id));
  if (!places.length) throw new Error("Select at least one place to build your itinerary.");
  if (places.some((place) => !place || !place.name.trim() || !Number.isInteger(place.minutes) || place.minutes < 30 || place.minutes > 480)) throw new Error("Use valid places from the selected destination and city stops, with visits between 30 minutes and 8 hours.");
  const chosen = places as ItineraryPlace[];
  const remaining = new Set(chosen.map((place) => place.id));
  const total = tripDayCount(details.stops);
  const limit = { relaxed: 2, balanced: 3, full: 4 }[details.pace];
  const days: PlanDay[] = [];
  let offset = 0;
  for (const [stopIndex, stop] of details.stops.entries()) {
    for (let localDay = 0; localDay < Number(stop.days); localDay++, offset++) {
      const id = `${stop.id}-${localDay}`;
      const day: PlanDay = { id, date: addDateDays(details.start, offset), cityId: stop.cityId, cityName: stop.cityName, hotel: stop.hotel, notes: "", events: [] };
      let earliest = 9 * 60;
      let latest = 19 * 60;
      const arrivalRemainder = Math.max(0, timeMinutes(details.arrival) + 120 - 1440);
      if (offset === 1 && arrivalRemainder) day.events.push(event(`${id}-arrival-remainder`, "Complete overnight arrival and check-in", 0, arrivalRemainder, "travel"));
      if (offset === 0) {
        const arrival = timeMinutes(details.arrival);
        earliest = Math.max(earliest, Math.min(arrival + 120, 1439));
        if (arrival < 1439) day.events.push(event(`${id}-arrival`, "Arrival, transfer and hotel check-in", arrival, Math.min(arrival + 120, 1439), "travel", "2-hour planning allowance; confirm your actual transfer and check-in arrangements. Late-night transfers continue on the next day."));
        else day.notes = "Arrival at 23:59. Transfer and check-in continue after midnight.";
      } else if (stopIndex > 0 && localDay === 0) {
        const finish = earliest + Math.round(Number(stop.transferHours) * 60);
        day.events.push(event(`${id}-transfer`, `Travel from ${details.stops[stopIndex - 1].cityName} to ${stop.cityName}`, earliest, finish, "travel", "Your transfer allowance includes transport, check-out and check-in. Confirm transport separately."));
        earliest = finish;
      }
      if (offset === total - 1) {
        const departure = timeMinutes(details.departure);
        const airport = Math.max(0, departure - 180);
        if (earliest > airport && (offset === 0 || (stopIndex > 0 && localDay === 0))) throw new Error(`Travel and departure overlap in ${stop.cityName}. Add another day or adjust your transfer/departure time.`);
        latest = Math.min(latest, airport);
        if (departure > 0) day.events.push(event(`${id}-departure`, "Check-out, airport transfer and departure", airport, departure, "travel", "3-hour planning allowance before departure; adjust to your flight and airport requirements."));
        else day.notes = "Departure at 00:00. Airport transfer begins on the previous night.";
      }
      if (offset === total - 2 && timeMinutes(details.departure) < 180) {
        const start = 1440 + timeMinutes(details.departure) - 180;
        latest = Math.min(latest, start);
        if (earliest > start) throw new Error("Arrival or city transfer overlaps your overnight departure allowance. Add another day or adjust your flight times.");
        day.events.push(event(`${id}-overnight-departure`, "Begin transfer for overnight departure", start, 1439, "travel", "Departure is after midnight on the next day; the airport allowance begins tonight."));
      }
      if (earliest <= 13 * 60 && latest >= 14 * 60) day.events.push(event(`${id}-lunch`, "Lunch and rest", 13 * 60, 14 * 60, "break"));
      let cursor = earliest;
      let lastArea = "";
      const pending = chosen.filter((place) => place.cityId === stop.cityId && remaining.has(place.id));
      const futureCityDays = details.stops.slice(stopIndex + 1).filter((future) => future.cityId === stop.cityId).reduce((sum, future) => sum + Number(future.days), 0);
      const quota = Math.min(limit, Math.ceil(pending.length / (Number(stop.days) - localDay + futureCityDays)));
      pending.sort((a, b) => a.area.localeCompare(b.area) || b.interests.filter((interest) => details.interests.includes(interest)).length - a.interests.filter((interest) => details.interests.includes(interest)).length);
      let visits = 0;
      while (visits < quota && pending.length) {
        let next: { index: number; start: number; buffer: number; end: number } | undefined;
        for (const [index, place] of pending.entries()) {
          const window = visitWindow(place, day.date);
          if (!window) continue;
          const buffer = lastArea && lastArea !== place.area ? 60 : 30;
          let start = Math.max(cursor, window.open - buffer);
          if (day.events.some((item) => item.type === "break") && start < 14 * 60 && start + buffer + place.minutes > 13 * 60) start = 14 * 60;
          const end = start + buffer + place.minutes;
          if (end <= Math.min(latest, window.close)) { next = { index, start, buffer, end }; break; }
        }
        if (!next) break;
        const [place] = pending.splice(next.index, 1);
        day.events.push(event(`${id}-${place.id}-buffer`, "Travel / walking buffer", next.start, next.start + next.buffer, "travel", "Estimated planning buffer, not a live route duration. Check the map before travel."));
        day.events.push({ ...event(`${id}-${place.id}`, place.name, next.start + next.buffer, next.end, "place", `${place.area}. Check opening hours and reserve tickets where needed.`), placeId: place.id });
        cursor = next.end;
        lastArea = place.area;
        remaining.delete(place.id);
        visits++;
      }
      day.events.sort((a, b) => timeMinutes(a.start) - timeMinutes(b.start));
      days.push(day);
    }
  }
  return { details: structuredClone(details), days, places: structuredClone(chosen) };
}

export function dayConflicts(day: PlanDay): string[] {
  const issues: string[] = [];
  const sorted = [...day.events].sort((a, b) => timeMinutes(a.start) - timeMinutes(b.start));
  for (const [index, item] of sorted.entries()) {
    const start = timeMinutes(item.start), end = timeMinutes(item.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) issues.push(`${item.title}: end time must be after start time.`);
    for (const previous of sorted.slice(0, index)) {
      if (start < timeMinutes(previous.end) && end > timeMinutes(previous.start)) issues.push(`${item.title} overlaps ${previous.title}.`);
    }
  }
  return issues;
}

export function dayScheduleIssues(day: PlanDay, places: ItineraryPlace[]): string[] {
  const issues = dayConflicts(day);
  for (const item of day.events) {
    const place = places.find((entry) => entry.id === item.placeId);
    if (!place?.visiting) continue;
    const window = visitWindow(place, day.date);
    if (!window) issues.push(`${place.name} is normally closed on this date. Choose another day.`);
    else if (timeMinutes(item.start) < window.open || timeMinutes(item.end) > window.close) issues.push(`${place.name}: keep the visit within ${clockTime(window.open)}–${clockTime(window.close)}, or confirm a different slot with the venue.`);
  }
  return issues;
}

export function movePlanEvent(plan: ItineraryPlan, eventId: string, targetDayId: string): ItineraryPlan {
  const source = plan.days.find((day) => day.events.some((item) => item.id === eventId));
  const target = plan.days.find((day) => day.id === targetDayId);
  const item = source?.events.find((entry) => entry.id === eventId);
  if (!source || !target || !item) throw new Error("Choose an existing visit and day.");
  const place = plan.places.find((entry) => entry.id === item.placeId);
  if (place && place.cityId !== target.cityId) throw new Error("Move this visit to a day in the same city.");
  if (source.id === target.id) return plan;
  // Buffers belong to their visit and move with it. Times remain editable; conflicts are surfaced.
  const buffer = source.events.find((entry) => entry.id === `${item.id}-buffer`);
  return { ...plan, days: plan.days.map((day) => ({ ...day, events: day.id === source.id ? day.events.filter((entry) => entry.id !== item.id && entry.id !== buffer?.id) : day.id === target.id ? [...day.events, ...(buffer ? [buffer] : []), item] : day.events })) };
}

export function unscheduledPlaces(plan: ItineraryPlan): ItineraryPlace[] {
  const scheduled = new Set(plan.days.flatMap((day) => day.events.map((item) => item.placeId).filter(Boolean)));
  return plan.places.filter((place) => !scheduled.has(place.id));
}

export function itineraryText(plan: ItineraryPlan): string {
  const lines = [`TRAVEL ITINERARY — ${plan.details.destination}`, `${displayPlanDate(plan.days[0].date)} – ${displayPlanDate(plan.days.at(-1)!.date)} · ${plan.days.length} days`, `Pace: ${plan.details.pace}`, `Interests: ${plan.details.interests.join(", ") || "All"}`, "Times are local to each city. Visit lengths and transfer buffers are estimates.", "Confirm opening hours, reservations and actual transport before travel."];
  lines.push(`Arrival: ${plan.days[0].date} ${plan.details.arrival}`, `Departure: ${plan.days.at(-1)!.date} ${plan.details.departure}`);
  if (plan.details.notes) lines.push(`Trip notes: ${plan.details.notes}`);
  for (const [index, day] of plan.days.entries()) {
    lines.push("", `DAY ${index + 1} — ${displayPlanDate(day.date)} — ${day.cityName}`);
    if (day.hotel) lines.push(`Accommodation: ${day.hotel}`);
    if (day.notes) lines.push(`Notes: ${day.notes}`);
    for (const item of [...day.events].sort((a, b) => timeMinutes(a.start) - timeMinutes(b.start))) {
      lines.push(`${item.start}–${item.end}  ${item.title}`, ...(item.notes ? [`  ${item.notes}`] : []));
      const place = plan.places.find((entry) => entry.id === item.placeId);
      if (place?.source) lines.push(`  Visitor information: ${place.source}`);
    }
    lines.push(...dayScheduleIssues(day, plan.places).map((issue) => `SCHEDULE ISSUE / TIME CONFLICT: ${issue}`));
  }
  const pending = unscheduledPlaces(plan);
  if (pending.length) lines.push("", "NOT YET SCHEDULED", ...pending.map((place) => place.name));
  return lines.join("\n");
}
