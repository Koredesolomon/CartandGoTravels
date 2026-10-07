export const itineraryInterests = ["Culture & history", "Food & markets", "Nature & outdoors", "Art & museums", "Shopping", "Relaxation"] as const;
export type ItineraryInterest = (typeof itineraryInterests)[number];

export type ItineraryPlace = {
  id: string;
  country: string;
  cityId: string;
  name: string;
  area: string;
  interests: ItineraryInterest[];
  minutes: number;
  source?: string;
  custom?: boolean;
  visiting?: {
    closedWeekdays: number[];
    closedDates: string[];
    open: string;
    close: string;
    dayHours?: Record<number, { open: string; close: string }>;
    summary: string;
    checked: string;
  };
};
export type ItineraryCity = { id: string; country: string; name: string; source: string; places: ItineraryPlace[] };

// Visit lengths are planning estimates, not opening hours or ticket availability.
// Sources identify real attractions; neighbourhoods help keep each day's route together.
type PlaceSeed = [name: string, area: string, minutes: number, interests: ItineraryInterest[]];
function city(country: string, id: string, name: string, source: string, seeds: PlaceSeed[]): ItineraryCity {
  return { country, id, name, source, places: seeds.map(([placeName, area, minutes, interests], index) => ({
    id: `${id}-${index + 1}`, country, cityId: id, name: placeName, area, minutes, interests, source,
  })) };
}

export const itineraryCities: ItineraryCity[] = [
  city("Qatar", "doha", "Doha", "https://www.qatartourism.com/content/dam/visitqatar/img/itineraries/Culture-Enthusiasts.pdf", [
    ["Souq Waqif", "Old Doha", 120, ["Culture & history", "Food & markets", "Shopping"]],
    ["Msheireb Museums", "Old Doha", 120, ["Culture & history", "Art & museums"]],
    ["Museum of Islamic Art", "Waterfront", 150, ["Art & museums", "Culture & history"]],
    ["Doha Corniche", "Waterfront", 90, ["Nature & outdoors", "Relaxation"]],
    ["National Museum of Qatar", "Museum district", 150, ["Culture & history", "Art & museums"]],
    ["Katara Cultural Village", "Katara", 120, ["Culture & history", "Art & museums", "Relaxation"]],
  ]),
  city("United Arab Emirates", "dubai", "Dubai", "https://www.visitdubai.com/en/explore-dubai/dubai-neighbourhoods/bur-dubai", [
    ["Al Fahidi Historical Neighbourhood", "Bur Dubai", 120, ["Culture & history", "Art & museums"]],
    ["Dubai Creek", "Bur Dubai", 90, ["Nature & outdoors", "Culture & history"]],
    ["Textile Souk", "Bur Dubai", 90, ["Shopping", "Food & markets"]],
    ["Burj Khalifa", "Downtown Dubai", 120, ["Culture & history"]],
    ["Dubai Mall", "Downtown Dubai", 150, ["Shopping", "Food & markets"]],
  ]),
  city("Canada", "toronto", "Toronto", "https://www.destinationtoronto.com/things-to-do/attractions/must-see-attractions/", [
    ["CN Tower", "Downtown", 120, ["Culture & history"]],
    ["Ripley's Aquarium of Canada", "Downtown", 120, ["Nature & outdoors"]],
    ["St. Lawrence Market", "Old Town", 90, ["Food & markets", "Shopping"]],
    ["Royal Ontario Museum", "Yorkville", 180, ["Art & museums", "Culture & history"]],
    ["Art Gallery of Ontario", "Grange Park", 150, ["Art & museums"]],
    ["Toronto Islands", "Islands", 240, ["Nature & outdoors", "Relaxation"]],
  ]),
  city("Canada", "vancouver", "Vancouver", "https://travel.destinationcanada.com/en-us/things-to-do/top-10-attractions-vancouver", [
    ["Stanley Park", "Stanley Park", 180, ["Nature & outdoors", "Relaxation"]],
    ["Stanley Park Seawall", "Stanley Park", 120, ["Nature & outdoors"]],
    ["Granville Island Public Market", "Granville Island", 120, ["Food & markets", "Shopping"]],
    ["Flyover Vancouver", "Waterfront", 60, ["Relaxation"]],
  ]),
  city("United Kingdom", "london", "London", "https://www.visitlondon.com/things-to-do/sightseeing/london-attraction/top-ten-attractions", [
    ["Tower of London", "Tower Hill", 180, ["Culture & history"]],
    ["Tower Bridge", "Tower Hill", 90, ["Culture & history"]],
    ["British Museum", "Bloomsbury", 180, ["Art & museums", "Culture & history"]],
    ["National Gallery", "Trafalgar Square", 150, ["Art & museums"]],
    ["London Eye", "South Bank", 90, ["Relaxation"]],
    ["Royal Observatory Greenwich", "Greenwich", 120, ["Culture & history", "Art & museums"]],
    ["Greenwich Park", "Greenwich", 120, ["Nature & outdoors", "Relaxation"]],
  ]),
  city("France", "paris", "Paris", "https://parisjetaime.com/eng/article/Paris-10-must-sees-a992", [
    ["Eiffel Tower", "Champ de Mars", 150, ["Culture & history"]],
    ["Louvre Museum", "Louvre", 240, ["Art & museums", "Culture & history"]],
    ["Musée d'Orsay", "Saint-Germain", 180, ["Art & museums"]],
    ["Luxembourg Gardens", "Saint-Germain", 90, ["Nature & outdoors", "Relaxation"]],
    ["Sacré-Cœur", "Montmartre", 90, ["Culture & history"]],
    ["Arc de Triomphe", "Champs-Élysées", 90, ["Culture & history"]],
  ]),
  city("South Africa", "cape-town", "Cape Town", "https://www.capetown.travel/explore/", [
    ["Table Mountain", "Table Mountain", 240, ["Nature & outdoors"]],
    ["Kirstenbosch National Botanical Garden", "Southern suburbs", 180, ["Nature & outdoors", "Relaxation"]],
    ["Groot Constantia", "Southern suburbs", 120, ["Culture & history", "Food & markets"]],
    ["Cape Point", "Cape Peninsula", 300, ["Nature & outdoors"]],
    ["Boulders Penguin Colony", "Cape Peninsula", 120, ["Nature & outdoors"]],
  ]),
  city("Kenya", "nairobi", "Nairobi", "https://magicalkenya.com/download/4051/?tmstv=1755866007", [
    ["Nairobi National Park", "Southern Nairobi", 300, ["Nature & outdoors"]],
    ["Giraffe Centre", "Lang'ata", 90, ["Nature & outdoors"]],
    ["Nairobi National Museum", "Museum Hill", 150, ["Culture & history", "Art & museums"]],
  ]),
  city("Rwanda", "kigali", "Kigali", "https://visitrwanda.com/interests/museums-and-art-galleries/", [
    ["Kigali Genocide Memorial", "Gisozi", 150, ["Culture & history"]],
    ["Rwanda Art Museum", "Kanombe", 120, ["Art & museums"]],
    ["Kandt House Museum", "Nyarugenge", 90, ["Culture & history", "Art & museums"]],
  ]),
  city("Turkey", "istanbul", "Istanbul", "https://goturkiye.com/istanbul/destinations", [
    ["Hagia Sophia", "Sultanahmet", 90, ["Culture & history"]],
    ["Topkapı Palace", "Sultanahmet", 180, ["Culture & history", "Art & museums"]],
    ["Basilica Cistern", "Sultanahmet", 60, ["Culture & history"]],
    ["Grand Bazaar", "Beyazıt", 120, ["Food & markets", "Shopping"]],
    ["Galata Tower", "Galata", 90, ["Culture & history"]],
    ["Istanbul Modern", "Karaköy", 120, ["Art & museums"]],
  ]),
  city("Thailand", "bangkok", "Bangkok", "https://www.tourismthailand.org/Destinations/Provinces/Bangkok/219", [
    ["Grand Palace and Wat Phra Kaew", "Phra Nakhon", 180, ["Culture & history"]],
    ["Wat Pho", "Phra Nakhon", 90, ["Culture & history"]],
    ["Wat Arun", "Thonburi", 90, ["Culture & history"]],
    ["Chatuchak Market", "Chatuchak", 150, ["Food & markets", "Shopping"]],
    ["Yaowarat", "Chinatown", 120, ["Food & markets", "Culture & history"]],
  ]),
  city("Tanzania", "zanzibar", "Zanzibar", "https://www.zanzibartourism.go.tz/things-to-do", [
    ["Stone Town", "Stone Town", 180, ["Culture & history"]],
    ["Forodhani Garden", "Stone Town", 90, ["Food & markets", "Relaxation"]],
    ["Jozani Forest Reserve", "Jozani", 180, ["Nature & outdoors"]],
  ]),
];

