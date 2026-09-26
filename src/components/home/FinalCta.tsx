import { travelPartners } from "@/data/site";

export function FinalCta() {
  return (
    <section className="bg-white px-5 py-18 lg:px-8">
      <div className="mx-auto max-w-7xl text-center">
        <h2 className="font-serif text-4xl md:text-5xl">Our travel partners</h2>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {travelPartners.map((partner) => (
            <div
              key={partner}
              className="flex min-h-20 items-center justify-center rounded-lg border border-[#d7dfe5] bg-[#f9fcff] px-3 text-center text-sm font-semibold text-[#07324a]"
            >
              {partner}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
