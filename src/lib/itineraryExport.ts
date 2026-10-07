import { itineraryCities, itineraryInterests, type ItineraryPlace } from "@/data/itineraryDestinations";
import { worldCountries } from "@/data/countries";
import { addDateDays, dayScheduleIssues, tripDayCount, validateTrip, type ItineraryPlan, type PlanEvent, type TripDetails } from "@/lib/itinerary";

export const visaCategories = ["Tourist / Leisure", "Business", "Study", "Work", "Family Visit"] as const;
export const homeCountryTies = ["Permanent Employment", "Business Ownership", "Family Dependents", "Property Ownership", "Enrolled Studies"] as const;
export const reservationStatuses = ["Reserved", "Confirmed"] as const;
export type ReservationStatus = (typeof reservationStatuses)[number];
export type ItineraryTraveler = {
  fullName: string;
  passportNumber: string;
  visaCategory: string;
  primaryTie: string;
  tieEvidence: string;
  financialEvidence: string;
  inbound: { date: string; reference: string; status: string };
  outbound: { date: string; reference: string; status: string };
};
export type ItineraryAccommodation = { stopId: string; name: string; reference: string; status: string };
export type ItineraryExport = { traveler: ItineraryTraveler; plan: ItineraryPlan; accommodations: ItineraryAccommodation[] };

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid itinerary document.");
  return value as Record<string, unknown>;
}
function text(value: unknown, label: string, max: number, required = false): string {
  if (value === undefined && !required) return "";
  if (typeof value !== "string" || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value) || (required && !value.trim())) throw new Error(`Check ${label}.`);
  return value.trim();
}
function list(value: unknown, label: string, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new Error(`Check ${label}.`);
  return value;
}
export function validateItineraryTraveler(value: unknown): ItineraryTraveler {
  const traveler = object(value);
  const choice = (value: unknown, label: string, choices: readonly string[]) => {
    const result = text(value, label, 80, true);
    if (!choices.includes(result)) throw new Error(`Choose ${label}.`);
    return result;
  };
  const flight = (value: unknown, label: string) => {
    const booking = object(value);
    return { date: text(booking.date, `${label} date`, 10, true), reference: text(booking.reference, `${label} flight / PNR reference`, 300, true), status: choice(booking.status, `${label} reservation status`, reservationStatuses) };
  };
  return {
    fullName: text(traveler.fullName, "the traveler's full name", 120, true),
    passportNumber: text(traveler.passportNumber, "the passport number", 40, true),
    visaCategory: choice(traveler.visaCategory, "the visa category", visaCategories),
    primaryTie: choice(traveler.primaryTie, "the primary home-country tie", homeCountryTies),
    tieEvidence: text(traveler.tieEvidence, "the home-country tie evidence", 1000, true),
    financialEvidence: text(traveler.financialEvidence, "the financial means evidence", 1000, true),
    inbound: flight(traveler.inbound, "the inbound"),
    outbound: flight(traveler.outbound, "the outbound"),
  };
}

