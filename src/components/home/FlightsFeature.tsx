import Image from "next/image";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { flightPerks } from "@/data/site";

export function FlightsFeature() {
  return (
    <section className="bg-[#eef7fb]">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8">
      <div className="order-2 lg:order-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e8aa4e]">
          Flights
        </p>
        <h2 className="mt-3 font-serif text-4xl md:text-5xl">
          Book cheap flights with CartandGo.
        </h2>
        <p className="mt-5 leading-8 text-[#545f68]">
          For local and international destinations, we search flexible fares, promo
          windows and sensible hotel options so your trip starts with a better plan.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
          {flightPerks.map(([title, text]) => (
            <div key={title} className="rounded-lg bg-[#e5f1f7] p-5">
              <div className="font-serif text-lg">{title}</div>
              <div className="mt-1 text-xs leading-5 text-[#545f68]">{text}</div>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <ButtonLink href="/services?service=flights#flights" variant="dark">
            Book now
          </ButtonLink>
        </div>
      </div>
      <Image
        src="/assets/hotel.jpg"
        alt="Luxury infinity pool at sunset"
        width={1280}
        height={960}
        className="order-1 aspect-[4/3] w-full rounded-lg object-cover shadow-[0_30px_80px_-30px_rgba(0,29,47,.45)] lg:order-2"
      />
      </div>
    </section>
  );
}