// Some city guides cover only part of a city's collection.
const extraSources: Record<string, string> = {
  "doha-3": "https://mia.org.qa/en/visit/",
  "doha-4": "https://visitqatar.com/intl-en/things-to-do/iconic-places",
  "doha-5": "https://visitqatar.com/intl-en/things-to-do/iconic-places",
  "dubai-4": "https://www.visitdubai.com/explore-dubai/dubai-neighbourhoods/downtown-dubai",
  "dubai-5": "https://www.visitdubai.com/explore-dubai/dubai-neighbourhoods/downtown-dubai",
  "london-6": "https://www.visitlondon.com/things-to-do/london-areas/greenwich",
  "london-7": "https://www.visitlondon.com/things-to-do/london-areas/greenwich",
  "zanzibar-1": "https://site.tanzaniatourism.go.tz/page/zanzibar-island-fam-trip-international-hosted-buyers-only-",
  "paris-2": "https://www.louvre.fr/en/visit/hours-admission/tickets-and-prices",
  "paris-3": "https://www.musee-orsay.fr/en/visit",
};
// Conservative visit windows finish before galleries are cleared. Verify seasonal
// changes with the venue; this is a sourced snapshot, not live ticket inventory.
const visitingRules: Record<string, NonNullable<ItineraryPlace["visiting"]>> = {
  "doha-3": { closedWeekdays: [3], closedDates: [], open: "09:00", close: "19:00", dayHours: { 4: { open: "09:00", close: "21:00" }, 5: { open: "13:30", close: "19:00" } }, summary: "Closed Wednesdays; opens 13:30 on Fridays.", checked: "2026-10-07" },
  "paris-2": { closedWeekdays: [2], closedDates: ["01-01", "05-01", "12-25"], open: "09:00", close: "17:30", dayHours: { 3: { open: "09:00", close: "20:30" }, 5: { open: "09:00", close: "20:30" } }, summary: "Closed Tuesdays, 1 Jan, 1 May and 25 Dec.", checked: "2026-10-07" },
  "paris-3": { closedWeekdays: [1], closedDates: ["05-01", "12-25"], open: "09:30", close: "17:30", dayHours: { 4: { open: "09:30", close: "21:15" } }, summary: "Closed Mondays, 1 May and 25 Dec.", checked: "2026-10-07" },
};
for (const destination of itineraryCities) {
  for (const place of destination.places) {
    if (extraSources[place.id]) place.source = extraSources[place.id];
    if (visitingRules[place.id]) place.visiting = visitingRules[place.id];
  }
}
