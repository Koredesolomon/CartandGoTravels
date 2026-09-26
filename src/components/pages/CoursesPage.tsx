import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";

const trainings = [
  {
    name: "Healthcare (Nursing & Allied Health)",
    desc: "Bridging and certification programmes targeting the UK, Canada and Gulf markets.",
    icon: "Care",
  },
  {
    name: "Caregiving",
    desc: "Certified caregiver training aligned to caregiver visa streams in Canada and the Gulf.",
    icon: "Heart",
  },
  {
    name: "Social Work",
    desc: "Accredited coursework and portfolio support for registration abroad.",
    icon: "Users",
  },
  {
    name: "Personal Support Work",
    desc: "Recognised PSW pathways feeding into Canada's in-demand care occupations.",
    icon: "Shield",
  },
  {
    name: "Truck Driving",
    desc: "Commercial driving certification and licence-conversion guidance for eligible markets.",
    icon: "Briefcase",
  },
  {
    name: "Forklift & Crane Operation",
    desc: "Certified operator training recognised by warehousing and construction employers.",
    icon: "Check",
  },
] as const;

export function CoursesPage() {
  return (
    <section className="bg-[#fbf8f2]">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl font-semibold text-[#0f1e3d] md:text-5xl">
              Training &amp; Certification
            </h1>
            <p className="mt-4 text-base leading-8 text-[#5a5f6b]">
              Internationally recognised certification pathways, often paired
              with a matching work, study or relocation plan.
            </p>
          </div>
          <ButtonLink href="/contact" variant="dark">
            Enquire
          </ButtonLink>
        </div>

        <div className="grid gap-[22px] md:grid-cols-2 lg:grid-cols-3">
          {trainings.map((training) => (
            <article
              key={training.name}
              className="flex flex-col gap-2.5 rounded border border-[#e2dacb] bg-white p-6"
            >
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded bg-[#dff4f5] text-[#0f1e3d]">
                <Icon name={training.icon} />
              </div>
              <span className="text-[11.5px] font-bold text-[#c68a2e]">
                Certification
              </span>
              <h2 className="font-serif text-[18.5px] font-semibold text-[#0f1e3d]">
                {training.name}
              </h2>
              <p className="mb-1 text-[14.5px] leading-6 text-[#5a5f6b]">
                {training.desc}
              </p>
              <div className="mt-auto pt-2.5">
                <ButtonLink href="/contact" variant="dark">
                  Enquire
                </ButtonLink>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
