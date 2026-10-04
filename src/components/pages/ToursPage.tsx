"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { FormSubmissionDialog } from "@/components/ui/FormSubmissionDialog";
import { useLeadSubmission } from "@/hooks/useLeadSubmission";
import { formatLeadMessage } from "@/lib/whatsapp";

const tours = [
  {
    name: "Doha, Qatar",
    desc: "Futuristic skyline, souqs, desert safaris and world-class stopover luxury.",
    visa: "eVisa required",
    processing: "Approx. 3-5 business days",
    stay: "Up to 30 days",
    reqs: [
      "Passport valid 6+ months",
      "Passport-sized photograph",
      "Completed eVisa application form",
      "Confirmed hotel booking",
      "Return/onward flight ticket",
      "Proof of sufficient funds",
    ],
  },
  {
    name: "Kigali, Rwanda",
    desc: "Africa's cleanest capital city and gorilla trekking gateway.",
    visa: "eVisa or visa on arrival",
    processing: "eVisa 2-3 days; VOA on arrival",
    stay: "Up to 30 days",
    reqs: [
      "Passport valid 6+ months",
      "Yellow fever certificate, if required",
      "Passport-sized photograph",
      "Confirmed hotel booking",
      "Return flight ticket",
    ],
  },
  {
    name: "Nairobi, Kenya",
    desc: "Safari capital of East Africa, close to the Maasai Mara.",
    visa: "eTA registration required",
    processing: "A few hours to 3 days",
    stay: "Up to 60 days",
    reqs: [
      "Passport valid 6+ months",
      "Approved eTA confirmation",
      "Return flight ticket",
      "Proof of accommodation",
      "Yellow fever certificate, where applicable",
    ],
  },
  {
    name: "Port Louis, Mauritius",
    desc: "Turquoise lagoons, luxury resorts and a relaxed island pace.",
    visa: "Visa on arrival",
    processing: "Issued on arrival",
    stay: "Up to 2 weeks",
    reqs: [
      "Passport valid 6+ months",
      "Return flight ticket",
      "Confirmed hotel/resort booking",
      "Proof of sufficient funds",
    ],
  },
  {
    name: "Cape Town, South Africa",
    desc: "Table Mountain, winelands and dramatic coastline.",
    visa: "Standard visa via VFS for direct Cape Town flights",
    processing: "Approx. 4-6 weeks",
    stay: "Up to 90 days",
    reqs: [
      "Passport valid 6+ months with 2 blank pages",
      "Completed visa application form",
      "Confirmed hotel booking",
      "Return flight ticket",
      "Bank statement / proof of funds",
    ],
  },
  {
    name: "Male City, Maldives",
    desc: "Overwater villas and some of the world's best diving.",
    visa: "Free visa on arrival",
    processing: "Issued on arrival",
    stay: "Up to 30 days",
    reqs: [
      "Passport valid 6+ months",
      "Return flight ticket",
      "Confirmed resort/hotel booking",
      "Proof of sufficient funds",
    ],
  },
  {
    name: "Victoria, Seychelles",
    desc: "Granite-boulder beaches and unspoilt nature reserves.",
    visa: "Verify eligibility before booking",
    processing: "Not currently guaranteed",
    stay: "Pending confirmation",
    reqs: [
      "Passport valid 6+ months",
      "Written confirmation of current eligibility",
      "Proof of accommodation",
      "Return flight ticket",
      "Proof of sufficient funds",
    ],
  },
  {
    name: "Cairo, Egypt",
    desc: "The Pyramids of Giza, the Nile and millennia of history.",
    visa: "Required in advance",
    processing: "Approx. 1-2 weeks",
    stay: "Typically up to 30 days",
    reqs: [
      "Passport valid 6+ months",
      "Completed visa application form",
      "Passport-sized photograph",
      "Confirmed hotel booking",
      "Return flight ticket",
      "Bank statement / proof of funds",
    ],
  },
  {
    name: "Zanzibar, Tanzania",
    desc: "Spice Island beaches paired with Stone Town's old-world charm.",
    visa: "Required in advance",
    processing: "Approx. 10 business days",
    stay: "Up to 90 days",
    reqs: [
      "Passport valid 6+ months",
      "Completed eVisa application",
      "Passport-sized photograph",
      "Yellow fever certificate",
      "Return flight ticket",
      "Confirmed hotel booking",
    ],
  },
  {
    name: "Cape Verde",
    desc: "Volcanic islands, laid-back beach towns and Afro-Portuguese culture.",
    visa: "Not required",
    processing: "N/A",
    stay: "Typically up to 30 days",
    reqs: [
      "Passport valid 6+ months",
      "Return flight ticket",
      "Proof of accommodation",
      "Proof of sufficient funds",
    ],
  },
  {
    name: "Uganda",
    desc: "Source of the Nile, primate trekking and lush highlands.",
    visa: "eVisa or visa on arrival",
    processing: "Approx. 3-5 business days",
    stay: "Typically 30-90 days",
    reqs: [
      "Passport valid 6+ months",
      "Yellow fever certificate",
      "Passport-sized photograph",
      "Completed eVisa application",
      "Confirmed hotel booking",
      "Return flight ticket",
    ],
  },
  {
    name: "Ethiopia",
    desc: "Rock-hewn churches of Lalibela and an ancient civilisation.",
    visa: "eVisa or VOA at Addis Ababa Bole Airport",
    processing: "eVisa around 3 business days",
    stay: "Up to 90 days",
    reqs: [
      "Passport valid 6+ months",
      "Passport-sized photograph",
      "Completed eVisa application or VOA fee",
      "Return flight ticket",
      "Confirmed hotel booking",
    ],
  },
  {
    name: "Lesotho",
    desc: "The 'Kingdom in the Sky' - mountain scenery and pony trekking.",
    visa: "eVisa required",
    processing: "Approx. 3-5 business days",
    stay: "Typically up to 30 days",
    reqs: [
      "Passport valid 6+ months",
      "Passport-sized photograph",
      "Completed eVisa application",
      "Proof of accommodation",
      "Return flight ticket",
    ],
  },
  {
    name: "Turkey",
    desc: "Istanbul's bazaars, Cappadocia's balloons and the Mediterranean coast.",
    visa: "Required in advance",
    processing: "Approx. 2-3 weeks",
    stay: "Typically 30-90 days",
    reqs: [
      "Passport valid 6+ months",
      "Completed visa application form",
      "Passport-sized photograph",
      "Confirmed hotel booking",
      "Return flight ticket",
      "Bank statement / proof of funds",
      "Travel insurance",
    ],
  },
  {
    name: "Vietnam",
    desc: "Halong Bay, street food culture and dramatic rice terraces.",
    visa: "eVisa required",
    processing: "Approx. 3 business days",
    stay: "Up to 90 days",
    reqs: [
      "Passport valid 6+ months",
      "Passport-sized photograph",
      "Completed eVisa application form",
      "Return flight ticket",
      "Confirmed hotel booking",
    ],
  },
  {
    name: "Malaysia",
    desc: "Kuala Lumpur's skyline, Penang's food scene and island resorts.",
    visa: "eVisa required",
    processing: "Approx. 3-5 business days",
    stay: "Typically up to 30 days",
    reqs: [
      "Passport valid 6+ months",
      "Passport-sized photograph",
      "Completed eVisa application",
      "Return flight ticket",
      "Confirmed hotel booking",
      "Proof of sufficient funds",
    ],
  },
  {
    name: "Zambia",
    desc: "Victoria Falls, walking safaris and the Zambezi River.",
    visa: "eVisa required",
    processing: "Approx. 5-7 business days",
    stay: "Typically 30-90 days",
    reqs: [
      "Passport valid 6+ months",
      "Passport-sized photograph",
      "Completed eVisa application",
      "Yellow fever certificate",
      "Return flight ticket",
      "Confirmed hotel booking",
    ],
  },
  {
    name: "Thailand",
    desc: "Bangkok's temples, Phuket's beaches and Chiang Mai's mountains.",
    visa: "eVisa required",
    processing: "Approx. 3-5 business days",
    stay: "Typically 30-60 days",
    reqs: [
      "Passport valid 6+ months",
      "Passport-sized photograph",
      "Completed eVisa application",
      "Return flight ticket",
      "Confirmed hotel booking",
      "Proof of sufficient funds",
    ],
  },
] as const;

