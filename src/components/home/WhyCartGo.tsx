"use client";

import { useState } from "react";

const testimonialCopy = [
  "They checked every page of my documents before I paid a single embassy fee. My Canada study visa cleared first try.",
  "Pay Small Small let me save toward my UK visa in bits instead of finding it all at once.",
  "Booked our Zanzibar package flights, hotel and excursions on one form. Everything just worked.",
  "After one refusal, Cart & Go helped me understand what was missing and rebuild my documents with a clear checklist.",
  "The proof-of-funds review gave my sponsor documents structure. I knew what to explain before submitting anything.",
  "Their team helped me compare schools, prepare my admission documents and stay realistic about timelines.",
] as const;

const testimonialNames = [
  ["Kwame Mensah", "Ghana"],
  ["Juma Onyango", "Kenya"],
  ["Chukwuma Okafor", "Nigeria"],
  ["Sibusiso Dlamini", "South Africa"],
  ["Liam Tremblay", "Canada"],
  ["Oliver Smith", "United Kingdom"],
  ["Ama Boateng", "Ghana"],
  ["Wanjiku Kamau", "Kenya"],
  ["Babajide Adebayo", "Nigeria"],
  ["Thabo Mokoena", "South Africa"],
  ["Emily MacDonald", "Canada"],
  ["Charlotte Jones", "United Kingdom"],
  ["Kofi Asare", "Ghana"],
  ["Kipchumba Bett", "Kenya"],
  ["Chioma Nwosu", "Nigeria"],
  ["Lerato Ndlovu", "South Africa"],
  ["Olivier Roy", "Canada"],
  ["Callum Davies", "United Kingdom"],
] as const;

const testimonials = testimonialNames.map(([name, location], index) => [
  testimonialCopy[index % testimonialCopy.length],
  name,
  location,
] as const);

export function WhyCartGo() {
  const [activeIndex, setActiveIndex] = useState(0);

  const visibleTestimonials = [0, 1, 2].map((offset) => {
    const testimonialIndex = (activeIndex + offset) % testimonials.length;
    return testimonials[testimonialIndex];
  });

  return (
    <section className="bg-[#042c43] text-[#fcf8f1]">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <h2 className="font-serif text-4xl font-semibold text-white md:text-5xl">
            Why Cart &amp; Go Travels
          </h2>
          <p className="mt-4 text-base leading-8 text-white/72">
            We are dedicated to building a community of transparency and advocacy
            for individuals seeking relocation. We reduce the risk of financial
            loss and visa denials by checking documents carefully before formal
            submission or embassy fee payment.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {visibleTestimonials.map(([quote, name, location], index) => (
            <article
              key={name}
              className={`${index > 0 ? "hidden md:block" : ""} rounded-md border border-white/15 bg-white/6 p-6`}
            >
              <p className="text-sm leading-7 text-[#dde2ee] italic">&ldquo;{quote}&rdquo;</p>
              <p className="mt-5 text-sm font-semibold text-white">{name}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-white/55">
                {location}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {testimonials.map(([, name], index) => (
            <button
              key={name}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition ${
                activeIndex === index ? "w-8 bg-[#f0a42f]" : "w-2.5 bg-white/35 hover:bg-white/60"
              }`}
              aria-label={`Show testimonial ${index + 1}`}
              aria-current={activeIndex === index ? "true" : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
