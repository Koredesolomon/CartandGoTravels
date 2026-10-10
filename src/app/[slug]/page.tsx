import { ACCESS_COOKIE } from "@/lib/payment";
import { getConsularAccessRef, isConsularPaymentRequired } from "@/lib/consularAccess";
import { AboutPage } from "@/components/pages/AboutPage";
import { AiConsularCheckPage } from "@/components/pages/AiConsularCheckPage";
import { ContactPage } from "@/components/pages/ContactPage";
import { FlightBookingPage } from "@/components/pages/FlightBookingPage";
import { CoursesPage } from "@/components/pages/CoursesPage";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { RouteLandingPage } from "@/components/pages/RouteLandingPage";
import { ServicesDirectoryPage } from "@/components/pages/ServicesDirectoryPage";
import { StudyAbroadPage } from "@/components/pages/StudyAbroadPage";
import { ToursPage } from "@/components/pages/ToursPage";
import { VisaPage } from "@/components/pages/VisaPage";
import { WorkVisaPage } from "@/components/pages/WorkVisaPage";
import { routePages, type RouteSlug } from "@/data/site";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    service?: string | string[];
    d?: string | string[];
    payment?: string | string[];
  }>;
};

export function generateStaticParams() {
  return Object.keys(routePages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = routePages[slug as RouteSlug];

  if (!page) {
    return {};
  }

  return {
    title: `${page.eyebrow} | CartandGo Travels`,
    description: page.description,
  };
}

export default async function RoutePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const page = routePages[slug as RouteSlug];

  if (!page) {
    notFound();
  }

  if (slug === "flights") {
    return <FlightBookingPage />;
  }

  if (slug === "visa") {
    return <VisaPage />;
  }

  if (slug === "work-visa") {
    return <WorkVisaPage />;
  }

  if (slug === "about") {
    return <AboutPage />;
  }

  if (slug === "contact") {
    return <ContactPage />;
  }

  if (slug === "ai-consular-check") {
    const cookieStore = await cookies();
    const paymentRequired = isConsularPaymentRequired();
    const initialUnlocked = !paymentRequired || Boolean(getConsularAccessRef(cookieStore.get(ACCESS_COOKIE)?.value));
    const query = await searchParams;
    const paymentStatus = query?.payment === "success" || query?.payment === "failed" ? query.payment : undefined;

    const configuredAmount = Number(process.env.FLUTTERWAVE_AMOUNT ?? "49.99");
    const configuredCurrency = (process.env.FLUTTERWAVE_CURRENCY ?? "USD").toUpperCase();
    return (
      <AiConsularCheckPage
        paymentRequired={paymentRequired}
        initialUnlocked={initialUnlocked}
        paymentStatus={paymentStatus}
        paymentAmount={Number.isFinite(configuredAmount) && configuredAmount > 0 ? configuredAmount : 49.99}
        paymentCurrency={/^[A-Z]{3}$/.test(configuredCurrency) ? configuredCurrency : "USD"}
      />
    );
  }

  if (slug === "courses") {
    return <CoursesPage />;
  }

  if (slug === "services") {
    const query = await searchParams;
    const selectedService = query?.service ?? query?.d;
    const selectedServiceId = Array.isArray(selectedService)
      ? selectedService[0]
      : selectedService;

    return <ServicesDirectoryPage selectedServiceId={selectedServiceId} />;
  }

  if (slug === "study-abroad") {
    return <StudyAbroadPage />;
  }

  if (slug === "tours") {
    return <ToursPage />;
  }

  return <RouteLandingPage page={page} slug={slug as RouteSlug} />;
}
