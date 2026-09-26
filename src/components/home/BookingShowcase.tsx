import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const searchFields = [
  ["Enter Destination", "Istanbul, Turkey", "Search"],
  ["Check In", "Fri 12/2", "Calendar"],
  ["Check Out", "Sun 12/4", "Calendar"],
  ["Rooms & Guests", "1 room, 2 guests", "Users"],
] as const;

const filters = [
  ["Free breakfast", true],
  ["Free parking", false],
  ["Airport shuttle", false],
  ["Free cancellation", true],
] as const;

const hotels = [
  {
    name: "CVK Park Bosphorus Hotel Istanbul",
    address: "Gumussuyu Mah. Inonu Cad. No:8, Istanbul",
    price: "$240",
    reviews: "371 reviews",
    image: "/assets/hotel.jpg",
  },
  {
    name: "Eresin Hotels Sultanahmet",
    address: "Kucukayasofya No. 40 Sultanahmet, Istanbul",
    price: "$104",
    reviews: "54 reviews",
    image: "/assets/hero-travel.jpg",
  },
  {
    name: "CartandGo Partner Stay",
    address: "Blue coast district, Lagos consultation route",
    price: "$180",
    reviews: "92 reviews",
    image: "/assets/visa-passport.jpg",
  },
] as const;

const flightCards = [
  ["12:00 pm", "01:28 pm", "Emirates", "EWR-BNA"],
  ["09:35 am", "04:20 pm", "Qatar Airways", "LOS-LHR"],
] as const;

function SearchField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="min-w-0 rounded-md border border-[#b9c8d0] bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon name={icon} className="h-4 w-4 shrink-0 text-[#0098ba]" />
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-[#5b6870]">{label}</div>
          <div className="truncate text-sm font-semibold text-[#07141a]">{value}</div>
        </div>
      </div>
    </div>
  );
}

