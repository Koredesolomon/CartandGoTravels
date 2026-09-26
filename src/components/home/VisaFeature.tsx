import Image from "next/image";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";

const bullets = [
  "Work, study and visit visa applications",
  "Biometrics and medical scheduling",
  "Travel insurance compliant with embassies",
  "Document review and translation support",
];

export function VisaFeature() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8">
      <div className="relative">
        <Image
          src="/assets/visa-passport.jpg"
          alt="Passport and visa documents"
          width={1280}
          height={960}
          className="aspect-[4/3] w-full rounded-lg object-cover shadow-[0_30px_80px_-30px_rgba(0,29,47,.45)]"
        />
        <div className="absolute -bottom-6 -right-4 hidden rounded-lg border border-[#d7dfe5] bg-white p-5 shadow-[0_10px_40px_-15px_rgba(0,29,47,.18)] md:block">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f3b94c,#df8f48)] text-[#042c43]">
              <Icon name="Shield" className="h-4 w-4" />
            </div>
            <div>
              <div className="font-serif text-lg">95% approval</div>
              <div className="text-xs text-[#545f68]">Backed by 7 years of expertise</div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e8aa4e]">
          Visa Refusals
        </p>
        <h2 className="mt-3 font-serif text-4xl md:text-5xl">
          One refusal is enough. Get the next attempt right.
        </h2>
        <p className="mt-5 leading-8 text-[#545f68]">
          Our case officers review refusal notes, rebuild document strategy and help
          you present a clearer application. First-time applicants also get the same
          careful guidance before avoidable mistakes happen.
        </p>
        <ul className="mt-8 space-y-3 text-sm">
          {bullets.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e8aa4e]" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <ButtonLink href="/contact" variant="dark">
            Book a consultation today
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
