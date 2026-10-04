"use client";

import { useState, type FormEvent } from "react";
import { FormSubmissionDialog } from "@/components/ui/FormSubmissionDialog";
import { useLeadSubmission } from "@/hooks/useLeadSubmission";
import { formatLeadMessage } from "@/lib/whatsapp";

const contactCards = [
  {
    tag: "Email",
    text: "visaofficer@cartandgotravels.com",
  },
  {
    tag: "WhatsApp",
    text: "+234 807 323 1272",
  },
  {
    tag: "WhatsApp",
    text: "+1 347 420 0238",
  },
  {
    tag: "Office",
    text: "Lagos, Canada, Lisbon",
  },
] as const;

const serviceOptions = [
  "Visa Assistance",
  "Study Abroad",
  "Tour & Vacation Package",
  "Flight / Hotel Booking",
  "2nd Passport",
  "Permanent Residency",
  "Training & Certification",
] as const;

const inputClass =
  "mt-1.5 w-full rounded border border-[#e2dacb] bg-[#fbf8f2] px-3 py-2.5 text-[14.5px] text-[#1b1f27] outline-none transition focus:border-[#1aa6b7] focus:ring-2 focus:ring-[#1aa6b7]/20";

export function ContactPage() {
  const [isThankYouOpen, setIsThankYouOpen] = useState(false);
  const { sendLead, isSubmitting, submissionError } = useLeadSubmission();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const sent = await sendLead({
      email: String(formData.get("Email") ?? ""),
      message: formatLeadMessage("a free consultation", [
        ["Full name", formData.get("Full Name")],
        ["Phone number", formData.get("Phone Number")],
        ["Email", formData.get("Email")],
        ["Service of interest", formData.get("Service of Interest")],
        ["Message", formData.get("Tell us more")],
      ]),
    }, form);
    if (!sent) return;
    setIsThankYouOpen(true);
  }

  return (
    <section className="bg-[#fbf8f2]">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 lg:grid-cols-2 lg:items-start lg:px-8">
        <div>
          <div className="mb-10 max-w-2xl">
            <h1 className="font-serif text-4xl font-semibold text-[#0f1e3d] md:text-5xl">
              Book a Free Consultation
            </h1>
            <p className="mt-4 text-base leading-8 text-[#5a5f6b]">
              Tell us what you&apos;re planning and a visa officer will verify
              your documents before anything is submitted or paid for.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-md border border-[#e2dacb] bg-white p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-[12.5px] font-semibold text-[#0f1e3d]">
                Full Name
                <input
                  name="Full Name"
                  className={inputClass}
                  placeholder="Your name"
                  required
                />
              </label>
              <label className="block text-[12.5px] font-semibold text-[#0f1e3d]">
                Phone Number
                <input
                  name="Phone Number"
                  className={inputClass}
                  type="tel"
                  placeholder="+234 ..."
                  required
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-[12.5px] font-semibold text-[#0f1e3d]">
                Email
                <input
                  name="Email"
                  className={inputClass}
                  type="email"
                  placeholder="you@email.com"
                  required
                />
              </label>
              <label className="block text-[12.5px] font-semibold text-[#0f1e3d]">
                Service of Interest
                <select
                  name="Service of Interest"
                  className={inputClass}
                  defaultValue=""
                  required
                >
                  <option value="" disabled>
                    Select service
                  </option>
                  {serviceOptions.map((service) => (
                    <option key={service}>{service}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 block text-[12.5px] font-semibold text-[#0f1e3d]">
              Tell us more
              <input
                name="Tell us more"
                className={inputClass}
                placeholder="A few words about your plan"
                required
              />
            </label>
            <div className="mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="inline-flex rounded bg-[#c68a2e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b87d22]"
              >
                Request Consultation
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

        <div>
          <div className="mb-10 max-w-2xl">
            <h2 className="font-serif text-4xl font-semibold text-[#0f1e3d] md:text-5xl">
              Reach us directly
            </h2>
          </div>

          <div className="space-y-4">
            {contactCards.map((card) => (
              <article
                key={`${card.tag}-${card.text}`}
                className="rounded border border-[#e2dacb] bg-white p-6"
              >
                <span className="text-[11.5px] font-bold text-[#c68a2e]">
                  {card.tag}
                </span>
                <p className="mt-2 text-[14.5px] leading-7 text-[#5a5f6b]">
                  {card.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
      {isThankYouOpen ? (
        <FormSubmissionDialog
          onClose={() => setIsThankYouOpen(false)}
        />
      ) : null}
    </section>
  );
}
