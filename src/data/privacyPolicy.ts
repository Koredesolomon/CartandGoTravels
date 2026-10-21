// Inline markup: **bold**, [[placeholder that still needs a real value]].
export type PolicyBlock =
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] };

export type PolicySection = {
  id: string;
  title: string;
  blocks: PolicyBlock[];
};

export const privacyPolicyMeta = {
  lastUpdated: "21 October 2026",
};

export const privacyPolicySections: PolicySection[] = [
  {
    id: "introduction",
    title: "1. Introduction & Our Commitment to You",
    blocks: [
      {
        type: "p",
        text: "CartandGo Travels (“CartandGo”, “we”, “us”, “our”) is a dual-pathway platform that combines academic study abroad with elite football pathways for international students and players. We also provide visa assistance, flights, hotels, tours, insurance and related relocation services.",
      },
      {
        type: "p",
        text: "This Privacy Policy explains what personal data we collect, why we collect it, who we share it with, how we protect it, and the rights you have over it. Where we can say something in plain language, we do.",
      },
      { type: "h3", text: "1.1 Who this policy protects" },
      {
        type: "ul",
        items: [
          "**General website users** who browse our pages, use our tools or contact us.",
          "**Booking customers** who request flights, hotels, tours or other travel packages.",
          "**Academic applicants** applying to schools, colleges and universities through us.",
          "**Football pathway applicants**, including players, student-athletes and their parents or legal guardians.",
          "**Users of our AI-assisted document tools** (such as the Consular Check).",
        ],
      },
      { type: "h3", text: "1.2 Our Standalone Safety Promise" },
      {
        type: "p",
        text: "Applicant data is the most sensitive information we hold, so we treat it differently from everything else. Your academic history, athletic statistics, sporting CV, passport and immigration documents are **ring-fenced**:",
      },
      {
        type: "ul",
        items: [
          "**Held in a dedicated Applicant Vault.** Stored in a separate, access-controlled environment, logically isolated from our marketing, analytics and booking systems.",
          "**Need-to-know access only.** Only staff directly handling your application can open your file, and every access is logged and reviewable.",
          "**Never repurposed.** We never use applicant data to advertise other products to you without your separate, explicit opt-in.",
          "**Shared only on your instruction.** Your file goes to an institution, academy or club only for the application you have asked us to make.",
          "**Never sold.** Not now, not ever, and not to anyone.",
          "**Encrypted and time-limited.** Vault data is encrypted in transit and at rest, and deleted when no longer needed (see Section 6).",
        ],
      },
      { type: "h3", text: "1.3 Privacy at a glance" },
      {
        type: "ul",
        items: [
          "We collect only what we need to run your application, booking or enquiry.",
          "We do **not** sell your personal data, and we do not “share” it for cross-context behavioural advertising.",
          "Booking partners receive only what is required to issue tickets and secure your reservations.",
          "Card details are handled by PCI-DSS-compliant payment providers; we do not store full card numbers.",
          "You can access, correct, delete or take a copy of your data at any time (Section 7).",
          "If you are under 18, a parent or guardian must support your application (Section 2.6).",
        ],
      },
      { type: "h3", text: "1.4 Who is responsible for your data" },
      {
        type: "p",
        text: "CartandGo Travels, Yaba, Lagos, Nigeria, is the data controller for the personal data described in this policy. We apply the standards of the laws that protect our users wherever they live, including:",
      },
      {
        type: "ul",
        items: [
          "the **Nigeria Data Protection Act 2023** (NDPA);",
          "the **EU General Data Protection Regulation** (GDPR) and the **UK GDPR** with the **Data Protection Act 2018**;",
          "the **California Consumer Privacy Act**, as amended by the California Privacy Rights Act (CCPA/CPRA); and",
          "other applicable laws, such as Canada’s PIPEDA and Australia’s Privacy Act, for applicants in those countries.",
        ],
      },
      {
        type: "p",
        text: "Where these laws differ, we apply the standard that gives you the greater protection.",
      },
    ],
  },
  {
    id: "information-we-collect",
    title: "2. What Information We Collect",
    blocks: [
      {
        type: "p",
        text: "We collect information that you give us, that is created when you use our services, and that we receive from partners acting on your instructions.",
      },
      { type: "h3", text: "2.1 Personal Identification Data" },
      {
        type: "ul",
        items: [
          "Full name, date of birth, nationality and gender (where required by an institution, club or venue)",
          "Passport details and photo-page copy, national ID and emergency contacts",
          "Email address, telephone and WhatsApp number, postal address",
          "Parent or guardian details for applicants under 18",
          "Account log-in credentials (stored using salted hashing, never in plain text)",
        ],
      },
      { type: "h3", text: "2.2 Study & Football Pathway Application Data" },
      {
        type: "ul",
        items: [
          "Academic transcripts, certificates, references and language-test results",
          "Statements of purpose, CVs and cover letters",
          "Sporting CVs, playing statistics, positions, highlight videos and scouting reports",
          "Visa, immigration and proof-of-funds documents, including bank statements and sponsor letters",
          "Medical-fitness information and medical-exam details where an academy, club or visa process requires them",
        ],
      },
      {
        type: "p",
        text: "Some of this is **sensitive or special-category data** (for example health information and government identifiers). We process it only with your explicit consent or where the law otherwise permits, and we apply stricter access controls to it.",
      },
      { type: "h3", text: "2.3 Booking & Transactional Data" },
      {
        type: "ul",
        items: [
          "Flight, hotel, tour and package selections, dates, destinations and the names of everyone in your party",
          "Any event, match or hospitality selections you ask us to arrange, including seat choices where applicable",
          "Billing details and payment confirmations (a tokenised reference from our payment provider, not your full card number)",
          "Records of enquiries, quotes, invoices and instalment plans",
        ],
      },
      { type: "h3", text: "2.4 Technical & Analytical Data" },
      {
        type: "ul",
        items: [
          "IP address, device type, browser, operating system and approximate location",
          "Pages viewed, clicks, session duration and referral source",
          "Interaction data from our booking and document tools, used to keep them working and to prevent duplicate or abusive requests",
        ],
      },
      { type: "h3", text: "2.5 Cookies and similar technologies" },
      {
        type: "ul",
        items: [
          "**Strictly necessary:** keep you signed in, hold your session during checkout, and protect the site from abuse. These cannot be switched off.",
          "**Analytics and performance:** help us understand how the site is used. Used only with your consent where the law requires it.",
          "**Marketing:** used only with your consent, and never on pages where you upload application documents.",
        ],
      },
      {
        type: "p",
        text: "You can change your choices at any time through your browser settings, and we honour Global Privacy Control (GPC) browser signals as an opt-out request.",
      },
      { type: "h3", text: "2.6 Children and young players" },
      {
        type: "p",
        text: "Many football pathway applicants are under 18. For anyone under 18 (or below the age of majority where they live), we require a parent or legal guardian to give consent, to be the main point of contact and to approve any sharing of the young person’s data with an academy or club. We do not publish profiles of minors, and we do not knowingly collect data from children under 13 outside this guardian-led process.",
      },
      { type: "h3", text: "2.7 How we collect it" },
      {
        type: "p",
        text: "Directly from you (forms, uploads, messages, calls); automatically through the website; and from institutions, academies and booking partners when they confirm an application, ticket or reservation on your behalf.",
      },
    ],
  },
  {
    id: "how-we-use-information",
    title: "3. How We Use Your Information",
    blocks: [
      { type: "h3", text: "3.1 To perform our contract with you" },
      {
        type: "ul",
        items: [
          "Preparing and submitting study applications, visa support packages and football pathway applications",
          "Booking flights, hotels, tours and other travel services, issuing confirmations and managing instalment plans",
          "Verifying your documents before any submission or embassy fee is paid",
          "Communicating with you about your application, booking or trip",
        ],
      },
      { type: "h3", text: "3.2 Securing reservations and running trip logistics" },
      {
        type: "ul",
        items: [
          "Placing a temporary hold on your chosen reservations, and confirming them with our partners",
          "Matching each ticket or booking to the correct name and identity details required by the carrier, venue or provider",
          "Coordinating transfers, accommodation and entry arrangements",
          "Sending itinerary updates, and handling changes or cancellations",
        ],
      },
      { type: "h3", text: "3.3 AI-assisted tools" },
      {
        type: "p",
        text: "Our Consular Check tools review documents you choose to submit and give you a readiness assessment, rewrites and practice-interview feedback. To provide this, your content is processed by a third-party AI provider acting as our processor under contract and restricted from using your content to train its general models. The assessment is **advisory**: it is not a decision about you, it does not determine any visa or admission outcome, and you can ask for a human visa officer to review it.",
      },
      { type: "h3", text: "3.4 Legal obligations, safety and fraud prevention" },
      {
        type: "p",
        text: "We use data to meet legal and regulatory duties, prevent fraud and payment abuse, keep our platform secure, and handle disputes. We never help anyone forge or falsify a document, and we may refuse service and report concerns where the law requires.",
      },
      { type: "h3", text: "3.5 Marketing" },
      {
        type: "p",
        text: "With your consent, or where the law allows for existing customers, we may send offers and updates about our services and study opportunities. You can unsubscribe at any time using the link in any message or by contacting us. Applicant Vault data is never used for marketing unless you separately opt in.",
      },
      { type: "h3", text: "3.6 Our legal bases (GDPR/UK GDPR)" },
      {
        type: "ul",
        items: [
          "**Contract:** to deliver the services you ask for.",
          "**Consent:** for sensitive data, non-essential cookies and marketing.",
          "**Legitimate interests:** to secure our platform, prevent fraud and improve our services, balanced against your rights.",
          "**Legal obligation:** for tax, accounting, anti-fraud and regulatory requirements.",
        ],
      },
    ],
  },
  {
    id: "data-sharing",
    title: "4. Data Sharing & Third-Party Partnerships",
    blocks: [
      {
        type: "p",
        text: "We share personal data only where it is necessary to deliver what you asked for, and only with recipients who are bound to protect it.",
      },
      { type: "h3", text: "4.1 Educational institutions and sports academies" },
      {
        type: "p",
        text: "We send your application materials to the school, college, university, academy or club you have chosen to apply to, and receive their decisions and requests in return. We do not send your file to any institution you have not selected.",
      },
      { type: "h3", text: "4.2 Ticketing, travel and hospitality partners" },
      {
        type: "p",
        text: "To issue tickets and secure your reservations, we share limited booking data with our ticketing, travel and hospitality partners, including **Champions Travel**, **Go Sport Travel** and **Travel Connection Travel**. Depending on the booking, this may include:",
      },
      {
        type: "ul",
        items: [
          "the names of everyone in your party and, where the carrier, venue or authority requires it, identity or passport details;",
          "your contact details for ticket delivery and trip communication;",
          "your itinerary, hospitality and seat selections; and",
          "a payment reference, never your full card number.",
        ],
      },
      {
        type: "p",
        text: "Integrations with partner systems use secured, authenticated connections and share the minimum data required (data minimisation). Our partners may also need to pass the necessary details to carriers, leagues and venues to issue valid entry. Partners may act as independent controllers of the data they need to fulfil your booking, and their own privacy notices will apply to that processing. We encourage you to read them.",
      },
      { type: "h3", text: "4.3 Service providers" },
      {
        type: "p",
        text: "We use carefully selected providers for payment processing, secure cloud hosting, communications (email and WhatsApp), analytics, customer support and AI document tools. They act on our instructions and may not use your data for their own purposes.",
      },
      { type: "h3", text: "4.4 Legal and regulatory disclosures" },
      {
        type: "p",
        text: "We may disclose data to regulators, courts, law-enforcement, embassies or immigration authorities where the law requires, or where you have asked us to support an application to them.",
      },
      { type: "h3", text: "4.5 We do not sell your data" },
      {
        type: "p",
        text: "We do not sell personal data, and we do not share it for cross-context behavioural advertising. Applicant data is never made available to advertisers or data brokers.",
      },
      { type: "h3", text: "4.6 The standards our partners must meet" },
      {
        type: "p",
        text: "Every ticketing partner, institution-facing provider and service provider is required, by written agreement, to:",
      },
      {
        type: "ul",
        items: [
          "keep your data confidential and use it only for the agreed purpose;",
          "apply appropriate technical and organisational security measures, including encryption in transit;",
          "limit access to staff who need it, under confidentiality obligations;",
          "notify us promptly of any personal-data breach affecting your data;",
          "honour your rights requests and delete or return data when the purpose ends; and",
          "use onward processors only with equivalent protections in place.",
        ],
      },
    ],
  },
  {
    id: "global-transfers",
    title: "5. Global Data Transfers",
    blocks: [
      {
        type: "p",
        text: "Our clients come from around the globe, and their journeys usually end in the UK, Europe or North America. Your data may therefore be processed in Nigeria, the United Kingdom, the European Economic Area and other countries where we or our providers operate.",
      },
      {
        type: "p",
        text: "Whenever your data crosses a border, we use a lawful transfer mechanism and add safeguards on top:",
      },
      {
        type: "ul",
        items: [
          "**Adequacy decisions**, where the destination country has been recognised as providing equivalent protection;",
          "**Standard Contractual Clauses** approved by the European Commission, and the **UK International Data Transfer Agreement or Addendum**, for transfers from the EEA and UK;",
          "**NDPA-compliant safeguards** for transfers out of Nigeria, including contractual protections and, where required, regulator-approved mechanisms; and",
          "**Your explicit consent**, in limited situations where you ask us to send your data to an institution, club or authority in a particular country.",
        ],
      },
      {
        type: "p",
        text: "We also assess the destination’s laws where required and apply supplementary measures such as encryption and strict access controls. You can request a copy of the safeguards that apply to your data using the details in Section 8.",
      },
    ],
  },
  {
    id: "security-retention",
    title: "6. Data Security and Retention",
    blocks: [
      { type: "h3", text: "6.1 How we protect your data" },
      {
        type: "ul",
        items: [
          "**Encryption in transit and at rest** across the website, booking flow, Applicant Vault and backups",
          "**Strong access controls:** role-based access, multi-factor authentication for staff, and logged, reviewable access to application files",
          "**Tokenised payments** through PCI-DSS-compliant providers, so full card numbers never touch our servers",
          "**Secure development and testing:** regular vulnerability scanning, patching and independent security review",
          "**Upload protection:** malware scanning of documents and restricted file types",
          "**Staff training and confidentiality duties** for everyone with access to personal data",
        ],
      },
      { type: "h3", text: "6.2 Reservations and application vaults" },
      {
        type: "p",
        text: "Reservation data and partner connections are transmitted over encrypted channels, and holds expire automatically when not completed. Application documents are stored in the Applicant Vault with separate encryption keys and separate access permissions from our booking and marketing systems, so a compromise of one system does not expose the other.",
      },
      { type: "h3", text: "6.3 How long we keep data" },
      {
        type: "p",
        text: "We keep personal data only as long as needed for the purpose it was collected for, or as the law requires.",
      },
      {
        type: "table",
        head: ["Data", "Typical retention"],
        rows: [
          [
            "Application Vault documents (transcripts, passports, sporting CVs)",
            "Until your application concludes, plus up to 24 months for follow-up and appeals, then securely deleted",
          ],
          [
            "Documents uploaded to AI-assisted tools",
            "Deleted at the end of your session unless you choose to save them, and in any case within 30 days",
          ],
          [
            "Booking and payment records",
            "Up to 7 years, to meet tax, accounting and dispute-handling obligations",
          ],
          ["Technical and usage data", "Up to 13 months"],
          ["Marketing preferences", "Until you unsubscribe or withdraw consent"],
          ["Enquiries and support messages", "Up to 24 months after the matter closes"],
        ],
      },
      { type: "h3", text: "6.4 If something goes wrong" },
      {
        type: "p",
        text: "If a personal-data breach is likely to put your rights at risk, we will notify the relevant data-protection authority within the legal time limit (72 hours under the GDPR and NDPA) and tell affected individuals without undue delay, with clear steps you can take.",
      },
    ],
  },
  {
    id: "your-rights",
    title: "7. Your Legal Rights (GDPR / CCPA Alignment)",
    blocks: [
      {
        type: "p",
        text: "You are in control of your data. Depending on where you live, you have the following rights, and we extend them to all users as a matter of policy.",
      },
      { type: "h3", text: "7.1 Your rights" },
      {
        type: "table",
        head: ["Right", "What it means"],
        rows: [
          ["**Access**", "Ask for a copy of the personal data we hold about you and how we use it"],
          ["**Correction**", "Have inaccurate or incomplete data fixed"],
          ["**Deletion**", "Ask us to erase your data, unless we must keep it by law"],
          [
            "**Data portability**",
            "Receive your data in a structured, commonly used, machine-readable format, or have it sent to another provider",
          ],
          [
            "**Restriction and objection**",
            "Limit or object to certain processing, including direct marketing, at any time",
          ],
          [
            "**Withdraw consent**",
            "Withdraw any consent you have given, without affecting earlier lawful processing",
          ],
          ["**Human review**", "Ask for a person to review any AI-assisted assessment"],
        ],
      },
      { type: "h3", text: "7.2 California residents (CCPA/CPRA)" },
      {
        type: "p",
        text: "California residents also have the right to know the categories and specific pieces of personal information we collect, to delete and correct it, and to limit the use of sensitive personal information. We do not sell or share personal information as those terms are defined under the CCPA/CPRA, and we will never discriminate against you for exercising your rights. An authorised agent may submit a request on your behalf with proof of authority.",
      },
      { type: "h3", text: "7.3 How to use your rights" },
      {
        type: "p",
        text: "Email our Privacy Officer using the details in Section 8. We may ask you to verify your identity to protect your data from impersonation. We respond within one month (45 days for California requests), and may extend this where the law allows if a request is complex. Exercising your rights is free unless a request is clearly unfounded or excessive.",
      },
      { type: "h3", text: "7.4 Complaints" },
      {
        type: "p",
        text: "We would like the chance to put things right first. You also have the right to complain to your local authority, such as the Nigeria Data Protection Commission, the UK Information Commissioner’s Office, your EU supervisory authority or the California Attorney General.",
      },
    ],
  },
  {
    id: "contact",
    title: "8. Contact Us",
    blocks: [
      { type: "h3", text: "8.1 CartandGo Privacy Officer" },
      {
        type: "ul",
        items: [
          "**Privacy Officer / Data Protection Officer:** [[Name]]",
          "**Email:** visaofficer@cartandgotravels.com",
          "**Phone / WhatsApp:** +234 807 323 1272",
          "**Postal address:** CartandGo Travels, Yaba, Lagos, Nigeria [[full address]]",
          "**UK representative (if appointed):** [[Name and address]]",
          "**EU representative (if appointed):** [[Name and address]]",
        ],
      },
      { type: "h3", text: "8.2 Changes to this policy" },
      {
        type: "p",
        text: "We may update this policy as our services, partners or the law change. We will post the new version here with a new effective date, and tell you directly if a change materially affects how we use your applicant data. Where consent is required for a new use, we will ask for it first.",
      },
      { type: "p", text: "Thank you for trusting CartandGo Travels with your journey." },
    ],
  },
];
