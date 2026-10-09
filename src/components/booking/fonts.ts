import localFont from "next/font/local";

const inter = localFont({
  src: "../../../public/fonts/web/Inter-Variable.ttf",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--booking-body-font",
});
const fraunces = localFont({
  src: "../../../public/fonts/web/Fraunces-Variable.ttf",
  weight: "100 900",
  style: "normal",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "serif"],
  variable: "--booking-heading-font",
});

export const bookingFonts = `${inter.variable} ${fraunces.variable}`;
