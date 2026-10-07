"use client";

import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { FormSubmissionDialog } from "@/components/ui/FormSubmissionDialog";
import { useLeadSubmission } from "@/hooks/useLeadSubmission";
import { formatLeadMessage } from "@/lib/whatsapp";
import { bookingFonts } from "./fonts";
import styles from "./TravelBookingForm.module.css";

type BookingTab = "flight" | "hotel";
type TripType = "One Way" | "Round Trip" | "Multi-City";
type Leg = { id: number; departure: string; destination: string; date: string };
type Quote = { tab: BookingTab; form: HTMLFormElement; entries: [string, string | number][] };

const newLeg = (id: number): Leg => ({ id, departure: "", destination: "", date: "" });

function Counter({ label, value, onChange, minimum = 0 }: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  minimum?: number;
}) {
  return (
    <div className={styles.stepper} role="group" aria-label={label}>
      <button type="button" aria-label={`Decrease ${label.toLowerCase()}`} disabled={value <= minimum} onClick={() => onChange(value - 1)}>–</button>
      <span aria-live="polite" aria-atomic="true">{value}</span>
      <button type="button" aria-label={`Increase ${label.toLowerCase()}`} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

export function TravelBookingForm({ initialTab = "flight" }: { initialTab?: BookingTab }) {
  const id = useId();
  const [activeTab, setActiveTab] = useState<BookingTab>(initialTab);
  const [tripType, setTripType] = useState<TripType>("One Way");
  const [cabin, setCabin] = useState("Economy");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [departureDate, setDepartureDate] = useState("");
  const [legs, setLegs] = useState<Leg[]>([newLeg(0), newLeg(1)]);
  const nextLegId = useRef(2);
  const [rooms, setRooms] = useState(1);
  const [hotelAdults, setHotelAdults] = useState(2);
  const [hotelChildren, setHotelChildren] = useState(0);
  const [guestPanelOpen, setGuestPanelOpen] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [isThankYouOpen, setIsThankYouOpen] = useState(false);
  const contactDialog = useRef<HTMLDialogElement>(null);
  const contactForm = useRef<HTMLFormElement>(null);
  const pendingQuote = useRef<Quote | null>(null);
  const { sendLead, isSubmitting, submissionError } = useLeadSubmission();

  const guestSummary = `${rooms} Room${rooms === 1 ? "" : "s"} · ${rooms * hotelAdults} Adult${rooms * hotelAdults === 1 ? "" : "s"} · ${rooms * hotelChildren} Children`;

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const tab = event.key === "Home" ? "flight" : event.key === "End" ? "hotel" : activeTab === "flight" ? "hotel" : "flight";
    setActiveTab(tab);
    document.getElementById(`${id}-tab-${tab}`)?.focus();
  }

  function updateLeg(legId: number, field: keyof Omit<Leg, "id">, value: string) {
    setLegs((current) => current.map((leg) => leg.id === legId ? { ...leg, [field]: value } : leg));
  }

  function requestQuote(event: FormEvent<HTMLFormElement>, tab: BookingTab) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const entries: Quote["entries"] = tab === "flight"
      ? [["Trip Type", tripType], ["Cabin Class", cabin], ["Adults", adults], ["Children", children]]
      : [["Destination", String(data.get("Destination") ?? "")], ["Rooms", rooms], ["Adults per room", hotelAdults], ["Children per room", hotelChildren], ["Guests & Rooms", guestSummary], ["Check-in Date", checkIn], ["Check-out Date", String(data.get("Check-out Date") ?? "")]];

    if (tab === "flight") {
      if (tripType === "Multi-City") {
        legs.forEach((leg, index) => entries.push(
          [`Flight ${index + 1} Departure`, leg.departure],
          [`Flight ${index + 1} Destination`, leg.destination],
          [`Flight ${index + 1} Departure Date`, leg.date],
        ));
      } else {
        entries.push(["Departure", String(data.get("Departure") ?? "")], ["Destination", String(data.get("Destination") ?? "")], ["Departure Date", departureDate]);
        if (tripType === "Round Trip") entries.push(["Return Date", String(data.get("Return Date") ?? "")]);
      }
    }

    pendingQuote.current = { tab, form, entries };
    contactDialog.current?.showModal();
  }

  async function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const quote = pendingQuote.current;
    if (!quote) return;
    const form = event.currentTarget;
    const email = String(new FormData(form).get("Email Address") ?? "");
    const sent = await sendLead({ email, message: formatLeadMessage(quote.tab === "flight" ? "a flight quote" : "a hotel quote", [["Email Address", email], ...quote.entries]) }, form);
    if (!sent) return;

    quote.form.reset();
    if (quote.tab === "flight") {
      setTripType("One Way");
      setCabin("Economy");
      setAdults(1);
      setChildren(0);
      setDepartureDate("");
      setLegs([newLeg(nextLegId.current++), newLeg(nextLegId.current++)]);
    } else {
      setRooms(1);
      setHotelAdults(2);
      setHotelChildren(0);
      setCheckIn("");
      setGuestPanelOpen(false);
    }
    pendingQuote.current = null;
    contactDialog.current?.close();
    setIsThankYouOpen(true);
  }

  function passengerFields() {
    return (
      <>
        <div className={styles.field}>
          <label htmlFor={`${id}-cabin`}>Cabin Class</label>
          <select id={`${id}-cabin`} value={cabin} onChange={(event) => setCabin(event.target.value)}>
            {["Economy", "Premium Economy", "Business", "First Class"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label>Adults</label>
          <Counter label="Adults" value={adults} onChange={setAdults} minimum={1} />
        </div>
        <div className={styles.field}>
          <label>Children</label>
          <Counter label="Children" value={children} onChange={setChildren} />
        </div>
      </>
    );
  }

  return (
    <div className={`${bookingFonts} ${styles.booking}`}>
      <div className={styles.tabbar} role="tablist" aria-label="Booking type">
        {(["flight", "hotel"] as const).map((tab) => (
          <button key={tab} type="button" role="tab" id={`${id}-tab-${tab}`} aria-selected={activeTab === tab} aria-controls={`${id}-panel-${tab}`} tabIndex={activeTab === tab ? 0 : -1} onClick={() => setActiveTab(tab)} onKeyDown={handleTabKey}>
            {tab === "flight" ? "Flight Booking" : "Hotel Booking"}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`${id}-panel-flight`} aria-labelledby={`${id}-tab-flight`} hidden={activeTab !== "flight"}>
        <form className={styles.shell} onSubmit={(event) => requestQuote(event, "flight")}>
          <div className={styles.tripToggle} role="group" aria-label="Trip type">
            {(["One Way", "Round Trip", "Multi-City"] as const).map((trip) => (
              <button key={trip} type="button" aria-pressed={tripType === trip} onClick={() => setTripType(trip)}>{trip}</button>
            ))}
          </div>

          {tripType === "Multi-City" ? (
            <>
              {legs.map((leg, index) => (
                <div className={styles.multiRow} key={leg.id} role="group" aria-label={`Flight ${index + 1}`}>
                  <div className={styles.field}>
                    <label htmlFor={`${id}-departure-${leg.id}`}>Departure</label>
                    <input id={`${id}-departure-${leg.id}`} placeholder={index === 0 ? "e.g. Lagos (LOS)" : index === 1 ? "e.g. London (LHR)" : "City (IATA)"} value={leg.departure} onChange={(event) => updateLeg(leg.id, "departure", event.target.value)} maxLength={150} required />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor={`${id}-destination-${leg.id}`}>Destination</label>
                    <input id={`${id}-destination-${leg.id}`} placeholder={index === 0 ? "e.g. London (LHR)" : index === 1 ? "e.g. Doha (DOH)" : "City (IATA)"} value={leg.destination} onChange={(event) => updateLeg(leg.id, "destination", event.target.value)} maxLength={150} required />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor={`${id}-date-${leg.id}`}>Departure Date</label>
                    <input id={`${id}-date-${leg.id}`} type="date" value={leg.date} min={index > 0 ? legs[index - 1].date : undefined} onChange={(event) => updateLeg(leg.id, "date", event.target.value)} required />
                  </div>
                  <button type="button" className={styles.remove} aria-label={`Remove flight ${index + 1}`} disabled={legs.length === 1} onClick={() => setLegs((current) => current.filter((item) => item.id !== leg.id))}>Remove</button>
                </div>
              ))}
              <button type="button" className={styles.addCity} onClick={() => {
                const leg = newLeg(nextLegId.current++);
                setLegs((current) => [...current, leg]);
              }}>+ Add another city</button>
              <div className={`${styles.grid} ${styles.multiPassengers}`}>{passengerFields()}</div>
            </>
          ) : (
            <>
              <div className={styles.grid}>{passengerFields()}</div>
              <div className={`${styles.grid} ${styles.spaced}`}>
                <div className={styles.field}>
                  <label htmlFor={`${id}-departure`}>Departure</label>
                  <input id={`${id}-departure`} name="Departure" placeholder="e.g. Lagos (LOS)" maxLength={150} required />
                </div>
                <div className={styles.field}>
                  <label htmlFor={`${id}-destination`}>Destination</label>
                  <input id={`${id}-destination`} name="Destination" placeholder="e.g. Dubai (DXB)" maxLength={150} required />
                </div>
                <div className={styles.field}>
                  <label htmlFor={`${id}-departure-date`}>Departure Date</label>
                  <input id={`${id}-departure-date`} name="Departure Date" type="date" value={departureDate} onChange={(event) => setDepartureDate(event.target.value)} required />
                </div>
              </div>
              <div className={`${styles.grid} ${styles.spaced}`}>
                {tripType === "Round Trip" ? (
                  <div className={styles.field}>
                    <label htmlFor={`${id}-return`}>Return Date</label>
                    <input id={`${id}-return`} name="Return Date" type="date" min={departureDate} required />
                  </div>
                ) : null}
              </div>
            </>
          )}

          <div className={styles.submitRow}>
            <button type="submit" className={styles.submit}>Request Flight Quote</button>
            <p className={styles.microcopy}>We reply with fare options within a few hours — no payment is taken at this step.</p>
          </div>
        </form>
      </div>

      <div role="tabpanel" id={`${id}-panel-hotel`} aria-labelledby={`${id}-tab-hotel`} hidden={activeTab !== "hotel"}>
        <form className={styles.shell} onSubmit={(event) => requestQuote(event, "hotel")}>
          <div className={`${styles.grid} ${styles.two}`}>
            <div className={styles.field}>
              <label htmlFor={`${id}-hotel-destination`}>Destination</label>
              <input id={`${id}-hotel-destination`} name="Destination" placeholder="e.g. Cape Town, South Africa" maxLength={150} required />
            </div>
            <div className={styles.field}>
              <label htmlFor={`${id}-guests`}>Guests &amp; Rooms</label>
              <button id={`${id}-guests`} type="button" className={styles.guestSummary} aria-expanded={guestPanelOpen} aria-controls={`${id}-guest-panel`} onClick={() => setGuestPanelOpen((current) => !current)}>{guestSummary}</button>
            </div>
          </div>
          <div className={styles.guestPanel} id={`${id}-guest-panel`} hidden={!guestPanelOpen}>
            <div className={styles.guestRow}><span>Rooms</span><Counter label="Rooms" value={rooms} onChange={setRooms} minimum={1} /></div>
            <div className={styles.guestRow}><span>Adults per room</span><Counter label="Adults per room" value={hotelAdults} onChange={setHotelAdults} minimum={1} /></div>
            <div className={styles.guestRow}><span>Children per room</span><Counter label="Children per room" value={hotelChildren} onChange={setHotelChildren} /></div>
          </div>
          <div className={`${styles.grid} ${styles.two} ${styles.spaced}`}>
            <div className={styles.field}>
              <label htmlFor={`${id}-check-in`}>Check-in Date</label>
              <input id={`${id}-check-in`} name="Check-in Date" type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} required />
            </div>
            <div className={styles.field}>
              <label htmlFor={`${id}-check-out`}>Check-out Date</label>
              <input id={`${id}-check-out`} name="Check-out Date" type="date" min={checkIn ? new Date(Date.parse(checkIn) + 86400000).toISOString().slice(0, 10) : undefined} required />
            </div>
          </div>
          <div className={styles.submitRow}>
            <button type="submit" className={styles.submit}>Request Hotel Quote</button>
            <p className={styles.microcopy}>Bundle this with a flight request above for a combined itinerary quote.</p>
          </div>
        </form>
      </div>

      <dialog ref={contactDialog} className={styles.contactDialog} aria-labelledby={`${id}-contact-title`} onCancel={(event) => { if (isSubmitting) event.preventDefault(); }} onClose={() => contactForm.current?.reset()}>
        <h2 id={`${id}-contact-title`} className={styles.contactTitle}>Where should we send your quote?</h2>
        <p className={styles.microcopy}>Enter your email so our reservations team can reply with pricing.</p>
        <form ref={contactForm} onSubmit={submitQuote} className={styles.spaced}>
          <div className={styles.field}>
            <label htmlFor={`${id}-email`}>Email Address</label>
            <input id={`${id}-email`} name="Email Address" type="email" autoComplete="email" placeholder="you@email.com" maxLength={254} disabled={isSubmitting} required />
          </div>
          {submissionError ? <p className={styles.error} role="alert">{submissionError}</p> : null}
          <div className={styles.submitRow}>
            <button type="submit" className={styles.submit} disabled={isSubmitting} aria-busy={isSubmitting}>{isSubmitting ? "Sending…" : "Send Quote Request"}</button>
            <button type="button" className={styles.cancel} disabled={isSubmitting} onClick={() => contactDialog.current?.close()}>Cancel</button>
          </div>
        </form>
      </dialog>
      {isThankYouOpen ? <FormSubmissionDialog onClose={() => setIsThankYouOpen(false)} /> : null}
    </div>
  );
}