// Validate the edited schedule rather than rebuilding it, so the PDF preserves
// user changes. Catalogue information is resolved here instead of trusting links
// or opening-hour rules supplied by the browser.
export function validateItineraryExport(value: unknown): ItineraryExport {
  const body = object(value);
  const traveler = validateItineraryTraveler(body.traveler);
  const raw = object(body.plan);
  const detail = object(raw.details);
  const destination = text(detail.destination, "the destination", 100, true);
  if (!(worldCountries as readonly string[]).includes(destination)) throw new Error("Choose a valid destination.");
  const pace = text(detail.pace, "the travel pace", 10, true);
  if (!["relaxed", "balanced", "full"].includes(pace)) throw new Error("Choose a valid travel pace.");
  const details: TripDetails = {
    destination,
    start: text(detail.start, "the start date", 10, true),
    arrival: text(detail.arrival, "the arrival time", 5, true),
    departure: text(detail.departure, "the departure time", 5, true),
    pace: pace as TripDetails["pace"],
    interests: list(detail.interests, "the interests", itineraryInterests.length).map((value) => {
      const interest = text(value, "an interest", 40, true);
      if (!(itineraryInterests as readonly string[]).includes(interest)) throw new Error("Choose valid interests.");
      return interest as TripDetails["interests"][number];
    }),
    notes: text(detail.notes, "the trip notes", 2000),
    stops: list(detail.stops, "the city stops", 8).map((value) => {
      const stop = object(value);
      return { id: text(stop.id, "a city stop", 100, true), cityId: text(stop.cityId, "a city", 100, true), cityName: text(stop.cityName, "a city name", 80, true), days: text(stop.days, "the city days", 2, true), transferHours: text(stop.transferHours, "the transfer hours", 5, true), hotel: text(stop.hotel, "the accommodation", 160) };
    }),
  };
  const tripErrors = validateTrip(details);
  if (tripErrors.length) throw new Error(tripErrors.join(" "));
  for (const stop of details.stops) {
    const city = itineraryCities.find((entry) => entry.id === stop.cityId);
    if (city && (city.country !== destination || city.name !== stop.cityName)) throw new Error("City stops must match the selected destination.");
    if (!city && !stop.cityId.startsWith("custom-")) throw new Error("Check the city stops.");
  }
  const places = list(raw.places, "the selected places", 200).map((value): ItineraryPlace => {
    const place = object(value);
    const id = text(place.id, "a place identifier", 120, true);
    const known = itineraryCities.flatMap((city) => city.places).find((entry) => entry.id === id);
    if (known) {
      if (known.country !== destination || !details.stops.some((stop) => stop.cityId === known.cityId)) throw new Error("Attractions must belong to a city in this trip.");
      return { ...known };
    }
    const cityId = text(place.cityId, "a place city", 100, true);
    if (place.custom !== true || !id.startsWith("custom-place-") || place.country !== destination || !details.stops.some((stop) => stop.cityId === cityId)) throw new Error("Check the custom places and their destination.");
    if (!Number.isInteger(place.minutes) || Number(place.minutes) < 30 || Number(place.minutes) > 480) throw new Error("Check the visit duration.");
    return { id, cityId, country: destination, name: text(place.name, "a place name", 120, true), area: text(place.area, "a place area", 100, true), minutes: Number(place.minutes), interests: [], custom: true };
  });
  if (new Set(places.map((place) => place.id)).size !== places.length) throw new Error("Selected places must not repeat.");
  const days = list(raw.days, "the daily schedule", 30);
  if (days.length !== tripDayCount(details.stops)) throw new Error("The daily schedule must match the trip length. Rebuild the itinerary.");
  const cityDays = details.stops.flatMap((stop) => Array.from({ length: Number(stop.days) }, () => stop));
  const eventIds = new Set<string>();
  const scheduled = new Set<string>();
  const plan: ItineraryPlan = { details, places, days: days.map((value, index) => {
    const day = object(value);
    const stop = cityDays[index];
    const date = text(day.date, "a day date", 10, true);
    if (date !== addDateDays(details.start, index) || day.cityId !== stop.cityId || day.cityName !== stop.cityName || day.hotel !== stop.hotel) throw new Error("Dates, cities and accommodation must match the trip details. Rebuild the itinerary.");
    const events = list(day.events, "the daily activities", 70).map((value): PlanEvent => {
      const entry = object(value);
      const id = text(entry.id, "an activity identifier", 240, true);
      if (eventIds.has(id)) throw new Error("Activities must not repeat.");
      eventIds.add(id);
      const type = text(entry.type, "an activity type", 10, true);
      if (!["place", "travel", "break", "personal"].includes(type)) throw new Error("Check the activity type.");
      const placeId = text(entry.placeId, "an attraction", 120);
      const place = places.find((place) => place.id === placeId);
      if (type === "place" && (!place || place.cityId !== stop.cityId || scheduled.has(placeId))) throw new Error("Each attraction must be scheduled once in its own city.");
      if (type !== "place" && placeId) throw new Error("Check the activity's place selection.");
      if (placeId) scheduled.add(placeId);
      return { id, type: type as PlanEvent["type"], title: place?.name ?? text(entry.title, "an activity name", 240, true), start: text(entry.start, "an activity start", 5, true), end: text(entry.end, "an activity end", 5, true), notes: text(entry.notes, "the activity notes", 1000), ...(placeId ? { placeId } : {}) };
    });
    return { id: text(day.id, "a day identifier", 120, true), date, cityId: stop.cityId, cityName: stop.cityName, hotel: stop.hotel, notes: text(day.notes, "the daily notes", 1000), events };
  }) };
  const issues = plan.days.flatMap((day) => dayScheduleIssues(day, places));
  if (issues.length) throw new Error(`Resolve the schedule issues before downloading: ${issues[0]}`);
  if (traveler.inbound.date !== plan.days[0].date || traveler.outbound.date !== plan.days.at(-1)!.date) throw new Error("Flight dates must match the itinerary's arrival and departure dates.");
  const accommodations = list(body.accommodations, "the accommodation details", 8).map((value) => {
    const stay = object(value);
    const status = text(stay.status, "the accommodation status", 40, true);
    if (!(reservationStatuses as readonly string[]).includes(status)) throw new Error("Choose an accommodation reservation status.");
    return { stopId: text(stay.stopId, "an accommodation city stop", 100, true), name: text(stay.name, "the accommodation name and address", 300, true), reference: text(stay.reference, "the accommodation booking reference", 200, true), status };
  });
  if (accommodations.length !== details.stops.length || new Set(accommodations.map((stay) => stay.stopId)).size !== accommodations.length || accommodations.some((stay) => !details.stops.some((stop) => stop.id === stay.stopId))) throw new Error("Provide accommodation details for every city stop.");
  return { traveler, plan, accommodations: details.stops.map((stop) => accommodations.find((stay) => stay.stopId === stop.id)!) };
}
