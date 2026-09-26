"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { WhatsAppLeadActions } from "@/components/ui/WhatsAppLeadActions";

const goals = [
  { label: "Study abroad", value: "study" },
  { label: "Visit or tour", value: "visit" },
  { label: "Work route", value: "work" },
] as const;

const timelines = [
  { label: "This month", value: "soon" },
  { label: "1-3 months", value: "quarter" },
  { label: "Still planning", value: "planning" },
] as const;

const readiness = [
  { label: "Documents ready", value: "ready" },
  { label: "Need review", value: "review" },
  { label: "Starting fresh", value: "fresh" },
] as const;

const results = {
  study: {
    title: "Study Abroad Planning",
    text: "Start with school selection, funding evidence, admission documents and student visa readiness.",
    href: "/services?service=study-football-mobility-pathway#study-football-mobility-pathway",
  },
  visit: {
    title: "Visa Assistance",
    text: "Begin with destination rules, travel purpose, bookings, insurance and document verification.",
    href: "/services?service=visa-assistance#visa-assistance",
  },
  work: {
    title: "Work Visa Review",
    text: "Check job offer evidence, eligibility, qualifications and work permit requirements before major fees.",
    href: "/services?service=visa-assistance#visa-assistance",
  },
} as const;

export function PathwayQuiz() {
  const [goal, setGoal] = useState<keyof typeof results>("study");
  const [timeline, setTimeline] = useState("quarter");
  const [readinessState, setReadinessState] = useState("review");

  const result = results[goal];
  const whatsappMessage = useMemo(
    () =>
      `Hello Cart&Go, I need help with ${result.title}.\nTimeline: ${timeline}\nReadiness: ${readinessState}`,
    [readinessState, result.title, timeline],
  );

  return (
    <section className="bg-[#f6fbfd] px-5 py-18 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <p className="text-xs font-black uppercase text-[#0098ba]">
            Pathway check
          </p>
          <h2 className="mt-3 font-serif text-3xl text-[#07324a] md:text-4xl">
            Which relocation pathway fits you?
          </h2>
          <p className="mt-4 max-w-xl text-base leading-8 text-[#545f68]">
            Answer three quick prompts and get a practical next step before you
            book a consultation or send documents.
          </p>
        </div>

        <div className="rounded-lg border border-[#d7dfe5] bg-white p-5 shadow-[0_20px_70px_-55px_rgba(0,29,47,.55)] md:p-6">
          <div className="grid gap-5 md:grid-cols-3">
            <OptionGroup
              label="Goal"
              options={goals}
              value={goal}
              onChange={(value) => setGoal(value as keyof typeof results)}
            />
            <OptionGroup
              label="Timeline"
              options={timelines}
              value={timeline}
              onChange={setTimeline}
            />
            <OptionGroup
              label="Readiness"
              options={readiness}
              value={readinessState}
              onChange={setReadinessState}
            />
          </div>

          <div className="mt-6 rounded-md bg-[#042c43] p-5 text-white">
            <div className="flex items-start gap-3">
              <div className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#f0a42f] text-[#07141a]">
                <Icon name="Sparkles" className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg font-black">{result.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  {result.text}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={result.href}
                    className="inline-flex items-center gap-2 rounded-md bg-[#f0a42f] px-4 py-2 text-sm font-black text-[#07141a] transition hover:bg-[#ffb347]"
                  >
                    View pathway <Icon name="Arrow" className="h-4 w-4" />
                  </Link>
                  <div className="[&_a]:border [&_a]:border-white/20 [&_a]:bg-transparent [&_a]:text-white [&_a:hover]:bg-white/10">
                    <WhatsAppLeadActions message={whatsappMessage} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type OptionGroupProps = {
  label: string;
  options: readonly { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
};

function OptionGroup({ label, options, value, onChange }: OptionGroupProps) {
  return (
    <fieldset>
      <legend className="mb-3 text-xs font-black uppercase text-[#5b6870]">
        {label}
      </legend>
      <div className="grid gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-md border px-3 py-2 text-left text-sm font-semibold transition ${
              value === option.value
                ? "border-[#0098ba] bg-[#e8f6fb] text-[#07141a]"
                : "border-[#d7dfe5] bg-white text-[#5b6870] hover:border-[#0098ba]/60"
            }`}
            aria-pressed={value === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
