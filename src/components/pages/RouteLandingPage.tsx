import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";
import { routePageDetails, type routePages, type RouteSlug } from "@/data/site";

type RoutePage = (typeof routePages)[keyof typeof routePages];
type DetailSlug = keyof typeof routePageDetails;

type RouteLandingPageProps = {
  page: RoutePage;
  slug: RouteSlug;
};

export function RouteLandingPage({ page, slug }: RouteLandingPageProps) {
  const detail = routePageDetails[slug as DetailSlug];

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#050505] py-20 text-[#fcf8f1] md:py-28">
        <Image
          src={page.image}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-35"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(5,5,5,.96),rgba(0,60,78,.82),rgba(0,152,186,.18))]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-[#f0a42f] text-[#07141a]">
              <Icon name={page.icon} />
            </div>
            <p className="mt-8 text-xs font-bold uppercase text-[#f0a42f]">
              {page.eyebrow}
            </p>
            <h1 className="mt-4 text-5xl font-black leading-[1.04] md:text-7xl">
              {page.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
              {page.description}
            </p>
            <div className="mt-10">
              <ButtonLink href="/contact">{page.cta}</ButtonLink>
            </div>
          </div>

          <div className="rounded-lg border border-white/15 bg-white p-5 text-[#07141a] shadow-[0_30px_90px_-45px_rgba(0,0,0,.85)]">
            <div className="rounded-md bg-[#001ee8] p-5 text-white">
              <div className="text-xs font-black uppercase text-[#04f1f1]">
                CartandGo guide
              </div>
              <h2 className="mt-3 text-3xl font-black leading-tight">
                {detail?.badge ?? "Clear support for your next step."}
              </h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {page.bullets.map((item) => (
                <div key={item} className="rounded-md bg-[#04f1f1]/20 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-black">
                    <span className="h-2 w-2 rotate-45 bg-[#f00000]" />
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f6fbfd]">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-bold uppercase text-[#0098ba]">What you get</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-[#07141a] md:text-5xl">
              Practical support, organized into clear next steps.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {detail?.cards.map(([title, text, icon]) => (
              <Link
                href="/contact"
                key={title}
                className="group rounded-lg border border-[#d9e2e8] bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_30px_90px_-55px_rgba(1,24,34,.7)]"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-[#e8f6fb] text-[#0098ba] transition group-hover:bg-[#f0a42f] group-hover:text-[#07141a]">
                  <Icon name={icon} />
                </div>
                <h3 className="mt-5 text-xl font-black text-[#07141a]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5b6870]">{text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase text-[#0098ba]">How it works</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-[#07141a]">
            A simple process keeps decisions moving.
          </h2>
          <p className="mt-5 leading-8 text-[#5b6870]">{detail?.note}</p>
          <div className="mt-8">
            <ButtonLink href="/contact" variant="dark">
              {page.cta}
            </ButtonLink>
          </div>
        </div>

        <div className="rounded-lg border border-[#d9e2e8] bg-white p-6">
          <div className="space-y-4">
            {detail?.steps.map((step, index) => (
              <div
                key={step}
                className="grid grid-cols-[48px_1fr] gap-4 rounded-md bg-[#f6fbfd] p-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#0098ba] text-sm font-black text-white">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="font-black text-[#07141a]">{step}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#5b6870]">
                    CartandGo keeps this stage documented, reviewed and connected to
                    the next action.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#07141a] px-5 py-16 text-white lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-lg bg-[#001ee8] p-6 md:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase text-[#04f1f1]">
              {detail?.noteTitle}
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight md:text-4xl">
              Get guidance before major payments, submissions or bookings.
            </h2>
          </div>
          <Link
            href="/contact"
            className="inline-flex h-12 items-center justify-center rounded-md bg-[#f0a42f] px-6 text-sm font-black text-[#07141a]"
          >
            Contact CartandGo
          </Link>
        </div>
      </section>
    </>
  );
}
