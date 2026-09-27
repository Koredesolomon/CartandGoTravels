"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { FormSubmissionDialog } from "@/components/ui/FormSubmissionDialog";
import { worldCountries } from "@/data/countries";
import { submitLead } from "@/lib/leadSubmission";
import { formatLeadMessage } from "@/lib/whatsapp";

type ServiceFieldConfig = {
  label: string;
  type?: "date" | "email" | "number" | "select" | "tel" | "textarea" | "url";
  placeholder?: string;
  options?: readonly string[];
  required?: boolean;
};

type ServiceFormConfig = {
  serviceId: string;
  id: string;
  title: string;
  submit: string;
  fields: readonly ServiceFieldConfig[];
};

const serviceDirectory = [
  {
    id: "visa-assistance",
    name: "Visa Assistance",
    desc: "Full-service visa guidance for study, work and visit/tourist categories across Canada, the UK and Europe.",
    reqs: [
      "Verified admission letter, job offer or travel purpose",
      "Proof of funds matched to destination threshold",
      "Valid passport and biometrics enrolment",
      "Language test or supporting evidence where required",
    ],
  },
  {
    id: "proof-of-funds",
    name: "Proof of Funds",
    desc: "Legitimate, source-traceable proof-of-funds documentation that satisfies embassy and institution requirements.",
    reqs: [
      "3-6 months bank statement review",
      "GIC setup guidance for Canada-bound applicants",
      "Source-of-funds documentation",
      "Sponsor affidavit, where applicable",
    ],
  },
  {
    id: "study-football-mobility-pathway",
    name: "Study & Football Mobility Pathway",
    desc: "Combines enrolment at a recognised institution abroad with trials, scouting introductions and club placement support.",
    reqs: [
      "Player profile and highlight reel",
      "Placement with partner academies/programmes",
      "Combined study-visa and trial documentation",
      "Age and medical fitness verification",
    ],
  },
  {
    id: "travel-insurance",
    name: "Travel Insurance",
    desc: "Cover arranged to match the exact minimum requirement of the embassy or destination.",
    reqs: [
      "Schengen-compliant medical cover",
      "Trip cancellation and interruption cover",
      "Emergency evacuation and repatriation",
      "Study-abroad extended health cover",
    ],
  },
  {
    id: "flights",
    name: "Flights",
    desc: "Flight search and itinerary support for local, international, family, group and visa-related trips.",
    reqs: [
      "Flexible-date flight options and fare comparison",
      "One-way, return and multi-city itinerary support",
      "Group, family and business-trip reservation support",
      "Trip changes, booking notes and airline coordination",
    ],
  },
  {
    id: "hotel-booking",
    name: "Hotel Booking",
    desc: "Hotel shortlist and reservation support matched to your location, budget, travel purpose and comfort needs.",
    reqs: [
      "Hotel shortlist matched to city, neighbourhood and budget",
      "Business, family, student and leisure stay options",
      "Room preference, guest count and check-in coordination",
      "Visa-friendly booking notes and itinerary support",
    ],
  },
  {
    id: "biometrics-medical-appointments",
    name: "Biometrics & Medical Appointments",
    desc: "We schedule and confirm biometric enrolment and medical exam appointments, and prepare clients for appointment day.",
    reqs: [
      "Biometric appointment at correct application centre",
      "Panel physician or medical exam booking",
      "Appointment confirmations and reminders",
      "Rescheduling support",
    ],
  },
  {
    id: "pay-small-small",
    name: "Pay Small Small",
    desc: "A structured instalment plan to save steadily toward a visa, tuition or trip cost instead of raising the full amount at once.",
    reqs: [
      "Personalised savings goal and target date",
      "Flexible weekly or monthly schedule",
      "Progress tracker on client dashboard",
      "Automatic instalment reminders",
    ],
  },
  {
    id: "second-passport",
    name: "2nd Passport",
    desc: "Guidance through Caribbean citizenship-by-investment programmes for a second passport and visa-free access.",
    reqs: [
      "Due diligence background check",
      "Proof of source of funds",
      "Certified passport copy and birth certificate",
      "Medical certificate and clean police record",
    ],
  },
  {
    id: "permanent-residency-pathway",
    name: "Permanent Residency Pathway",
    desc: "Support through Canada's Express Entry/PNP and Australia's Skilled Migration/Regional Pathway routes.",
    reqs: [
      "Express Entry profile and CRS optimisation, or SkillSelect EOI",
      "Educational Credential Assessment or skills assessment",
      "Language test results",
      "Proof of funds and police clearance",
    ],
  },
] as const;

