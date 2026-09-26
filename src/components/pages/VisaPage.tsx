import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";

const visaTypes = [
  ["Study, Work, Visit Visa", "Canada, UK, Europe and tourist routes with document strategy.", "Globe"],
  ["Proof of Funds", "Statement checks, sponsor evidence and savings pathway guidance.", "Money"],
  ["Study & Football Mobility", "School, sports and travel documentation for mobility pathways.", "Plane"],
  ["Travel Insurance", "Embassy-compliant cover aligned with itinerary and visa type.", "Shield"],
  ["Biometrics & Medicals", "Appointment planning, readiness notes and follow-up support.", "Care"],
  ["Flights & Hotel Bookings", "Trip reservations connected to your application story.", "Hotel"],
  ["Pay Small Small", "Structured savings toward service goals and application readiness.", "Calendar"],
  ["2nd Passport", "Guidance for Antigua & Barbuda and Grenada routes where eligible.", "File"],
] as const;

const processSteps = [
  ["01", "Eligibility review", "We check destination rules, purpose of travel, history and timeline."],
  ["02", "Document strategy", "You get a clear checklist for finances, employment, invitation and travel proof."],
  ["03", "Application filing", "We prepare forms, bookings, insurance and appointment-ready documents."],
  ["04", "Decision support", "We track next steps, interview prep, pickup guidance and follow-up actions."],
] as const;

const checklist = [
  "International passport and travel history",
  "Bank statements and proof of funds",
  "Employment, business or school evidence",
  "Invitation, hotel booking or travel itinerary",
  "Travel insurance and medical support where required",
  "Refusal notes and appeal documents if applicable",
] as const;

const destinations = ["UK", "Canada", "USA", "Schengen", "Dubai", "Australia"] as const;

const outcomes = [
  ["95%", "approval guidance rate"],
  ["29+", "countries supported"],
  ["7 yrs", "travel expertise"],
] as const;

