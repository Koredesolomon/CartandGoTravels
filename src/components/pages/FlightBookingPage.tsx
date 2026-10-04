"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { FormSubmissionDialog } from "@/components/ui/FormSubmissionDialog";
import { Icon } from "@/components/ui/Icon";
import { useLeadSubmission } from "@/hooks/useLeadSubmission";
import { formatLeadMessage } from "@/lib/whatsapp";

const airports = [
  "Lagos (LOS)",
  "Abuja (ABV)",
  "London (LHR)",
  "Toronto (YYZ)",
  "Dubai (DXB)",
  "Paris (CDG)",
  "New York (JFK)",
  "Amsterdam (AMS)",
] as const;

const fares = [
  {
    airline: "Qatar Airways",
    route: "Lagos to London",
    time: "08:25 - 18:40",
    stops: "1 stop",
    cabin: "Economy",
    price: "NGN 890,000",
  },
  {
    airline: "Turkish Airlines",
    route: "Abuja to Toronto",
    time: "21:10 - 14:55",
    stops: "1 stop",
    cabin: "Economy",
    price: "NGN 1,340,000",
  },
  {
    airline: "Air France",
    route: "Lagos to Paris",
    time: "23:55 - 06:20",
    stops: "Nonstop",
    cabin: "Premium",
    price: "NGN 1,120,000",
  },
] as const;

const addOns = [
  ["Hotel booking", "Compare vetted stays near your destination"],
  ["Travel insurance", "Embassy-compliant cover for your trip"],
  ["Airport transfer", "Arrival pickup and drop-off support"],
] as const;