export function ToursPage() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedTours, setSelectedTours] = useState<string[]>([]);
  const [openChecklist, setOpenChecklist] = useState<string | null>(null);
  const [isThankYouOpen, setIsThankYouOpen] = useState(false);
  const { sendLead, isSubmitting, submissionError } = useLeadSubmission();

  function openRequestPopup(tourName: string) {
    setSelectedTours((current) =>
      current.includes(tourName) ? current : [...current, tourName],
    );
    setIsPopupOpen(true);
  }

  function toggleTour(tourName: string) {
    setSelectedTours((current) =>
      current.includes(tourName)
        ? current.filter((item) => item !== tourName)
        : [...current, tourName],
    );
  }

  async function handleTourSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const sent = await sendLead({
      email: String(formData.get("Email Address") ?? ""),
      message: formatLeadMessage("a tour package quote", [
        ["Full name", formData.get("Full Name")],
        ["Phone / WhatsApp", formData.get("Phone / WhatsApp")],
        ["Email", formData.get("Email Address")],
        ["Number of travelers", formData.get("Number of Travelers")],
        ["Preferred travel date", formData.get("Preferred Travel Date")],
        ["Destinations", selectedTours.join(", ")],
        ["Extra notes", formData.get("Extra Notes")],
      ]),
    }, form);
    if (!sent) return;
    setIsThankYouOpen(true);
    setIsPopupOpen(false);
  }

  return (
    <section className="bg-[#fbf8f2]">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <h1 className="font-serif text-4xl font-semibold text-[#0f1e3d] md:text-5xl">
            Tour & Vacation Packages
          </h1>
          <p className="mt-4 text-base leading-8 text-[#5a5f6b]">
            Curated destinations across Africa, the Middle East, Europe and
            Asia. Each package can bundle flights, hotel, excursions and visa
            support where needed.
          </p>
        </div>

        <div className="grid gap-[22px] md:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => (
            <article
              key={tour.name}
              className="flex flex-col gap-2.5 rounded border border-[#e2dacb] bg-white p-6"
            >
              <span className="text-[11.5px] font-bold text-[#c68a2e]">
                Tour & Vacation
              </span>
              <h2 className="font-serif text-[18.5px] font-semibold text-[#0f1e3d]">
                {tour.name}
              </h2>
              <p className="mb-1 text-[14.5px] leading-6 text-[#5a5f6b]">
                {tour.desc}
              </p>
              <div className="mt-2 space-y-1 border-t border-dashed border-[#e2dacb] pt-3 text-[12.5px] leading-5 text-[#5a5f6b]">
                <div>
                  <b className="text-[#0f1e3d]">Visa:</b> {tour.visa}
                </div>
                <div>
                  <b className="text-[#0f1e3d]">Processing:</b> {tour.processing}
                </div>
                <div>
                  <b className="text-[#0f1e3d]">Stay:</b> {tour.stay}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setOpenChecklist((current) =>
                    current === tour.name ? null : tour.name,
                  )
                }
                className="mt-2 text-left text-[12.5px] font-semibold text-[#1aa6b7] underline underline-offset-2"
              >
                {openChecklist === tour.name
                  ? "Hide document / visa checklist"
                  : "Show document / visa checklist"}
              </button>
              {openChecklist === tour.name ? (
                <ul className="space-y-2 border-t border-dashed border-[#e2dacb] pt-3 text-[13px] text-[#1b1f27]">
                  {tour.reqs.map((req) => (
                    <li key={req} className="flex gap-2">
                      <Icon
                        name="Check"
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#1aa6b7]"
                      />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-auto flex items-center justify-between pt-2.5">
                <button
                  type="button"
                  onClick={() => openRequestPopup(tour.name)}
                  className="text-[13.5px] font-semibold text-[#0f1e3d] underline underline-offset-4 transition hover:text-[#c68a2e]"
                >
                  Request package
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {isPopupOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#050505]/65 px-5 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-request-title"
        >
          <div className="max-h-full w-full max-w-4xl overflow-y-auto rounded-md border border-[#e2dacb] bg-white p-6 shadow-[0_30px_90px_-35px_rgba(0,0,0,.65)]">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2
                  id="tour-request-title"
                  className="font-serif text-3xl font-semibold text-[#0f1e3d]"
                >
                  Request tour package
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#5a5f6b]">
                  Select one or more destinations and share the trip details for
                  a package quote.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPopupOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-[#e2dacb] text-xl leading-none text-[#0f1e3d] transition hover:border-[#c68a2e] hover:text-[#c68a2e]"
                aria-label="Close tour request form"
              >
                x
              </button>
            </div>

            <form className="mt-6" onSubmit={handleTourSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-[12.5px] font-semibold text-[#0f1e3d]">
                  Full Name
                  <input
                    name="Full Name"
                    className="mt-1.5 w-full rounded border border-[#e2dacb] bg-[#fbf8f2] px-3 py-2.5 text-[14.5px] text-[#1b1f27] outline-none transition focus:border-[#1aa6b7] focus:ring-2 focus:ring-[#1aa6b7]/20"
                    placeholder="Your full name"
                    required
                  />
                </label>
                <label className="block text-[12.5px] font-semibold text-[#0f1e3d]">
                  Phone / WhatsApp
                  <input
                    name="Phone / WhatsApp"
                    type="tel"
                    className="mt-1.5 w-full rounded border border-[#e2dacb] bg-[#fbf8f2] px-3 py-2.5 text-[14.5px] text-[#1b1f27] outline-none transition focus:border-[#1aa6b7] focus:ring-2 focus:ring-[#1aa6b7]/20"
                    placeholder="+234 ..."
                    required
                  />
                </label>
                <label className="block text-[12.5px] font-semibold text-[#0f1e3d]">
                  Email Address
                  <input
                    name="Email Address"
                    type="email"
                    className="mt-1.5 w-full rounded border border-[#e2dacb] bg-[#fbf8f2] px-3 py-2.5 text-[14.5px] text-[#1b1f27] outline-none transition focus:border-[#1aa6b7] focus:ring-2 focus:ring-[#1aa6b7]/20"
                    placeholder="you@email.com"
                    required
                  />
                </label>
                <label className="block text-[12.5px] font-semibold text-[#0f1e3d]">
                  Number of Travelers
                  <input
                    name="Number of Travelers"
                    type="number"
                    min="1"
                    className="mt-1.5 w-full rounded border border-[#e2dacb] bg-[#fbf8f2] px-3 py-2.5 text-[14.5px] text-[#1b1f27] outline-none transition focus:border-[#1aa6b7] focus:ring-2 focus:ring-[#1aa6b7]/20"
                    placeholder="e.g. 2"
                    required
                  />
                </label>
                <label className="block text-[12.5px] font-semibold text-[#0f1e3d]">
                  Preferred Travel Date
                  <input
                    name="Preferred Travel Date"
                    type="date"
                    className="mt-1.5 w-full rounded border border-[#e2dacb] bg-[#fbf8f2] px-3 py-2.5 text-[14.5px] text-[#1b1f27] outline-none transition focus:border-[#1aa6b7] focus:ring-2 focus:ring-[#1aa6b7]/20"
                    required
                  />
                </label>
              </div>

              <fieldset className="mt-6">
                <legend className="text-[12.5px] font-semibold text-[#0f1e3d]">
                  Destinations
                </legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {tours.map((tour) => (
                    <label
                      key={tour.name}
                      className="flex items-center gap-3 rounded border border-[#e2dacb] bg-[#fbf8f2] px-3 py-2.5 text-sm text-[#1b1f27]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTours.includes(tour.name)}
                        onChange={() => toggleTour(tour.name)}
                        className="h-4 w-4 accent-[#1aa6b7]"
                      />
                      {tour.name}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="mt-5 block text-[12.5px] font-semibold text-[#0f1e3d]">
                Extra Notes
                <textarea
                  name="Extra Notes"
                  rows={4}
                  className="mt-1.5 w-full rounded border border-[#e2dacb] bg-[#fbf8f2] px-3 py-2.5 text-[14.5px] text-[#1b1f27] outline-none transition focus:border-[#1aa6b7] focus:ring-2 focus:ring-[#1aa6b7]/20"
                  placeholder="Tell us about hotel preference, activities, visa support, or group needs"
                />
              </label>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                  className="inline-flex rounded bg-[#c68a2e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b87d22]"
                >
                  Submit package request
                </button>
                <button
                  type="button"
                  onClick={() => setIsPopupOpen(false)}
                  className="inline-flex rounded border border-[#0f1e3d] px-5 py-3 text-sm font-semibold text-[#0f1e3d] transition hover:bg-[#0f1e3d] hover:text-white"
                >
                  Cancel
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
          </div>
        </div>
      ) : null}
      {isThankYouOpen ? (
        <FormSubmissionDialog
          onClose={() => setIsThankYouOpen(false)}
        />
      ) : null}
    </section>
  );
}