function HotelCard({ hotel }: { hotel: (typeof hotels)[number] }) {
  return (
    <article className="overflow-hidden rounded-lg border border-[#d9e2e8] bg-white shadow-[0_24px_80px_-48px_rgba(1,24,34,.55)] md:grid md:grid-cols-[240px_1fr]">
      <div className="relative min-h-[210px]">
        <Image src={hotel.image} alt="" fill sizes="(min-width: 768px) 240px, 100vw" className="object-cover" />
        <div className="absolute right-3 top-3 rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#07141a]">
          9 images
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-5 p-5">
        <div className="flex gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold leading-snug text-[#07141a]">{hotel.name}</h3>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-[#5b6870]">
              <Icon name="Location" className="h-3.5 w-3.5 text-[#0098ba]" />
              <span className="truncate">{hotel.address}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold">
              <span className="flex text-[#f0a42f]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Icon key={index} name="Star" className="h-3.5 w-3.5 fill-current" />
                ))}
              </span>
              <span className="flex items-center gap-1 text-[#07141a]">
                <Icon name="Bed" className="h-3.5 w-3.5 text-[#0098ba]" />
                20+ amenities
              </span>
            </div>
          </div>
          <div className="w-20 text-right">
            <div className="text-[11px] text-[#5b6870]">starting from</div>
            <div className="text-xl font-black text-[#f0a42f]">{hotel.price}</div>
            <div className="text-[11px] text-[#5b6870]">/night</div>
          </div>
        </div>
        <div className="mt-auto border-t border-[#e5edf2] pt-4">
          <div className="mb-4 flex items-center gap-2 text-xs">
            <span className="rounded border border-[#0098ba] px-2 py-1 font-semibold text-[#07141a]">4.2</span>
            <span className="font-semibold">Very Good</span>
            <span className="text-[#5b6870]">{hotel.reviews}</span>
          </div>
          <div className="grid grid-cols-[44px_1fr] gap-3">
            <button className="inline-flex h-11 items-center justify-center rounded-md border border-[#f0a42f] text-[#07141a]" aria-label="Save hotel">
              <Icon name="Heart" className="h-4 w-4" />
            </button>
            <Link href="/services?service=hotel-booking#hotel-booking" className="inline-flex h-11 items-center justify-center rounded-md bg-[#f0a42f] px-4 text-sm font-black text-[#07141a] transition hover:bg-[#ffb347]">
              View Place
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function BookingShowcase() {
  return (
    <section className="bg-[#f6fbfd]">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase text-[#0098ba]">
              Fares, stays and visa planning
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-[#07141a] md:text-5xl">
              Search like a traveler. Book with a real team behind you.
            </h2>
          </div>
          <Link href="/contact" className="inline-flex w-fit items-center gap-2 rounded-md bg-[#07141a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0098ba]">
            Start a trip request <Icon name="Arrow" className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-lg border border-[#d9e2e8] bg-white p-4 shadow-[0_28px_90px_-55px_rgba(1,24,34,.75)] lg:p-6">
          <div className="grid gap-3 lg:grid-cols-[1.1fr_.78fr_.78fr_.85fr_56px]">
            {searchFields.map(([label, value, icon]) => (
              <SearchField key={label} label={label} value={value} icon={icon} />
            ))}
            <button className="inline-flex h-[58px] items-center justify-center rounded-md bg-[#0098ba] text-white transition hover:bg-[#047d99]" aria-label="Search trips">
              <Icon name="Search" />
            </button>
          </div>
        </div>

        <div className="mt-9 grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-lg border border-[#d9e2e8] bg-white p-6 lg:sticky lg:top-28 lg:self-start">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#07141a]">Filters</h3>
              <Icon name="Filter" className="h-4 w-4 text-[#0098ba]" />
            </div>
            <div className="mt-8 border-b border-[#d9e2e8] pb-7">
              <div className="mb-4 flex items-center justify-between text-sm font-bold">
                <span>Price</span>
                <Icon name="Chevron" className="h-4 w-4" />
              </div>
              <div className="relative h-6">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[#07141a]/25" />
                <div className="absolute left-[12%] right-[18%] top-1/2 h-0.5 bg-[#0098ba]" />
                <span className="absolute left-[10%] top-0 h-5 w-5 rounded-full bg-[#0098ba]" />
                <span className="absolute right-[15%] top-0 h-5 w-5 rounded-full bg-[#0098ba]" />
              </div>
              <div className="mt-2 flex justify-between text-xs font-semibold">
                <span>$50</span>
                <span>$1200</span>
              </div>
            </div>
            <div className="border-b border-[#d9e2e8] py-7">
              <div className="mb-4 text-sm font-bold">Rating</div>
              <div className="flex flex-wrap gap-2">
                {["0+", "1+", "2+", "3+", "4+"].map((rating) => (
                  <button key={rating} className="h-8 rounded border border-[#0098ba] px-3 text-xs font-bold text-[#07141a]">
                    {rating}
                  </button>
                ))}
              </div>
            </div>
            <div className="py-7">
              <div className="mb-4 text-sm font-bold">Freebies</div>
              <div className="space-y-3">
                {filters.map(([label, checked]) => (
                  <label key={label} className="flex items-center gap-3 text-sm text-[#39464d]">
                    <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border ${checked ? "border-[#0098ba] bg-[#0098ba] text-white" : "border-[#8899a3]"}`}>
                      {checked ? <Icon name="Check" className="h-3 w-3" /> : null}
                    </span>
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="overflow-hidden rounded-lg border border-[#d9e2e8] bg-white">
              <div className="grid divide-y divide-[#d9e2e8] md:grid-cols-3 md:divide-x md:divide-y-0">
                {[
                  ["Hotels", "257 places"],
                  ["Motels", "51 places"],
                  ["Resorts", "72 places"],
                ].map(([title, count], index) => (
                  <button key={title} className={`px-6 py-5 text-left ${index === 0 ? "border-b-2 border-[#f0a42f]" : ""}`}>
                    <div className="font-black text-[#07141a]">{title}</div>
                    <div className="mt-1 text-xs text-[#5b6870]">{count}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="font-medium text-[#5b6870]">
                Showing <span className="font-black text-[#07141a]">4</span> of 257 places
              </p>
              <button className="inline-flex items-center gap-1 font-bold text-[#07141a]">
                Sort by Recommended <Icon name="Chevron" className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {hotels.map((hotel) => (
                <HotelCard key={hotel.name} hotel={hotel} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {flightCards.map(([depart, arrive, airline, route]) => (
            <article key={`${airline}-${route}`} className="rounded-lg border border-[#d9e2e8] bg-[#07141a] p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase text-[#f0a42f]">Flight option</div>
                  <div className="mt-3 text-xl font-black">{depart} - {arrive}</div>
                  <div className="mt-1 text-sm text-white/70">{airline}</div>
                </div>
                <div className="rounded-md bg-white/10 px-3 py-2 text-right">
                  <div className="text-sm font-black">2h 28m</div>
                  <div className="text-xs text-white/65">{route}</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-[44px_1fr] gap-3">
                <button className="inline-flex h-11 items-center justify-center rounded-md border border-white/25" aria-label="Save flight">
                  <Icon name="Heart" className="h-4 w-4" />
                </button>
                <Link href="/services?service=flights#flights" className="inline-flex h-11 items-center justify-center rounded-md bg-[#f0a42f] px-4 text-sm font-black text-[#07141a]">
                  View flight details
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
