import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export function FeatureCards() {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-2 lg:px-8">
      <Link
        href="/services"
        className="group rounded-lg border border-[#d7dfe5] bg-white p-10 transition hover:-translate-y-1 hover:shadow-[0_30px_80px_-40px_rgba(0,29,47,.55)]"
      >
        <Icon name="Book" className="h-10 w-10 text-[#e8aa4e]" />
        <h3 className="mt-6 font-serif text-3xl">Online Certifications</h3>
        <p className="mt-3 leading-8 text-[#545f68]">
          Healthcare Assistant, Caregiver, Nanny, Early Childhood, Digital Marketing,
          Forklift, Food Hygiene and more.
        </p>
        <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition group-hover:text-[#e8aa4e]">
          Browse all courses <Icon name="Arrow" className="h-4 w-4" />
        </span>
      </Link>

      <Link
        href="/services"
        className="group rounded-lg bg-[#042c43] p-10 text-[#fcf8f1] transition hover:-translate-y-1 hover:shadow-[0_30px_80px_-40px_rgba(0,29,47,.75)]"
      >
        <Icon name="User" className="h-10 w-10 text-[#e8aa4e]" />
        <h3 className="mt-6 font-serif text-3xl">
          Join our affiliate program and earn with us.
        </h3>
        <p className="mt-3 leading-8 text-white/80">
          Refer travelers, students and visa applicants through a clear partner route
          and earn when qualified bookings move forward.
        </p>
        <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#e8aa4e]">
          Register now <Icon name="Arrow" className="h-4 w-4" />
        </span>
      </Link>
    </section>
  );
}