export function VisaPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#050505] text-white">
        <Image
          src="/assets/visa-passport.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-45"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,.96),rgba(0,61,78,.78),rgba(0,152,186,.2))]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 md:py-28 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase text-[#f0a42f] backdrop-blur">
              <Icon name="File" className="h-4 w-4" />
              Visa Assistance
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.02] md:text-7xl">
              No service charge until visa is approved.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
              CartandGo helps you choose the right route, prepare credible documents,
              fix weak evidence and submit with a calm, complete plan.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <ButtonLink href="/contact">Start your visa</ButtonLink>
              <ButtonLink href="/services?service=proof-of-funds#proof-of-funds" variant="ghost">
                Proof of funds help
              </ButtonLink>
            </div>
          </div>

          <div className="rounded-lg border border-white/15 bg-white p-5 text-[#07141a] shadow-[0_30px_90px_-45px_rgba(0,0,0,.85)]">
            <div className="flex items-center justify-between border-b border-[#d9e2e8] pb-4">
              <div>
                <div className="text-xs font-bold uppercase text-[#0098ba]">Visa desk</div>
                <h2 className="mt-1 text-2xl font-black">Application readiness check</h2>
              </div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-[#e8f6fb] text-[#0098ba]">
                <Icon name="Shield" />
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Destination", "United Kingdom", "Location"],
                ["Visa type", "Study / Visit / Work", "File"],
                ["Timeline", "2-12 weeks", "Calendar"],
                ["Support", "Advisor review", "Message"],
              ].map(([label, value, icon]) => (
                <div key={label} className="rounded-md border border-[#d9e2e8] px-4 py-3">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-[#5b6870]">
                    <Icon name={icon} className="h-3.5 w-3.5 text-[#0098ba]" />
                    {label}
                  </div>
                  <div className="mt-1 text-sm font-black">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-md bg-[#07141a] p-4 text-white">
              <div className="text-xs font-bold uppercase text-[#f0a42f]">Next best action</div>
              <p className="mt-2 text-sm leading-6 text-white/78">
                Send your destination, refusal history if any, travel date and current
                documents. We will tell you what is missing before you pay embassy fees.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {outcomes.map(([value, label]) => (
              <div key={label} className="rounded-lg border border-[#d9e2e8] bg-[#f6fbfd] p-6">
                <div className="text-4xl font-black text-[#0098ba]">{value}</div>
                <div className="mt-2 text-sm font-bold uppercase text-[#5b6870]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f6fbfd]">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase text-[#0098ba]">Visa services</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-[#07141a] md:text-5xl">
                Support for the route you are actually taking.
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {destinations.map((destination) => (
                <span key={destination} className="rounded-md border border-[#0098ba]/30 bg-white px-3 py-2 text-xs font-black text-[#07141a]">
                  {destination}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {visaTypes.map(([title, text, icon]) => (
              <Link
                href="/contact"
                key={title}
                className="group rounded-lg border border-[#d9e2e8] bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_30px_90px_-55px_rgba(1,24,34,.7)]"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-[#e8f6fb] text-[#0098ba] transition group-hover:bg-[#f0a42f] group-hover:text-[#07141a]">
                  <Icon name={icon} />
                </div>
                <h3 className="mt-5 text-xl font-black text-[#07141a]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5b6870]">{text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#001ee8] px-5 py-14 text-white lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase text-[#04f1f1]">Why CartandGo?</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              Transparency and advocacy for people seeking relocation.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              "We verify documents before formal submissions or embassy fee payments.",
              "We reduce avoidable financial loss by flagging weak evidence early.",
              "We support visa, POF, insurance, biometrics, flights and hotel bookings together.",
              "We help clients build toward goals through clear pay-small-small planning.",
            ].map((item) => (
              <div key={item} className="rounded-lg bg-[#04f1f1] p-5 text-[#07141a]">
                <div className="flex gap-3 text-sm font-black leading-6">
                  <span className="mt-2 h-2 w-2 shrink-0 rotate-45 bg-[#f00000]" />
                  {item}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase text-[#0098ba]">What we check</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-[#07141a]">
            Your file should answer the officer’s questions before they ask.
          </h2>
          <p className="mt-5 leading-8 text-[#5b6870]">
            We look for consistency across your purpose, funds, employment or school
            evidence, travel history and ties to home. Weak spots are fixed before
            submission.
          </p>
          <div className="mt-8">
            <ButtonLink href="/contact" variant="dark">Review my documents</ButtonLink>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {checklist.map((item) => (
            <div key={item} className="flex gap-3 rounded-lg border border-[#d9e2e8] bg-white p-5">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0098ba] text-white">
                <Icon name="Check" className="h-3.5 w-3.5" />
              </span>
              <p className="text-sm font-semibold leading-6 text-[#07141a]">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#07141a] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div className="rounded-lg border border-white/12 bg-white/5 p-6">
            <p className="text-xs font-bold uppercase text-[#f0a42f]">Our process</p>
            <div className="mt-8 space-y-5">
              {processSteps.map(([number, title, text]) => (
                <div key={number} className="grid grid-cols-[48px_1fr] gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#f0a42f] text-sm font-black text-[#07141a]">
                    {number}
                  </div>
                  <div>
                    <h3 className="font-black">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-white/70">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg bg-[#0098ba] p-8 text-[#07141a]">
            <Image
              src="/assets/hero-travel.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover opacity-18"
            />
            <div className="relative">
              <p className="text-xs font-black uppercase">Previous refusal support</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight">
                Refused before? Do not submit the same story twice.
              </h2>
              <p className="mt-5 max-w-xl leading-8">
                We review the refusal letter, identify evidence gaps, rebuild the
                explanation and prepare a better-supported application where a new
                submission makes sense.
              </p>
              <Link href="/contact" className="mt-8 inline-flex items-center gap-2 rounded-md bg-[#07141a] px-5 py-3 text-sm font-black text-white">
                Book refusal review <Icon name="Arrow" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