export function FlightBookingPage() {
  const [bookingMode, setBookingMode] = useState("Flight Booking");
  const [tripType, setTripType] = useState("Round trip");
  const [from, setFrom] = useState("Lagos (LOS)");
  const [to, setTo] = useState("London (LHR)");
  const [passengers, setPassengers] = useState(1);
  const [cabin, setCabin] = useState("Economy");
  const [isThankYouOpen, setIsThankYouOpen] = useState(false);
  const { sendLead, isSubmitting, submissionError } = useLeadSubmission();

  const summary = useMemo(
    () => `${tripType} - ${from} to ${to} - ${passengers} passenger${passengers > 1 ? "s" : ""} - ${cabin}`,
    [cabin, from, passengers, to, tripType],
  );

  function swapAirports() {
    setFrom(to);
    setTo(from);
  }

  async function handleFlightSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const sent = await sendLead({
      email: String(formData.get("Email Address") ?? ""),
      message: formatLeadMessage("a flight quote", [
        ["Email", formData.get("Email Address")],
        ["Trip type", tripType],
        ["From", from],
        ["To", to],
        ["Depart", formData.get("Depart")],
        ["Return", formData.get("Return")],
        ["Travelers", passengers],
        ["Cabin", cabin],
      ]),
    }, form);
    if (!sent) return;
    setIsThankYouOpen(true);
  }

  async function handleHotelSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const sent = await sendLead({
      email: String(formData.get("Email Address") ?? ""),
      message: formatLeadMessage("a hotel quote", [
        ["Email", formData.get("Email Address")],
        ["Destination", formData.get("Destination")],
        ["Guests and rooms", formData.get("Guests and Rooms")],
        ["Check-in", formData.get("Check-in")],
        ["Check-out", formData.get("Check-out")],
      ]),
    }, form);
    if (!sent) return;
    setIsThankYouOpen(true);
  }

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#042c43] text-[#fcf8f1]">
        <Image
          src="/assets/hero-travel.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-35"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,44,67,.96),rgba(4,44,67,.72),rgba(4,44,67,.35))]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
          <div className="max-w-xl">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#e8aa4e] text-[#042c43]">
              <Icon name="Plane" />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-[#e8aa4e]">
              Flight Booking
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] md:text-7xl">
              Find fares, hold seats, finish with support.
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/78">
              Search local and international routes, request promo fares, add hotels
              and travel cover, then let CartandGo help complete the booking.
            </p>
          </div>

          <div className="rounded-lg border border-white/15 bg-white p-5 text-[#05131d] shadow-[0_30px_90px_-42px_rgba(0,0,0,.75)] md:p-7">
            <div className="mb-6 flex flex-wrap gap-2 border-b border-[#d7dfe5] pb-4">
              {["Flight Booking", "Hotel Booking"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setBookingMode(mode)}
                  className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                    bookingMode === mode
                      ? "bg-[#e8aa4e] text-[#05131d]"
                      : "bg-[#eef7fb] text-[#07324a] hover:bg-[#dff4f5]"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {bookingMode === "Flight Booking" ? (
              <form onSubmit={handleFlightSubmit}>
            <label className="mb-5 block">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#66737d]">
                Email Address
              </span>
              <input
                name="Email Address"
                type="email"
                placeholder="you@email.com"
                className="mt-2 h-13 w-full rounded-md border border-[#d7dfe5] px-4 text-sm outline-none focus:border-[#e8aa4e]"
                required
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {["Round trip", "One way", "Multi-city"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTripType(type)}
                  className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                    tripType === type
                      ? "bg-[#042c43] text-white"
                      : "bg-[#eef7fb] text-[#07324a] hover:bg-[#dff4f5]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto_1fr]">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#66737d]">
                  From
                </span>
                <select
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  className="mt-2 h-13 w-full rounded-md border border-[#d7dfe5] bg-white px-4 text-sm outline-none focus:border-[#e8aa4e]"
                  required
                >
                  {airports.map((airport) => (
                    <option key={airport}>{airport}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={swapAirports}
                className="mt-6 flex h-13 w-13 items-center justify-center rounded-md border border-[#d7dfe5] bg-[#f9fcff] text-[#07324a] transition hover:border-[#e8aa4e] hover:bg-[#fff7e8]"
                aria-label="Swap airports"
                title="Swap airports"
              >
                <Icon name="Swap" />
              </button>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#66737d]">
                  To
                </span>
                <select
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  className="mt-2 h-13 w-full rounded-md border border-[#d7dfe5] bg-white px-4 text-sm outline-none focus:border-[#e8aa4e]"
                  required
                >
                  {airports.map((airport) => (
                    <option key={airport}>{airport}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#66737d]">
                  Depart
                </span>
                <input
                  name="Depart"
                  type="date"
                  className="mt-2 h-13 w-full rounded-md border border-[#d7dfe5] px-4 text-sm outline-none focus:border-[#e8aa4e]"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#66737d]">
                  Return
                </span>
                <input
                  name="Return"
                  type="date"
                  disabled={tripType === "One way"}
                  className="mt-2 h-13 w-full rounded-md border border-[#d7dfe5] px-4 text-sm outline-none focus:border-[#e8aa4e] disabled:bg-[#f2f4f5] disabled:text-[#9aa4ab]"
                  required={tripType !== "One way"}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#66737d]">
                  Travelers
                </span>
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={passengers}
                  onChange={(event) => setPassengers(Number(event.target.value))}
                  className="mt-2 h-13 w-full rounded-md border border-[#d7dfe5] px-4 text-sm outline-none focus:border-[#e8aa4e]"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#66737d]">
                  Cabin
                </span>
                <select
                  value={cabin}
                  onChange={(event) => setCabin(event.target.value)}
                  className="mt-2 h-13 w-full rounded-md border border-[#d7dfe5] bg-white px-4 text-sm outline-none focus:border-[#e8aa4e]"
                  required
                >
                  <option>Economy</option>
                  <option>Premium</option>
                  <option>Business</option>
                  <option>First</option>
                </select>
              </label>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <p className="rounded-md bg-[#eef7fb] px-4 py-3 text-sm text-[#545f68]">
                {summary}
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="inline-flex h-13 items-center justify-center gap-2 rounded-md bg-[#e8aa4e] px-6 text-sm font-semibold text-[#05131d] transition hover:bg-[#f3b94c]"
              >
                <Icon name="Search" className="h-4 w-4" />
                Search fares
              </button>
            </div>
            {submissionError ? (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {submissionError}
              </p>
            ) : null}
            {isSubmitting ? (
              <p role="status" className="mt-3 text-sm">Sending your request…</p>
            ) : null}
          </form>
            ) : (
              <form onSubmit={handleHotelSubmit}>
                <label className="mb-5 block">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#66737d]">
                    Email Address
                  </span>
                  <input
                    name="Email Address"
                    type="email"
                    placeholder="you@email.com"
                    className="mt-2 h-13 w-full rounded-md border border-[#d7dfe5] px-4 text-sm outline-none focus:border-[#e8aa4e]"
                    required
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#66737d]">
                      Destination
                    </span>
                    <input
                      name="Destination"
                      placeholder="e.g. Cape Town, South Africa"
                      className="mt-2 h-13 w-full rounded-md border border-[#d7dfe5] px-4 text-sm outline-none focus:border-[#e8aa4e]"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#66737d]">
                      Guests & Rooms
                    </span>
                    <input
                      name="Guests and Rooms"
                      placeholder="1 Room - 2 Adults - 0 Children"
                      className="mt-2 h-13 w-full rounded-md border border-[#d7dfe5] px-4 text-sm outline-none focus:border-[#e8aa4e]"
                      required
                    />
                  </label>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#66737d]">
                      Check-in
                    </span>
                    <input
                      name="Check-in"
                      type="date"
                      className="mt-2 h-13 w-full rounded-md border border-[#d7dfe5] px-4 text-sm outline-none focus:border-[#e8aa4e]"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#66737d]">
                      Check-out
                    </span>
                    <input
                      name="Check-out"
                      type="date"
                      className="mt-2 h-13 w-full rounded-md border border-[#d7dfe5] px-4 text-sm outline-none focus:border-[#e8aa4e]"
                      required
                    />
                  </label>
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <p className="rounded-md bg-[#eef7fb] px-4 py-3 text-sm text-[#545f68]">
                    Bundle this with a flight request for a combined itinerary quote.
                  </p>
                  <button
                    type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                    className="inline-flex h-13 items-center justify-center gap-2 rounded-md bg-[#e8aa4e] px-6 text-sm font-semibold text-[#05131d] transition hover:bg-[#f3b94c]"
                  >
                    <Icon name="Hotel" className="h-4 w-4" />
                    Request hotel quote
                  </button>
                </div>
            {submissionError ? (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {submissionError}
              </p>
            ) : null}
            {isSubmitting ? (
              <p role="status" className="mt-3 text-sm">Sending your request…</p>
            ) : null}
          </form>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-18 lg:grid-cols-[1fr_340px] lg:px-8">
        <div>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e8aa4e]">
                Current Promos
              </p>
              <h2 className="mt-3 font-serif text-4xl">Featured fare options</h2>
            </div>
            <ButtonLink href="/contact" variant="dark">
              Request custom quote
            </ButtonLink>
          </div>

          <div className="space-y-4">
            {fares.map((fare) => (
              <article
                key={`${fare.airline}-${fare.route}`}
                className="grid gap-5 rounded-lg border border-[#d7dfe5] bg-white p-5 shadow-[0_20px_70px_-50px_rgba(0,29,47,.55)] md:grid-cols-[1.2fr_1fr_auto] md:items-center"
              >
                <div>
                  <div className="font-serif text-2xl text-[#07324a]">{fare.airline}</div>
                  <div className="mt-1 text-sm text-[#545f68]">{fare.route}</div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-[#66737d]">Time</div>
                    <div className="mt-1 font-semibold">{fare.time}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-[#66737d]">Stops</div>
                    <div className="mt-1 font-semibold">{fare.stops}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-[#66737d]">Cabin</div>
                    <div className="mt-1 font-semibold">{fare.cabin}</div>
                  </div>
                </div>
                <div className="md:text-right">
                  <div className="font-serif text-2xl text-[#07324a]">{fare.price}</div>
                  <Link
                    href="/contact"
                    className="mt-3 inline-flex items-center justify-center rounded-md bg-[#042c43] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Hold seat
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="h-fit rounded-lg bg-[#042c43] p-6 text-[#fcf8f1]">
          <Icon name="Briefcase" className="h-9 w-9 text-[#e8aa4e]" />
          <h3 className="mt-5 font-serif text-3xl">Complete your trip</h3>
          <div className="mt-5 space-y-3">
            {addOns.map(([title, text]) => (
              <label key={title} className="flex gap-3 rounded-md border border-white/12 bg-white/5 p-4">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-[#e8aa4e]" />
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-1 block text-xs leading-5 text-white/68">{text}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="mt-6">
            <ButtonLink href="/contact">Send request</ButtonLink>
          </div>
        </aside>
      </section>
      {isThankYouOpen ? (
        <FormSubmissionDialog
          onClose={() => setIsThankYouOpen(false)}
        />
      ) : null}
    </>
  );
}
