"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { stats } from "@/data/site";

type ServiceSlide = {
  eyebrow: string;
  title: string;
  text: string;
  image: string;
  href: string;
  icon: string;
  imageClassName?: string;
  ctaLabel?: string;
};

const slides: readonly ServiceSlide[] = [
  {
    eyebrow: "Study - Work - Visit",
    title: "Visa Assistance",
    text: "Full-service guidance for study, work and visitor visas, from eligibility review to biometrics and final submission.",
    image: "/assets/service-visa-assistance.png",
    href: "/services?service=visa-assistance#visa-assistance",
    icon: "File",
  },
  {
    eyebrow: "Financial Documentation",
    title: "Proof of Funds",
    text: "We review statements, sponsor evidence and savings plans so your money documents feel consistent, clear and credible.",
    image: "/assets/service-proof-of-funds.png",
    href: "/services?service=proof-of-funds#proof-of-funds",
    icon: "Money",
  },
  {
    eyebrow: "Admissions - Visa - Funding",
    title: "Study Abroad",
    text: "Compare destinations, prepare admission documents, plan funding evidence and move toward your student visa with structure.",
    image: "/assets/service-study-abroad.png",
    href: "/services?service=study-football-mobility-pathway#study-football-mobility-pathway",
    icon: "Cap",
  },
  {
    eyebrow: "Study Abroad - Student-Athletes",
    title: "Study & Football Mobility Pathway",
    text: "Combine study abroad with football development. Get support with school enrolment, player profiles, trial documentation and your travel plans.",
    image: "/assets/service-study-football-mobility.jpg",
    imageClassName: "object-cover object-[50%_25%] lg:object-contain lg:object-right",
    href: "/services?service=study-football-mobility-pathway#study-football-mobility-pathway",
    icon: "Cap",
    ctaLabel: "Explore Pathway",
  },
  {
    eyebrow: "Sponsored Pathways",
    title: "Work Visa",
    text: "Assess employer-sponsored options, document your qualifications and understand the requirements before committing fees.",
    image: "/assets/service-work-visa.png",
    href: "/services?service=visa-assistance#visa-assistance",
    icon: "Briefcase",
  },
  {
    eyebrow: "Fares And Stays",
    title: "Flights & Hotels",
    text: "Request flight options, compare hotel stays and bundle travel support into one itinerary before you pay.",
    image: "/assets/service-flights-hotels.png",
    href: "/services?service=flights#flights",
    icon: "Plane",
  },
  {
    eyebrow: "Tour & Vacation",
    title: "Tours & Vacations",
    text: "Explore group, family and leisure packages that can include flights, hotels, excursions and visa support where needed.",
    image: "/assets/service-tours-vacations.png",
    href: "/services",
    icon: "Globe",
  },
  {
    eyebrow: "Every Visa Category",
    title: "Travel Insurance",
    text: "Get compliant medical and travel cover for Schengen, study, visit and other travel categories.",
    image: "/assets/service-travel-insurance.png",
    href: "/services?service=travel-insurance#travel-insurance",
    icon: "Shield",
  },
  {
    eyebrow: "Global Mobility",
    title: "2nd Passport",
    text: "Review second-passport options, due diligence needs, document requirements and route suitability before major payments.",
    image: "/assets/service-second-passport.png",
    href: "/services?service=second-passport#second-passport",
    icon: "User",
  },
  {
    eyebrow: "Instalment Savings Plan",
    title: "Pay Small Small",
    text: "Plan a realistic savings schedule, track progress and prepare for major travel payments without last-minute pressure.",
    image: "/assets/service-pay-small-small.png",
    href: "/services?service=pay-small-small#pay-small-small",
    icon: "Calendar",
  },
] as const;

