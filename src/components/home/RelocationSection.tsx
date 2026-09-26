import Link from "next/link";

const relocationCards = [
  {
    name: "Visa Assistance",
    tag: "Study - Work - Visit",
    desc: "Full-service visa guidance for study, work and visit/tourist categories across Canada, the UK and Europe.",
    href: "/services?service=visa-assistance#visa-assistance",
  },
  {
    name: "Proof of Funds",
    tag: "Financial documentation",
    desc: "Legitimate, source-traceable proof-of-funds documentation that satisfies embassy and institution requirements.",
    href: "/services?service=proof-of-funds#proof-of-funds",
  },
  {
    name: "Study & Football Mobility Pathway",
    tag: "Student-athletes",
    desc: "Combines enrolment at a recognised institution abroad with trials, scouting introductions and club placement support.",
    href: "/services?service=study-football-mobility-pathway#study-football-mobility-pathway",
  },
  {
    name: "Travel Insurance",
    tag: "Every visa category",
    desc: "Cover arranged to match the exact minimum requirement of the embassy or destination.",
    href: "/services?service=travel-insurance#travel-insurance",
  },
  {
    name: "Biometrics & Medical Appointments",
    tag: "Scheduling support",
    desc: "We schedule and confirm biometric enrolment and medical exam appointments, and prepare clients for appointment day.",
    href: "/services?service=biometrics-medical-appointments#biometrics-medical-appointments",
  },
  {
    name: "Flights & Hotels",
    tag: "Fares and stays",
    desc: "Request flight options, compare hotel stays and bundle travel support into one itinerary before you pay.",
    href: "/services?service=flights#flights",
  },
  {
    name: "Pay Small Small",
    tag: "Instalment savings plan",
    desc: "A structured instalment plan to save steadily toward a visa, tuition or trip cost instead of raising the full amount at once.",
    href: "/services?service=pay-small-small#pay-small-small",
  },
  {
    name: "2nd Passport",
    tag: "Antigua & Barbuda - Grenada - Dominica",
    desc: "Guidance through Caribbean citizenship-by-investment programmes for a second passport and visa-free access.",
    href: "/services?service=second-passport#second-passport",
  },
  {
    name: "Permanent Residency Pathway",
    tag: "Canada - Australia",
    desc: "Support through Canada's Express Entry/PNP and Australia's Skilled Migration/Regional Pathway routes.",
    href: "/services?service=permanent-residency-pathway#permanent-residency-pathway",
  },
  {
    name: "Tours & Vacations",
    tag: "Tour & Vacation",
    desc: "Curated destination packages that can bundle flights, hotels, excursions and visa support where needed.",
    href: "/services",
  },
] as const;

export function RelocationSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-serif text-3xl text-[#07324a] md:text-4xl">
            Everything Relocation In one place
          </h2>
          <p className="mt-4 text-base leading-8 text-[#545f68]">
            From your first document check to landing in a new city, our core
            services are built around clarity, verification and practical support
            at every step.
          </p>
        </div>

        <div className="grid gap-[22px] md:grid-cols-2 lg:grid-cols-4">
          {relocationCards.map((card) => (
            <article
              key={card.name}
              className="flex flex-col gap-2.5 rounded border border-[#e2dacb] bg-white p-6"
            >
              <span className="text-[11.5px] font-bold text-[#c68a2e]">
                {card.tag}
              </span>
              <h3 className="font-serif text-[18.5px] font-semibold text-[#0f1e3d]">
                {card.name}
              </h3>
              <p className="mb-1 text-[14.5px] leading-6 text-[#5a5f6b]">
                {card.desc}
              </p>
              <div className="mt-auto flex items-center justify-between pt-2.5">
                <Link
                  href={card.href}
                  className="text-[13.5px] font-semibold text-[#0f1e3d] underline underline-offset-4 transition hover:text-[#c68a2e]"
                >
                  Learn more
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
