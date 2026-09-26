import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { visaOffers } from "@/data/site";

export function ServicesGrid() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e8aa4e]">
            Visa Applications
          </p>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl">
            Popular visa support, organized clearly.
          </h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {visaOffers.map((offer) => (
            <Link
              key={offer.country}
              href={offer.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group overflow-hidden rounded-lg border border-[#d7dfe5] bg-white shadow-[0_20px_70px_-45px_rgba(0,29,47,.55)] transition hover:-translate-y-1"
            >
              <Image
                src={offer.image}
                alt=""
                width={900}
                height={620}
                className="h-52 w-full object-cover"
              />
              <div className="p-7">
                <h3 className="font-serif text-2xl text-[#07324a]">{offer.country}</h3>
                <p className="mt-3 min-h-24 text-sm leading-7 text-[#545f68]">
                  {offer.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#e8aa4e] px-4 py-2 text-sm font-semibold text-[#05131d]">
                  Apply Now <Icon name="Arrow" className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/services?service=visa-assistance#visa-assistance"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#07324a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0098ba]"
          >
            Request another visa type <Icon name="Arrow" className="h-4 w-4" />
          </Link>
        </div>
      </div>

    </section>
  );
}