export function HeroServiceCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const activeSlide = slides[activeIndex];

  useEffect(() => {
    if (isPaused || isHovered) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number | undefined;
    const updateRotation = () => {
      window.clearInterval(timer);
      if (!reducedMotion.matches) {
        timer = window.setInterval(() => {
          setActiveIndex((current) => (current + 1) % slides.length);
        }, 6200);
      }
    };
    updateRotation();
    reducedMotion.addEventListener("change", updateRotation);

    return () => {
      window.clearInterval(timer);
      reducedMotion.removeEventListener("change", updateRotation);
    };
  }, [isPaused, isHovered]);

  return (
    <section
      aria-label="Travel services"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={event => {
        if (!(event.target as HTMLElement).closest("[data-carousel-playback]")) setIsPaused(true);
      }}
      className="relative isolate min-h-[calc(100vh-76px)] overflow-hidden bg-[#050505] text-[#fcf8f1]"
    >
      {slides.map((slide, index) => (
        <Image
          key={slide.image}
          src={slide.image}
          alt=""
          fill
          sizes="100vw"
          className={`${slide.imageClassName ?? "object-cover"} transition duration-1000 motion-reduce:transition-none ${
            index === activeIndex ? "scale-100 opacity-100" : "scale-105 opacity-0"
          }`}
          preload={index === 0}
        />
      ))}

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,.94),rgba(4,44,67,.82)_42%,rgba(4,44,67,.28)_72%,rgba(5,5,5,.5))]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(0deg,rgba(5,5,5,.9),transparent)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl content-between px-5 py-10 lg:px-8">
        <div />

        <div className="py-10">
          <div className="max-w-4xl" role="group" aria-roledescription="slide" aria-label={`${activeIndex + 1} of ${slides.length}`} aria-live={isPaused ? "polite" : "off"}>
            <div className="mb-5 inline-flex items-center gap-3 text-sm font-semibold text-white">
              <Icon name={activeSlide.icon} className="h-4 w-4 text-[#f0a42f]" />
              {activeSlide.eyebrow}
            </div>

            <h1 className="text-[40px] font-black leading-[1.08]">
              {activeSlide.title}
            </h1>
            <p className="mt-5 w-full text-[15px] leading-8 text-white/80 md:text-lg lg:w-[60%]">
              {activeSlide.text}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-2 sm:flex sm:gap-4">
              <Link
                href={activeSlide.href}
                className="inline-flex h-12 min-w-0 items-center justify-center gap-1 rounded-full bg-[#f0a42f] px-2 text-center text-sm font-semibold leading-tight text-[#07141a] transition hover:bg-[#ffb347] sm:h-auto sm:gap-2 sm:px-6 sm:py-3 sm:font-black"
              >
                <span className="sm:whitespace-nowrap">
                  {activeSlide.ctaLabel ?? <><span className="sr-only sm:not-sr-only">Explore </span>{activeSlide.title}</>}
                </span>
                <Icon name="Arrow" className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 min-w-0 items-center justify-center gap-1 rounded-full border border-white/30 bg-white/10 px-2 text-center text-sm font-semibold leading-tight text-white backdrop-blur transition hover:bg-white/20 sm:h-auto sm:gap-2 sm:px-6 sm:py-3"
              >
                <span className="sm:whitespace-nowrap">Book Consultation</span>
                <Icon name="Arrow" className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Previous service" onClick={() => setActiveIndex(current => (current - 1 + slides.length) % slides.length)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/30 transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f0a42f]">
                <Icon name="Chevron" className="h-4 w-4 rotate-90" />
              </button>
              <button type="button" aria-label="Next service" onClick={() => setActiveIndex(current => (current + 1) % slides.length)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/30 transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f0a42f]">
                <Icon name="Chevron" className="h-4 w-4 -rotate-90" />
              </button>
              <button type="button" data-carousel-playback aria-label={isPaused ? "Resume slideshow" : "Pause slideshow"} onClick={() => setIsPaused(current => !current)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/30 transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f0a42f] motion-reduce:hidden">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
                  {isPaused ? <path d="m8 5 11 7-11 7V5Z" /> : <path d="M6 5h4v14H6V5Zm8 0h4v14h-4V5Z" />}
                </svg>
              </button>
            </div>
            <div className="flex flex-wrap gap-1" aria-label="Choose a service">
              {slides.map((slide, index) => (
                <button key={slide.title} type="button" aria-label={`Show ${slide.title}`} aria-pressed={index === activeIndex} onClick={() => setActiveIndex(index)} className="flex h-8 w-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0a42f]">
                  <span aria-hidden="true" className={`h-2 rounded-full transition-all motion-reduce:transition-none ${index === activeIndex ? "w-5 bg-[#f0a42f]" : "w-2 bg-white/50"}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(([value, label]) => (
              <div key={label} className="border-l border-white/20 pl-4">
                <div className="text-2xl font-black text-[#f0a42f]">{value}</div>
                <div className="mt-1 text-xs font-bold uppercase text-white/70">
                  {label}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
