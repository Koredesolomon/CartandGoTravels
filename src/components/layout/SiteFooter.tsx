import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  ["Visa Services", "/services?service=visa-assistance#visa-assistance"],
  ["Flights & Hotels", "/services?service=flights#flights"],
  ["Online Courses", "/services"],
  ["Scholarships", "/services"],
  ["About Us", "/about"],
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-[#042c43] text-[#fcf8f1]">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/logo.jpg"
              alt="CartandGo Travels"
              width={44}
              height={44}
              className="h-11 w-11 rounded-lg object-cover"
            />
            <span className="font-serif text-xl">
              Cart<span className="text-[#e8aa4e]">&amp;</span>Go{" "}
              <span className="text-[#e8aa4e]">Travels</span>
            </span>
          </div>
          <p className="max-w-md text-sm leading-7 text-white/70">
            Visa processing, immigration, flights, hotels, certified online courses,
            and global scholarships under one roof.
          </p>
        </div>

        <div>
          <h4 className="mb-4 font-serif text-lg text-[#e8aa4e]">About Us</h4>
          <ul className="space-y-2 text-sm text-white/80">
            {footerLinks.map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-serif text-lg text-[#e8aa4e]">Customer Support</h4>
          <ul className="space-y-3 text-sm text-white/80">
            <li>
              <a
                href="mailto:visaofficer@cartandgotravels.com"
                className="break-all hover:text-white"
              >
                visaofficer@cartandgotravels.com
              </a>
            </li>
            <li>
              <a href="https://wa.me/2348073231272" className="hover:text-white">
                +234 807 323 1272
              </a>
            </li>
            <li>
              <a href="https://wa.me/13474200238" className="hover:text-white">
                +1 (347) 420-0238
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-serif text-lg text-[#e8aa4e]">Visit Us</h4>
          <ul className="space-y-3 text-sm leading-6 text-white/80">
            <li>Lagos consultations by appointment.</li>
            <li>Remote advisory for clients in Nigeria, the US and beyond.</li>
            <li>
              <Link href="/contact" className="font-semibold text-[#e8aa4e] hover:text-white">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-5 py-6 text-xs text-white/60 md:flex-row lg:px-8">
          <p>2026 CartandGo Travels. All rights reserved.</p>
          <p>Crafted for the modern traveler.</p>
        </div>
      </div>
    </footer>
  );
}