const serviceForms = [
  {
    serviceId: "visa-assistance",
    id: "visa-assistance-form",
    title: "Visa Assistance Request",
    submit: "Request Visa Review",
    fields: [
      { label: "Full Name", placeholder: "Your full name" },
      { label: "Email Address", type: "email", placeholder: "you@email.com" },
      { label: "Phone / WhatsApp", type: "tel", placeholder: "+234 ..." },
      {
        label: "Visa Category",
        type: "select",
        options: ["Study Visa", "Work Visa", "Visit Visa", "Tourist Visa", "Family Visa"],
      },
      { label: "Destination Country", type: "select", options: worldCountries },
      { label: "Intended Travel Date", type: "date" },
      {
        label: "Application Status",
        type: "select",
        options: ["Not started", "Documents ready", "Submitted before", "Previously refused"],
      },
      { label: "Notes", type: "textarea", placeholder: "Tell us your current visa situation", required: false },
    ],
  },
  {
    serviceId: "proof-of-funds",
    id: "proof-of-funds-form",
    title: "Proof of Funds Request",
    submit: "Review My POF",
    fields: [
      { label: "Full Name", placeholder: "Your full name" },
      { label: "Email Address", type: "email", placeholder: "you@email.com" },
      { label: "Phone / WhatsApp", type: "tel", placeholder: "+234 ..." },
      { label: "Destination Country", type: "select", options: worldCountries },
      { label: "Required Amount", placeholder: "e.g. CAD 20,635" },
      {
        label: "Funds Source",
        type: "select",
        options: ["Personal savings", "Sponsor", "Business income", "Loan", "Multiple sources"],
      },
      { label: "Statement Duration", placeholder: "e.g. 6 months" },
      { label: "POF Concern", type: "textarea", placeholder: "What should we check first?", required: false },
    ],
  },
  {
    serviceId: "study-football-mobility-pathway",
    id: "study-football-mobility-pathway-form",
    title: "Study & Football Mobility Request",
    submit: "Request Pathway Review",
    fields: [
      { label: "Player / Student Name", placeholder: "Full name" },
      { label: "Age", type: "number", placeholder: "e.g. 19" },
      { label: "Email Address", type: "email", placeholder: "you@email.com" },
      { label: "Phone / WhatsApp", type: "tel", placeholder: "+234 ..." },
      { label: "Current Education Level", placeholder: "e.g. SSCE, ND, BSc" },
      { label: "Preferred Country", type: "select", options: worldCountries },
      { label: "Playing Position", placeholder: "e.g. Midfielder" },
      { label: "Profile Link", type: "url", placeholder: "Highlight reel or portfolio URL", required: false },
    ],
  },
  {
    serviceId: "travel-insurance",
    id: "travel-insurance-form",
    title: "Travel Insurance Request",
    submit: "Request Insurance Quote",
    fields: [
      { label: "Full Name", placeholder: "Your full name" },
      { label: "Email Address", type: "email", placeholder: "you@email.com" },
      { label: "Phone / WhatsApp", type: "tel", placeholder: "+234 ..." },
      { label: "Destination", type: "select", options: worldCountries },
      { label: "Departure Date", type: "date" },
      { label: "Return Date", type: "date" },
      {
        label: "Cover Type",
        type: "select",
        options: ["Schengen visa cover", "Study abroad cover", "Family trip", "Business trip"],
      },
      { label: "Number of Travelers", type: "number", placeholder: "e.g. 2" },
    ],
  },
  {
    serviceId: "flights",
    id: "flights-form",
    title: "Flight Request",
    submit: "Request Flight Quote",
    fields: [
      { label: "Full Name", placeholder: "Your full name" },
      { label: "Email Address", type: "email", placeholder: "you@email.com" },
      { label: "Phone / WhatsApp", type: "tel", placeholder: "+234 ..." },
      {
        label: "Trip Type",
        type: "select",
        options: ["One-way", "Return", "Multi-city", "Group booking"],
      },
      { label: "Destination", placeholder: "e.g. London" },
      { label: "Departure City", placeholder: "e.g. Lagos" },
      { label: "Departure Date", type: "date" },
      { label: "Return Date", type: "date", required: false },
      {
        label: "Travelers",
        type: "number",
        placeholder: "Number of travelers",
      },
      {
        label: "Preferences",
        type: "textarea",
        placeholder: "Tell us your airline, budget, baggage or timing preference",
        required: false,
      },
    ],
  },
  {
    serviceId: "hotel-booking",
    id: "hotel-booking-form",
    title: "Hotel Booking Request",
    submit: "Request Hotel Quote",
    fields: [
      { label: "Full Name", placeholder: "Your full name" },
      { label: "Email Address", type: "email", placeholder: "you@email.com" },
      { label: "Phone / WhatsApp", type: "tel", placeholder: "+234 ..." },
      { label: "Destination", placeholder: "e.g. Istanbul" },
      { label: "Check-in Date", type: "date" },
      { label: "Check-out Date", type: "date" },
      {
        label: "Guests",
        type: "number",
        placeholder: "Number of guests",
      },
      {
        label: "Hotel Style",
        type: "select",
        options: ["Budget", "Boutique", "Business hotel", "Resort", "5-star"],
      },
      {
        label: "Preferences",
        type: "textarea",
        placeholder: "Tell us your room type, location, budget or special request",
        required: false,
      },
    ],
  },
  {
    serviceId: "biometrics-medical-appointments",
    id: "biometrics-medical-appointments-form",
    title: "Biometrics & Medical Appointment Request",
    submit: "Request Appointment Support",
    fields: [
      { label: "Full Name", placeholder: "Your full name" },
      { label: "Email Address", type: "email", placeholder: "you@email.com" },
      { label: "Phone / WhatsApp", type: "tel", placeholder: "+234 ..." },
      { label: "Application Country", type: "select", options: worldCountries },
      {
        label: "Appointment Needed",
        type: "select",
        options: ["Biometrics", "Medical exam", "Both biometrics and medicals"],
      },
      { label: "Application Reference", placeholder: "Optional reference number", required: false },
      { label: "Preferred Date", type: "date" },
      { label: "Preferred City", placeholder: "e.g. Lagos" },
    ],
  },
  {
    serviceId: "pay-small-small",
    id: "pay-small-small-form",
    title: "Pay Small Small Plan",
    submit: "Create Savings Plan",
    fields: [
      { label: "Full Name", placeholder: "Your full name" },
      { label: "Email Address", type: "email", placeholder: "you@email.com" },
      { label: "Phone / WhatsApp", type: "tel", placeholder: "+234 ..." },
      {
        label: "Saving For",
        type: "select",
        options: ["Visa fees", "Tuition deposit", "Flight ticket", "Tour package", "Full relocation plan"],
      },
      { label: "Target Amount", placeholder: "e.g. NGN 2,500,000" },
      { label: "Target Date", type: "date" },
      {
        label: "Payment Frequency",
        type: "select",
        options: ["Weekly", "Bi-weekly", "Monthly"],
      },
      { label: "Starting Amount", placeholder: "How much can you start with?" },
    ],
  },
  {
    serviceId: "second-passport",
    id: "second-passport-form",
    title: "2nd Passport Request",
    submit: "Request CBI Consultation",
    fields: [
      { label: "Full Name", placeholder: "Your full name" },
      { label: "Email Address", type: "email", placeholder: "you@email.com" },
      { label: "Phone / WhatsApp", type: "tel", placeholder: "+234 ..." },
      {
        label: "Preferred Programme",
        type: "select",
        options: ["Antigua & Barbuda", "Grenada", "Dominica", "Not sure yet"],
      },
      { label: "Family Size", type: "number", placeholder: "Number of applicants" },
      { label: "Budget Range", placeholder: "e.g. USD 150,000 - 250,000" },
      {
        label: "Source of Funds",
        type: "select",
        options: ["Employment", "Business", "Investment", "Property sale", "Other"],
      },
      { label: "Timeline", placeholder: "How soon do you want to begin?" },
    ],
  },
  {
    serviceId: "permanent-residency-pathway",
    id: "permanent-residency-pathway-form",
    title: "Permanent Residency Pathway Request",
    submit: "Check PR Eligibility",
    fields: [
      { label: "Full Name", placeholder: "Your full name" },
      { label: "Email Address", type: "email", placeholder: "you@email.com" },
      { label: "Phone / WhatsApp", type: "tel", placeholder: "+234 ..." },
      {
        label: "Preferred Country",
        type: "select",
        options: [...worldCountries, "Not sure yet"],
      },
      { label: "Highest Education", placeholder: "e.g. BSc, MSc, HND" },
      { label: "Occupation", placeholder: "Your current job title" },
      { label: "Years of Experience", type: "number", placeholder: "e.g. 5" },
      {
        label: "Language Test Status",
        type: "select",
        options: ["Not taken", "Booked", "IELTS", "CELPIP", "PTE"],
      },
    ],
  },
] as const satisfies readonly ServiceFormConfig[];

