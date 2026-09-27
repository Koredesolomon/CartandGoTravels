import { AboutPage } from "@/components/pages/AboutPage";
import { AiConsularCheckPage } from "@/components/pages/AiConsularCheckPage";
import { ContactPage } from "@/components/pages/ContactPage";
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
    return <ServicesDirectoryPage selectedServiceId="flights" />;
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
    const initialUnlocked = Boolean(cookieStore.get("ai_consular_unlocked")?.value);

    return <AiConsularCheckPage initialUnlocked={initialUnlocked} />;
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
