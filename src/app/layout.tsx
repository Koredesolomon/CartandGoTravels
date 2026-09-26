import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist_Mono, Poppins } from "next/font/google";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cartandgotravels.com"),
  title: {
    default: "CartandGo Travels | Visa, Flights, Hotels and Study Abroad Support",
    template: "%s | CartandGo Travels",
  },
  description:
    "Visa support, flights, hotels, tours, online courses, student funding and scholarships for modern travelers.",
  openGraph: {
    title: "CartandGo Travels",
    description:
      "Visa support, flights, hotels, tours, online courses, student funding and scholarships for modern travelers.",
    url: "https://www.cartandgotravels.com",
    siteName: "CartandGo Travels",
    images: [
      {
        url: "/assets/hero-travel.jpg",
        width: 1280,
        height: 960,
        alt: "CartandGo Travels",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CartandGo Travels",
    description:
      "Visa support, flights, hotels, tours, online courses, student funding and scholarships for modern travelers.",
    images: ["/assets/hero-travel.jpg"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f9fcff] text-[#05131d]">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <WhatsAppFloat />
        </div>
      </body>
    </html>
  );
}
