import type { ReactNode } from "react";
import localFont from "next/font/local";

const fraunces = localFont({
  src: "../../../public/fonts/web/Fraunces-Variable.ttf",
  weight: "100 900",
  style: "normal",
  variable: "--font-fraunces",
  display: "swap",
});

export default function BlogLayout({ children }: { children: ReactNode }) {
  return <div className={`${fraunces.variable} bg-[#f8f7f5]`}>{children}</div>;
}
