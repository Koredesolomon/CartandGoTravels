"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";

const studyCountries = [
  {
    name: "Canada",
    desc: "Globally recognised degrees, generous post-graduation work rights, and a clear path to permanent residency.",
    visa: "Study Permit",
    processing: "Approx. 6-12 weeks",
    stay: "Length of programme plus 90-day transition window",
    reqs: [
      "Letter of Acceptance from a designated learning institution",
      "Proof of funds or GIC guidance",
      "Valid passport",
      "English or French test where required",
      "Statement of purpose",
      "Biometrics appointment",
    ],
  },
  {
    name: "United Kingdom",
    desc: "Short, intensive postgraduate programmes plus the Graduate Route after eligible study.",
    visa: "Student visa",
    processing: "Around 3 weeks after biometrics",
    stay: "Length of course plus eligible post-study options",
    reqs: [
      "Confirmation of Acceptance for Studies",
      "Maintenance funds held for the required period",
      "Valid passport",
      "IELTS UKVI or accepted equivalent where required",
      "TB test certificate where required",
    ],
  },
  {
    name: "Hungary",
    desc: "Affordable EU-recognised degrees and scholarship-friendly university options.",
    visa: "National D student visa",
    processing: "Approx. 4-8 weeks",
    stay: "Length of programme, renewed annually",
    reqs: [
      "Letter of admission",
      "Proof of tuition payment or scholarship",
      "Proof of accommodation",
      "Proof of financial means",
      "Completed D-visa application",
    ],
  },
  {
    name: "Ireland",
    desc: "English-language, EU-accredited education with post-study work opportunities.",
    visa: "Long-stay D study visa",
    processing: "Approx. 4-8 weeks",
    stay: "Length of course plus eligible graduate permission",
    reqs: [
      "Letter of offer",
      "Evidence of funds",
      "Private medical insurance",
      "Proof of tuition fee payment",
      "Valid passport and visa application",
    ],
  },
  {
    name: "Finland",
    desc: "Scholarship-friendly programmes in a high-ranking education system.",
    visa: "Residence permit for studies",
    processing: "Approx. 1-4 months",
    stay: "Length of studies, renewed each academic year",
    reqs: [
      "Study place confirmation",
      "Proof of sufficient yearly funds",
      "Valid travel document",
      "Comprehensive health insurance",
      "Residence permit application",
    ],
  },
  {
    name: "Germany",
    desc: "Low-tuition public universities and a post-study job search route.",
    visa: "National D student visa",
    processing: "Approx. 6-12 weeks",
    stay: "Length of studies plus eligible post-study permit",
    reqs: [
      "Admission letter",
      "Blocked account guidance",
      "Valid passport and national visa application",
      "Health insurance proof",
      "APS certificate where applicable",
    ],
  },
  {
    name: "France",
    desc: "Campus France guidance, long-stay student visa support and broad programme options.",
    visa: "Long-stay visa",
    processing: "Approx. 2-3 weeks after Campus France validation",
    stay: "Length of course plus eligible post-study options",
    reqs: [
      "Validated Campus France application",
      "Letter of acceptance",
      "Proof of financial resources",
      "Long-stay visa application",
      "Proof of accommodation",
    ],
  },
  {
    name: "Malaysia",
    desc: "International degree pathways at more accessible tuition levels.",
    visa: "Student Pass",
    processing: "Approx. 4-8 weeks",
    stay: "Length of programme, renewed annually",
    reqs: [
      "Letter of offer",
      "Student Pass approval guidance",
      "Proof of financial capability",
      "Medical screening report",
      "Insurance coverage",
    ],
  },
  {
    name: "Portugal",
    desc: "Growing international programmes with an accessible national study route.",
    visa: "D4 study visa",
    processing: "Approx. 60 days",
    stay: "Initial visa, then residence permit for course length",
    reqs: [
      "Letter of acceptance",
      "Proof of accommodation",
      "Proof of subsistence funds",
      "D4 national visa application",
      "Travel or health insurance",
    ],
  },
] as const;

export function StudyAbroadPage() {
  const [openCountry, setOpenCountry] = useState<string>(studyCountries[0].name);

  return (
    <section className="bg-[#fbf8f2]">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl font-semibold text-[#0f1e3d] md:text-5xl">
              Study Abroad Destinations
            </h1>
            <p className="mt-4 text-base leading-8 text-[#5a5f6b]">
              Compare study routes, timelines and document requirements before
              choosing a school, funding plan or visa pathway.
            </p>
          </div>
          <ButtonLink href="/contact" variant="dark">
            Plan my study route
          </ButtonLink>
        </div>

        <div className="space-y-4">
          {studyCountries.map((country) => {
            const isOpen = openCountry === country.name;

            return (
              <article
                key={country.name}
                className="overflow-hidden rounded-md border border-[#e2dacb] bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenCountry(isOpen ? "" : country.name)}
                  className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left"
                >
                  <span>
                    <span className="block font-serif text-xl font-semibold text-[#0f1e3d]">
                      {country.name}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-[#5a5f6b]">
                      {country.desc}
                    </span>
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-[#e2dacb] text-[#c68a2e]">
                    {isOpen ? "-" : "+"}
                  </span>
                </button>

                {isOpen ? (
                  <div className="border-t border-dashed border-[#e2dacb] px-5 pb-6 pt-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        ["Visa required", country.visa],
                        ["Processing time", country.processing],
                        ["Allowed stay", country.stay],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded border border-[#e2dacb] bg-[#fbf8f2] p-4"
                        >
                          <div className="text-[10.5px] font-bold uppercase text-[#c68a2e]">
                            {label}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-[#1b1f27]">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <h2 className="mt-5 text-sm font-semibold text-[#0f1e3d]">
                      Required documents / checklist
                    </h2>
                    <ul className="mt-3 grid gap-2 md:grid-cols-2">
                      {country.reqs.map((req) => (
                        <li key={req} className="flex gap-2 text-sm text-[#1b1f27]">
                          <Icon
                            name="Check"
                            className="mt-0.5 h-4 w-4 shrink-0 text-[#1aa6b7]"
                          />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
