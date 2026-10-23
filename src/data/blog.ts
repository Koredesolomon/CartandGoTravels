// Blog content. Inline markup in strings: [label](/internal-path) becomes a link.
// To add a post, append to `blogPosts`; routes, sitemap, JSON-LD and the index pick it up.

export const BLOG_SITE_URL = "https://www.cartandgotravels.com";

export type BlogCategory = "Study" | "Tours" | "Visa Tips";

export const blogCategories: BlogCategory[] = ["Study", "Tours", "Visa Tips"];

export type BlogSection = {
  id: string;
  heading: string;
  paragraphs?: string[];
  list?: string[];
};

export type BlogPost = {
  slug: string;
  category: BlogCategory;
  title: string;
  /** Meta description, aim for 120-160 characters. */
  metaDescription: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  datePublished: string;
  dateModified: string;
  readMinutes: number;
  takeaways: string[];
  sections: BlogSection[];
  faq: { question: string; answer: string }[];
  related: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "canada-study-permit-nigeria-guide",
    category: "Study",
    title: "Canada Study Permit from Nigeria: Documents & Funds Guide",
    metaDescription:
      "Everything Nigerian applicants need for a Canada study permit: LOA, PAL, proof of funds, statement of account tips, biometrics and realistic timelines.",
    excerpt:
      "The documents, funding evidence and timelines Nigerian applicants should prepare, and the mistakes that cause refusals.",
    image: "/assets/service-study-abroad.png",
    imageAlt: "Student preparing documents for a Canada study permit",
    datePublished: "2026-10-12",
    dateModified: "2026-10-22",
    readMinutes: 6,
    takeaways: [
      "Get your Letter of Acceptance first, then check whether a Provincial Attestation Letter (PAL) applies to your programme.",
      "Submit a complete statement of account, not screenshots.",
      "Check IRCC's live processing-time tool before you plan your start date.",
    ],
    sections: [
      {
        id: "what-you-need",
        heading: "What you need before you apply",
        list: [
          "Letter of Acceptance (LOA) from a Designated Learning Institution",
          "Provincial Attestation Letter (PAL), where required",
          "Valid passport (6+ months)",
          "Proof of funds for tuition and living costs (GIC or bank statements)",
          "English or French test result, and a clear Statement of Purpose",
          "Biometrics, and a medical exam where required",
        ],
      },
      {
        id: "proof-of-funds",
        heading: "Proof of funds that officers trust",
        paragraphs: [
          "Officers read a statement of account as a story: who owns the account, how long money has been there, and where it came from. Show the full period with the account name and number on every page, and keep deposits traceable to salary, business income or a documented sponsor.",
          "Not sure how yours reads? [Run a private pre-assessment](/ai-consular-check) before you submit anything.",
        ],
      },
      {
        id: "how-long",
        heading: "How long does it take?",
        paragraphs: [
          "Processing times change month to month and vary by where you apply from. Recent Nigeria-based applications have taken from several weeks to a few months, so always check the live IRCC tool and apply early. See our [study abroad requirements](/study-abroad).",
        ],
      },
    ],
    faq: [
      {
        question: "Do I need a Provincial Attestation Letter?",
        answer:
          "Many study permit applications now need one, with some exemptions. Confirm for your programme and level of study.",
      },
      {
        question: "Can I upload a screenshot of my balance?",
        answer:
          "Officers expect full statements from your bank covering the required period. A screenshot rarely proves source or history.",
      },
    ],
    related: ["lump-sum-deposit-proof-of-funds", "visa-free-holiday-destinations-nigerian-passport"],
  },
  {
    slug: "visa-free-holiday-destinations-nigerian-passport",
    category: "Tours",
    title: "Visa-Free & Visa-on-Arrival Holidays for Nigerian Passports",
    metaDescription:
      "A practical guide to holiday destinations Nigerian passport holders can visit without a prior visa or with visa on arrival, plus what to carry and check.",
    excerpt:
      "Where Nigerian passport holders can travel with no visa or a visa on arrival, and the destinations that need extra planning.",
    image: "/assets/service-tours-vacations.png",
    imageAlt: "Tropical beach holiday destination",
    datePublished: "2026-10-09",
    dateModified: "2026-10-22",
    readMinutes: 5,
    takeaways: [
      "Visa-free still means a return ticket, accommodation and proof of funds.",
      "Kenya is visa-free but needs an eTA registration before you fly.",
      "Always confirm rules with the destination's immigration authority, as they change.",
    ],
    sections: [
      {
        id: "visa-free",
        heading: "Visa-free: Barbados, Dominica, Fiji and Cape Verde",
        paragraphs: [
          "Barbados and Dominica currently allow stays of up to six months and Fiji up to four months for Nigerian passport holders. Cape Verde is also visa-free, with a shorter stay that you should confirm before booking.",
        ],
      },
      {
        id: "visa-on-arrival",
        heading: "Visa on arrival or eTA",
        list: [
          "Maldives: free visa on arrival, up to 30 days",
          "Mauritius: visa on arrival, up to about two weeks",
          "Kenya: no visa, but register for the eTA before travel (up to 60 days)",
          "Rwanda: eVisa or visa on arrival, up to 30 days",
        ],
      },
      {
        id: "plan-carefully",
        heading: "Destinations to plan carefully",
        paragraphs: [
          "Seychelles has restricted holiday visas for Nigerian applicants since 2023, so get written eligibility confirmation first. South Africa's eVisa is limited to arrival via Johannesburg, so direct Cape Town flights need a standard VFS application. Browse our [tour packages](/tours) with visa notes on every destination.",
        ],
      },
    ],
    faq: [
      {
        question: "Is visa-free the same as no paperwork?",
        answer:
          "No. Airlines and border officers still check your passport validity, return ticket, accommodation and funds.",
      },
      {
        question: "How current is this list?",
        answer: "Policies change without notice. Verify with the official immigration authority before booking.",
      },
    ],
    related: ["canada-study-permit-nigeria-guide", "lump-sum-deposit-proof-of-funds"],
  },
  {
    slug: "lump-sum-deposit-proof-of-funds",
    category: "Visa Tips",
    title: "Lump-Sum Deposits: The Proof-of-Funds Mistake to Avoid",
    metaDescription:
      "Why sudden large deposits trigger visa refusals, how officers read bank statements, and how to document your source of funds honestly before you apply.",
    excerpt:
      "A sudden large deposit is one of the most common refusal triggers. Here is how to present genuine funds the right way.",
    image: "/assets/service-proof-of-funds.png",
    imageAlt: "Bank statement and documents for a visa application",
    datePublished: "2026-10-05",
    dateModified: "2026-10-22",
    readMinutes: 5,
    takeaways: [
      "Officers look for history, not just a balance.",
      "Document the source of every large deposit.",
      "Never borrow, fabricate or inflate funds. Misrepresentation can lead to long bans.",
    ],
    sections: [
      {
        id: "why-flagged",
        heading: "Why officers flag lump sums",
        paragraphs: [
          "A large cash deposit weeks before you apply, with no matching income pattern, looks like funds placed only to pass the check. It does not prove you can sustain yourself or that the money is yours.",
        ],
      },
      {
        id: "strong-evidence",
        heading: "What strong evidence looks like",
        list: [
          "Months of recurring salary or business income",
          "Full statements with name and account number on each page",
          "A short letter and documents explaining any large deposit (sale agreement, invoice, employer letter)",
          "A documented sponsor affidavit with the sponsor's own proof of income",
        ],
      },
      {
        id: "legitimate-lump-sum",
        heading: "If you have a legitimate lump sum",
        paragraphs: [
          "Keep the paper trail and explain it upfront. Can't save the full amount yet? Our [services](/services) include a Pay Small Small plan to help you build funds over time, and our [AI Consular check](/ai-consular-check) flags weak spots before an officer does.",
        ],
      },
    ],
    faq: [
      {
        question: "Can I borrow money to show funds?",
        answer:
          "Borrowed or gifted funds need clear documentation and are scrutinised. Never fabricate documents or misstate where money came from.",
      },
      {
        question: "How many months of statements do I need?",
        answer:
          "It depends on the visa and country, commonly three to six months. Check the destination's checklist.",
      },
    ],
    related: ["canada-study-permit-nigeria-guide", "visa-free-holiday-destinations-nigerian-passport"],
  },
];

export function getPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function postUrl(slug: string) {
  return `${BLOG_SITE_URL}/blog/${slug}`;
}

export function formatPostDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatPostDateShort(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
