"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";

const workCountries = [
  {
    name: "Canada - Work Permit",
    desc: "Employer-sponsored and open work permit routes for a verified Canadian job offer.",
    visa: "Work Permit",
    processing: "Approx. 7-11 weeks",
    stay: "Tied to job offer, typically renewable",
    reqs: [
      "Verified job offer from an eligible employer",
      "LMIA where required",
      "Proof of qualifications and experience",
      "Valid passport and biometrics",
      "Police clearance certificate",
    ],
  },
  {
    name: "United Kingdom - Skilled Worker Visa",
    desc: "Sponsored employment route through a Certificate of Sponsorship from a licensed UK employer.",
    visa: "Skilled Worker visa",
    processing: "Around 3 weeks after biometrics",
    stay: "Up to 5 years per grant",
    reqs: [
      "Certificate of Sponsorship",
      "Job offer meeting salary and skill threshold",
      "Proof of English ability",
      "Valid passport and biometrics",
      "Criminal record certificate for certain roles",
    ],
  },
  {
    name: "Europe - National Work Visa",
    desc: "Employer-sponsored national work permits issued by individual Schengen states.",
    visa: "National work visa or permit",
    processing: "Approx. 4-12 weeks depending on state",
    stay: "Tied to contract, typically renewable",
    reqs: [
      "Verified job offer or contract",
      "Recognised qualifications for the role",
      "Valid passport and national visa application",
      "Proof of accommodation",
      "Health insurance coverage",
    ],
  },
] as const;

export function WorkVisaPage() {
  const [openCountry, setOpenCountry] = useState<string>(workCountries[0].name);

  return (
    <section className="bg-[#fbf8f2]">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl font-semibold text-[#0f1e3d] md:text-5xl">
              Work Visa Destinations
            </h1>
            <p className="mt-4 text-base leading-8 text-[#5a5f6b]">
              Sponsored-employment pathways for markets CartandGo can help you
              assess, document and prepare for.
            </p>
          </div>
          <ButtonLink href="/contact" variant="dark">
            Review my work route
          </ButtonLink>
        </div>

        <div className="space-y-4">
          {workCountries.map((country) => {
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
                        ["Visa route", country.visa],
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
