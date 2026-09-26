import Image from "next/image";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";
import { studyOptions } from "@/data/site";

export function ScholarshipBand() {
  return (
    <section className="relative isolate overflow-hidden bg-[#042c43] py-20 text-[#fcf8f1]">
      <Image
        src="/assets/scholarship.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,29,47,.9),rgba(0,58,72,.62))]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-8">
        <div>
          <Icon name="Globe" className="h-10 w-10 text-[#e8aa4e]" />
          <h2 className="mt-6 font-serif text-4xl md:text-5xl">
            Study & relocation services.
          </h2>
          <p className="mt-5 max-w-lg leading-8 text-white/80">
            Discover affordable international study options, scholarship routes and
            flexible pathways that can support work, family and future relocation.
          </p>
          <div className="mt-8">
            <ButtonLink href="/services?service=study-football-mobility-pathway#study-football-mobility-pathway">View relocation options</ButtonLink>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {studyOptions.map(([label, title]) => (
            <div key={title} className="rounded-lg border border-white/15 bg-white/5 p-5 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.18em] text-[#e8aa4e]">
                {label}
              </div>
              <div className="mt-2 font-serif text-xl">{title}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
