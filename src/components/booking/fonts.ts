import { Fraunces, Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--booking-body-font" });
const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz"], variable: "--booking-heading-font" });

export const bookingFonts = `${inter.variable} ${fraunces.variable}`;