function ServiceField({
  formId,
  field,
}: {
  formId: string;
  field: ServiceFieldConfig;
}) {
  const inputId = `${formId}-${field.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const isRequired = field.required !== false;
  const baseClass =
    "mt-1.5 w-full rounded border border-[#e2dacb] bg-[#fbf8f2] px-3 py-2.5 text-[14.5px] text-[#1b1f27] outline-none transition focus:border-[#1aa6b7] focus:ring-2 focus:ring-[#1aa6b7]/20";

  return (
    <label className="block text-[12.5px] font-semibold text-[#0f1e3d]" htmlFor={inputId}>
      {field.label}
      {field.type === "select" ? (
        <select
          id={inputId}
          name={field.label}
          className={baseClass}
          defaultValue=""
          required={isRequired}
        >
          <option value="" disabled>
            Select option
          </option>
          {(field.options ?? []).map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          id={inputId}
          name={field.label}
          rows={4}
          placeholder={field.placeholder}
          className={baseClass}
          required={isRequired}
        />
      ) : (
        <input
          id={inputId}
          name={field.label}
          type={field.type ?? "text"}
          placeholder={field.placeholder}
          className={baseClass}
          required={isRequired}
          min={field.type === "number" ? 1 : undefined}
        />
      )}
    </label>
  );
}

type ServicesDirectoryPageProps = {
  selectedServiceId?: string;
};

export function ServicesDirectoryPage({
  selectedServiceId = serviceDirectory[0].id,
}: ServicesDirectoryPageProps) {
  const [isThankYouOpen, setIsThankYouOpen] = useState(false);
  const selectedService =
    serviceDirectory.find((service) => service.id === selectedServiceId) ??
    serviceDirectory[0];
  const selectedForm =
    serviceForms.find((form) => form.serviceId === selectedService.id) ??
    serviceForms[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const entries = selectedForm.fields.map((field) => [
      field.label,
      formData.get(field.label),
    ]) as [string, FormDataEntryValue | null][];

    await submitLead({
      email: String(
        formData.get("Email Address") ?? formData.get("Email") ?? "",
      ),
      message: formatLeadMessage(selectedForm.title, entries),
    });
    setIsThankYouOpen(true);
    event.currentTarget.reset();
  }

  return (
    <section className="bg-[#fbf8f2]">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <h1 className="font-serif text-4xl font-semibold text-[#0f1e3d] md:text-5xl">
            Services Directory
          </h1>
          <p className="mt-4 text-base leading-8 text-[#5a5f6b]">
            Tap a service to expand its full description and requirements
            checklist.
          </p>
        </div>

        <div className="space-y-3.5">
          {serviceDirectory.map((service) => (
            <details
              key={service.id}
              id={service.id}
              className="group scroll-mt-28 overflow-hidden rounded border border-[#e2dacb] bg-white"
              open={service.id === selectedService.id}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-[18px] font-serif text-base font-semibold text-[#0f1e3d] marker:hidden">
                <span>{service.name}</span>
                <span className="text-xl font-normal text-[#c68a2e] transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="border-t border-dashed border-[#e2dacb] px-5 pb-6 pt-4">
                <p className="max-w-3xl text-[14.5px] leading-7 text-[#5a5f6b]">
                  {service.desc}
                </p>
                <ul className="mt-4 space-y-2">
                  {service.reqs.map((requirement) => (
                    <li
                      key={requirement}
                      className="relative pl-5 text-[14.5px] text-[#1b1f27]"
                    >
                      <span className="absolute left-0 font-bold text-[#1aa6b7]">
                        ✓
                      </span>
                      {requirement}
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-14">
          <div className="mb-8 max-w-2xl">
            <h2 className="font-serif text-3xl font-semibold text-[#0f1e3d] md:text-4xl">
              {selectedService.name} form
            </h2>
            <p className="mt-3 text-base leading-8 text-[#5a5f6b]">
              Complete the request details for this service and the CartandGo
              team will review the right next steps.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            id={selectedForm.id}
            className="max-w-4xl rounded-md border border-[#e2dacb] bg-white p-6"
          >
            <h3 className="font-serif text-2xl font-semibold text-[#0f1e3d]">
              {selectedForm.title}
            </h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {selectedForm.fields.map((field) => (
                <ServiceField
                  key={field.label}
                  formId={selectedForm.id}
                  field={field}
                />
              ))}
            </div>
            <button
              type="submit"
              className="mt-6 inline-flex rounded bg-[#c68a2e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b87d22]"
            >
              {selectedForm.submit}
            </button>
          </form>
        </div>

        <div className="mt-10">
          <Link
            href="/contact"
            className="inline-flex rounded bg-[#c68a2e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b87d22]"
          >
            Book Consultation
          </Link>
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
