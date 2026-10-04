"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { FormSubmissionDialog } from "@/components/ui/FormSubmissionDialog";
import { Icon } from "@/components/ui/Icon";
import { useLeadSubmission } from "@/hooks/useLeadSubmission";
import { formatLeadMessage } from "@/lib/whatsapp";

const promises = [
  ["Transparency", "Requirements, risks and payments are explained before clients commit."],
  ["Advocacy", "We help applicants understand what strengthens or weakens their file."],
  ["Verification", "Documents are reviewed before formal submissions or embassy payments."],
  ["Mobility", "Visa, study, football, work and travel pathways are planned together."],
] as const;

const services = [
  ["Visa Assistance", "Study, work, visit and tourist visas for Canada, UK and Europe.", "File"],
  ["Proof of Funds", "POF review, sponsor evidence and savings pathway guidance.", "Money"],
  ["Travel Desk", "Flights, hotels, insurance, biometrics and medical appointments.", "Plane"],
  ["Study Pathways", "Scholarships, courses, student loans and football mobility support.", "Cap"],
] as const;

const linkGroups = [
  ["Our Destinations", ["Canada", "UK", "France", "Iceland"]],
  ["Our Activities", ["Northern Lights", "Cruising & sailing", "Multi-activities", "Study mobility"]],
  ["Travel Guides", ["Visa refusal guide", "POF checklist", "Student visa guide", "Flight booking tips"]],
] as const;

export function AboutPage() {
  const [isThankYouOpen, setIsThankYouOpen] = useState(false);
  const { sendLead, isSubmitting, submissionError } = useLeadSubmission();

  async function handleNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const sent = await sendLead({
      email: String(formData.get("Email") ?? ""),
      message: formatLeadMessage("newsletter subscription", [
        ["Email", formData.get("Email")],
      ]),
    }, form);
    if (!sent) return;
    setIsThankYouOpen(true);
  }

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#050505] text-white">
        <Image
          src="/assets/hero-travel.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-35"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(5,5,5,.96),rgba(0,30,160,.72),rgba(0,152,186,.2))]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 md:py-28 lg:grid-cols-[.95fr_1.05fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase text-[#04f1f1]">About CartandGo</p>
            <h1 className="mt-4 text-5xl font-black leading-[1.03] md:text-7xl">
              Building a clearer path for people ready to move.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
              CartandGo Travels is a visa, travel and study-abroad desk focused on
              transparency, careful document checks and practical support before
              applicants spend money on submissions, bookings or embassy fees.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <ButtonLink href="/contact">Talk to us</ButtonLink>
              <ButtonLink href="/services?service=visa-assistance#visa-assistance" variant="ghost">Explore visa help</ButtonLink>
            </div>
          </div>

          <div className="relative min-h-[520px]">
            <div className="absolute right-0 top-0 h-[72%] w-[72%] overflow-hidden rounded-lg border-8 border-white bg-white shadow-[0_30px_90px_-45px_rgba(0,0,0,.9)]">
              <Image src="/assets/scholarship.jpg" alt="" fill sizes="50vw" className="object-cover" />
            </div>
            <div className="absolute left-0 top-8 h-64 w-64 overflow-hidden rounded-full border-[14px] border-[#001ee8] bg-white shadow-[0_24px_70px_-45px_rgba(0,0,0,.8)] sm:h-80 sm:w-80">
              <Image src="/assets/visa-passport.jpg" alt="" fill sizes="320px" className="object-cover" />
            </div>
            <div className="absolute bottom-0 left-10 w-[78%] rounded-lg bg-[#001ee8] p-6 text-white shadow-[0_24px_80px_-45px_rgba(0,0,0,.8)]">
              <div className="rounded-md bg-[#04f1f1] p-5 text-[#07141a]">
                <p className="text-xs font-black uppercase">Why CartandGo?</p>
                <p className="mt-3 text-2xl font-black leading-tight">
                  No service charge until visa is approved.
                </p>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/78">
                We mitigate avoidable financial loss and visa denials through
                meticulous document verification before formal submissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-20 md:grid-cols-4 lg:px-8">
          {promises.map(([title, text]) => (
            <div key={title} className="rounded-lg border border-[#d9e2e8] bg-[#f6fbfd] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#0098ba] text-white">
                <Icon name="Check" className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-xl font-black text-[#07141a]">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#5b6870]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f6fbfd]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase text-[#0098ba]">Our story</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-[#07141a] md:text-5xl">
              We combine travel booking with serious application guidance.
            </h2>
            <p className="mt-5 leading-8 text-[#5b6870]">
              The brand exists for clients who need more than a ticket or a form.
              Many travelers need visa clarity, document review, school or work
              direction, proof-of-funds planning and trustworthy booking support in
              one place. CartandGo brings those moving parts together.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {services.map(([title, text, icon]) => (
              <Link
                href="/contact"
                key={title}
                className="rounded-lg border border-[#d9e2e8] bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_30px_90px_-55px_rgba(1,24,34,.7)]"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-[#e8f6fb] text-[#0098ba]">
                  <Icon name={icon} />
                </div>
                <h3 className="mt-5 text-xl font-black text-[#07141a]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5b6870]">{text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0098ba] px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.92fr_1.08fr] lg:items-start">
          <div className="rounded-lg bg-[#04f1f1] p-8 text-[#07141a]">
            <p className="text-xs font-black uppercase">Subscribe Newsletter</p>
            <h2 className="mt-3 text-4xl font-black leading-tight">
              The Travel desk in your inbox.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7">
              Get inspired with travel discounts, visa tips, proof-of-funds notes
              and behind-the-scenes stories from real client pathways.
            </p>
            <form
              onSubmit={handleNewsletterSubmit}
              className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]"
            >
              <input
                name="Email"
                type="email"
                placeholder="Your email address"
                className="h-12 rounded-md border border-transparent bg-white px-4 text-sm outline-none focus:border-[#001ee8]"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="h-12 rounded-md bg-[#07141a] px-5 text-sm font-black text-white"
              >
                Subscribe
              </button>
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

          <div className="grid gap-5 sm:grid-cols-3">
            {linkGroups.map(([title, links]) => (
              <div key={title} className="rounded-lg bg-white/10 p-6 text-[#07141a]">
                <h3 className="text-lg font-black">{title}</h3>
                <ul className="mt-5 space-y-3 text-sm">
                  {links.map((item) => (
                    <li key={item} className="font-medium">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="rounded-lg bg-[#001ee8] p-6 text-white sm:col-span-3">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <h3 className="font-black">About Us</h3>
                  <p className="mt-2 text-sm text-white/75">Our Story</p>
                  <p className="mt-1 text-sm text-white/75">Work with us</p>
                </div>
                <div>
                  <h3 className="font-black">Contact Us</h3>
                  <p className="mt-2 text-sm text-white/75">visaofficer@cartandgotravels.com</p>
                  <p className="mt-1 text-sm text-white/75">Lagos, Canada, Lisbon</p>
                </div>
                <div>
                  <h3 className="font-black">Call or WhatsApp</h3>
                  <p className="mt-2 text-sm text-white/75">+234 807 323 1272</p>
                  <p className="mt-1 text-sm text-white/75">+1 347 420 0238</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {isThankYouOpen ? (
        <FormSubmissionDialog
          onClose={() => setIsThankYouOpen(false)}
        />
      ) : null}
    </>
  );
}
