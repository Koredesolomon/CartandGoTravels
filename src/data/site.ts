export const navGroups = [
  {
    label: "About",
    href: "/about",
  },
  {
    label: "Services",
    items: [
      ["Visit Visa", "/services?service=visa-assistance#visa-assistance"],
      ["Work Visa", "/services?service=visa-assistance#visa-assistance"],
      ["Proof of Funds", "/services?service=proof-of-funds#proof-of-funds"],
      ["Travel Insurance", "/services?service=travel-insurance#travel-insurance"],
      ["Previous Refusals", "/services?service=visa-assistance#visa-assistance"],
      ["Flights & Hotels", "/services?service=flights#flights"],
      ["Tours", "/services"],
    ],
  },
  {
    label: "Study Abroad",
    href: "/services?service=study-football-mobility-pathway#study-football-mobility-pathway",
  },
  {
    label: "AI Consular Check",
    href: "/ai-consular-check",
  },
  {
    label: "Contact Us",
    href: "/contact",
  },
] as const;

export const stats = [
  ["500+", "Visas processed"],
  ["29+", "Countries served"],
  ["95%", "Approval rate"],
  ["7 yrs", "Of expertise"],
] as const;

export const services = [
  {
    title: "Visa Assistance",
    description: "Work, study and visit visa processing with end-to-end documentation.",
    icon: "File",
    href: "/services?service=visa-assistance#visa-assistance",
  },
  {
    title: "Cheap Flights",
    description: "Best fares to any destination with flexible date search.",
    icon: "Plane",
    href: "/services?service=flights#flights",
  },
  {
    title: "Hotel Booking",
    description: "Boutique stays, resorts and business hotels at thoughtful rates.",
    icon: "Hotel",
    href: "/services?service=hotel-booking#hotel-booking",
  },
  {
    title: "Biometrics & Medicals",
    description: "Appointment scheduling, preparation and follow-up support.",
    icon: "Care",
    href: "/services?service=biometrics-medical-appointments#biometrics-medical-appointments",
  },
  {
    title: "Travel Insurance",
    description: "Embassy-compliant coverage and global health protection.",
    icon: "Shield",
    href: "/services?service=travel-insurance#travel-insurance",
  },
  {
    title: "Scholarships",
    description: "Curated funded opportunities across top universities.",
    icon: "Cap",
    href: "/services",
  },
  {
    title: "Online Courses",
    description: "Career-focused certifications with quizzes and certificates.",
    icon: "Book",
    href: "/services",
  },
  {
    title: "Student Loans",
    description: "Cross-border student loans for eligible study-abroad applicants.",
    icon: "Money",
    href: "/services",
  },
] as const;

export const visaOffers = [
  {
    country: "UK Visa Application",
    description:
      "Prepare a strong UK visitor, study or work application with guided forms, document checks and appointment support.",
    image: "/assets/visa-passport.jpg",
    href: "https://wa.me/2348073231272?text=Hello%20Cart%26Go%2C%20I%20want%20to%20apply%20for%20UK%20visa%20support.%20Please%20guide%20me%20on%20requirements%2C%20documents%20and%20next%20steps.",
  },
  {
    country: "Canada Visa Application",
    description:
      "Get practical support for Canada TRV, study permit and relocation pathways, including financial document review.",
    image: "/assets/hero-travel.jpg",
    href: "https://wa.me/2348073231272?text=Hello%20Cart%26Go%2C%20I%20want%20to%20apply%20for%20Canada%20visa%20support.%20Please%20help%20me%20review%20my%20route%2C%20documents%20and%20proof%20of%20funds.",
  },
  {
    country: "Schengen Visa Application",
    description:
      "Plan France and other Schengen trips with a complete checklist, travel insurance guidance and itinerary support.",
    image: "/assets/hotel.jpg",
    href: "https://wa.me/2348073231272?text=Hello%20Cart%26Go%2C%20I%20want%20to%20apply%20for%20Schengen%20visa%20support.%20Please%20help%20me%20with%20the%20checklist%2C%20travel%20insurance%20and%20itinerary%20requirements.",
  },
] as const;

export const studyOptions = [
  ["UK study & work visa", "Study in UK", "/services?service=study-football-mobility-pathway#study-football-mobility-pathway"],
  ["France study pathway", "Study in France", "/services?service=study-football-mobility-pathway#study-football-mobility-pathway"],
  ["Canada study visa", "Study in Canada", "/services?service=study-football-mobility-pathway#study-football-mobility-pathway"],
  ["Portugal study visa", "Study in Portugal", "/services?service=study-football-mobility-pathway#study-football-mobility-pathway"],
] as const;

export const travelPartners = [
  "Qatar Airways",
  "Turkish Airlines",
  "British Airways",
  "Virgin Atlantic",
  "Air France",
  "Ethiopian",
  "KLM",
  "Lufthansa",
] as const;

export const scholarships = [
  "Chevening (UK)",
  "DAAD (Germany)",
  "Fulbright (USA)",
  "MEXT (Japan)",
  "Erasmus+ (EU)",
  "Commonwealth",
] as const;

export const flightPerks = [
  ["Cheapest fares", "Flexible-date search across 700+ airlines"],
  ["Premium stays", "Curated boutique and 5-star hotels"],
  ["Group bookings", "Tailored deals for families and teams"],
  ["24/7 support", "Reach us anytime, anywhere"],
] as const;

export const routePages = {
  services: {
    eyebrow: "Services",
    title: "Services Directory",
    description:
      "Review CartandGo relocation, visa, funding, appointment and passport services in one clear directory.",
    icon: "File",
    image: "/assets/visa-passport.jpg",
    bullets: ["Visa Assistance", "Proof of Funds", "Travel Insurance", "Permanent Residency"],
    cta: "Book consultation",
  },
  visa: {
    eyebrow: "Visa Assistance",
    title: "Visa support from first checklist to final decision.",
    description:
      "Get expert guidance for work, study and visit visa applications, including document review, biometrics, medicals, insurance and interview preparation.",
    icon: "File",
    image: "/assets/visa-passport.jpg",
    bullets: ["Eligibility review", "Document checklist", "Application filing", "Interview preparation"],
    cta: "Start your visa",
  },
  "work-visa": {
    eyebrow: "Work Visa",
    title: "Work routes prepared around real offers and clear evidence.",
    description:
      "Assess sponsored employment pathways, document requirements and work-permit readiness before committing to major fees.",
    icon: "Briefcase",
    image: "/assets/hero-travel.jpg",
    bullets: ["Job offer review", "Eligibility checks", "Document planning", "Biometrics support"],
    cta: "Review my work route",
  },
  tours: {
    eyebrow: "Curated Tours",
    title: "See more of the world with less planning pressure.",
    description:
      "We shape leisure, family and group travel around clean itineraries, dependable bookings and destination support.",
    icon: "Globe",
    image: "/assets/hero-travel.jpg",
    bullets: ["Custom itineraries", "Group coordination", "Destination planning", "Travel support"],
    cta: "Plan a tour",
  },
  flights: {
    eyebrow: "Flights & Hotels",
    title: "Smart fares and stays that fit your trip.",
    description:
      "Compare routes, flexible dates and hotel options with a team that understands budget, comfort and timing.",
    icon: "Plane",
    image: "/assets/hotel.jpg",
    bullets: ["Flight search", "Hotel booking", "Group reservations", "Trip changes"],
    cta: "Find my trip",
  },
  courses: {
    eyebrow: "Online Courses",
    title: "Career certificates for travel-ready professionals.",
    description:
      "Build practical credentials across care, support and digital pathways with guided course options and certificate support.",
    icon: "Book",
    image: "/assets/scholarship.jpg",
    bullets: ["Healthcare Assistant", "Caregiver", "Nanny", "Digital Marketing"],
    cta: "Browse courses",
  },
  scholarships: {
    eyebrow: "Scholarships",
    title: "Funded study opportunities, researched for you.",
    description:
      "We track global scholarships and help students understand deadlines, eligibility, documents and application positioning.",
    icon: "Cap",
    image: "/assets/scholarship.jpg",
    bullets: ["Chevening", "DAAD", "Fulbright", "Commonwealth"],
    cta: "Find scholarships",
  },
  "study-abroad": {
    eyebrow: "Study Abroad",
    title: "Study, fund and prepare for life abroad with one clear plan.",
    description:
      "Bring school search, scholarships, certificates, funding guidance, visa readiness and travel planning into one organized pathway.",
    icon: "Cap",
    image: "/assets/scholarship.jpg",
    bullets: ["School selection", "Scholarship planning", "Student visa guidance", "Arrival support"],
    cta: "Plan my study route",
  },
  loans: {
    eyebrow: "Student Loans",
    title: "Study funding guidance with clear next steps.",
    description:
      "Explore cross-border education funding options, repayment expectations and application support for eligible students.",
    icon: "Money",
    image: "/assets/visa-passport.jpg",
    bullets: ["Eligibility review", "Funding guidance", "School disbursement", "Repayment planning"],
    cta: "Apply for funding",
  },
  pof: {
    eyebrow: "Proof of Funds",
    title: "Prepare financial evidence with confidence.",
    description:
      "Get guidance on proof-of-funds expectations, supporting documents and presentation for study and travel applications.",
    icon: "Shield",
    image: "/assets/visa-passport.jpg",
    bullets: ["Document review", "Statement guidance", "Sponsor support", "Application readiness"],
    cta: "Review my POF",
  },
  blog: {
    eyebrow: "Travel Notes",
    title: "Guides, updates and practical travel insight.",
    description:
      "Read helpful notes on visa planning, study-abroad preparation, funding, destinations and smarter booking choices.",
    icon: "Book",
    image: "/assets/hero-travel.jpg",
    bullets: ["Visa tips", "Study guides", "Travel planning", "Funding notes"],
    cta: "Read articles",
  },
  payment: {
    eyebrow: "Payments",
    title: "Make secure payments for your travel services.",
    description:
      "Use this route for payment guidance, invoices and confirmation steps connected to your CartandGo service package.",
    icon: "Money",
    image: "/assets/hotel.jpg",
    bullets: ["Invoice review", "Payment guidance", "Receipts", "Service confirmation"],
    cta: "Request invoice",
  },
  contact: {
    eyebrow: "Contact",
    title: "Talk with a travel expert.",
    description:
      "Book a free consultation or send your travel goal. We will help map your pathway, costs and next steps.",
    icon: "Message",
    image: "/assets/hero-travel.jpg",
    bullets: ["Free consultation", "WhatsApp support", "Email response", "Pathway planning"],
    cta: "Book consultation",
  },
  auth: {
    eyebrow: "Student Login",
    title: "Access your student travel workspace.",
    description:
      "A dedicated student area can hold course progress, applications, documents and funding steps as the platform grows.",
    icon: "User",
    image: "/assets/scholarship.jpg",
    bullets: ["Application tracking", "Course access", "Document status", "Advisor notes"],
    cta: "Continue",
  },
  "ai-consular-check": {
    eyebrow: "AI Consular Check",
    title: "Meet your virtual consular officer before you apply.",
    description:
      "Run a private document readiness check, practise consular interview questions and learn what to fix before embassy fees or formal submission.",
    icon: "Shield",
    image: "/assets/visa-passport.jpg",
    bullets: ["Document readiness", "Interview practice", "Risk flags", "Fix roadmap"],
    cta: "Run check",
  },
  about: {
    eyebrow: "About Us",
    title: "A modern travel agency for cross-border dreams.",
    description:
      "CartandGo brings visa support, bookings, education pathways and funding guidance into one calm, practical experience.",
    icon: "Globe",
    image: "/assets/hero-travel.jpg",
    bullets: ["Travel expertise", "Education support", "Global partners", "Client-first process"],
    cta: "Meet the team",
  },
} as const;

export type RouteSlug = keyof typeof routePages;

export const routePageDetails = {
  tours: {
    badge: "Built around your destination, budget and group size.",
    cards: [
      ["Private itinerary design", "Daily plans, stays, activities and transport arranged around how you want to travel.", "Globe"],
      ["Group travel support", "Family, school, church and corporate trips with rooming lists, timing and payment tracking.", "Users"],
      ["Study and football mobility", "Pathway planning for students and athletes who need travel, school and documentation support.", "Plane"],
      ["Insurance and bookings", "Hotel, flight, insurance and transfer coordination so the whole trip has one accountable desk.", "Shield"],
    ],
    steps: ["Share destination and dates", "Choose budget and travel style", "Confirm itinerary and deposits", "Travel with support"],
    noteTitle: "Trips should feel exciting, not scattered.",
    note:
      "CartandGo keeps the planning practical: transparent costs, checked documents and booking support before money is committed.",
  },
  courses: {
    badge: "Career certificates for people preparing to work, study or relocate.",
    cards: [
      ["Caregiver and healthcare", "Guided course options for care, health support and entry-level international career pathways.", "Care"],
      ["Digital skills", "Marketing, admin and remote-work certificates that strengthen employability.", "Book"],
      ["Trade readiness", "Food hygiene, forklift and practical workplace certificates for stronger applications.", "Briefcase"],
      ["Certificate guidance", "We help you choose courses that fit your destination, budget and visa story.", "Cap"],
    ],
    steps: ["Pick your pathway", "Confirm eligibility", "Enroll and study", "Prepare certificate evidence"],
    noteTitle: "A certificate should support a real plan.",
    note:
      "We connect learning choices to visa, work or school goals so your training makes sense inside the bigger application.",
  },
  scholarships: {
    badge: "Funded study opportunities researched and organized for you.",
    cards: [
      ["Opportunity shortlist", "Scholarships matched by country, course, deadline, eligibility and funding level.", "Search"],
      ["Document preparation", "Academic records, references, essays and proof-of-funds notes organized early.", "File"],
      ["Application calendar", "Deadlines and submission windows tracked so strong opportunities are not missed.", "Calendar"],
      ["Study visa bridge", "Scholarship wins are connected to school admission, visa evidence and travel planning.", "Shield"],
    ],
    steps: ["Profile review", "Scholarship shortlist", "Essay and document prep", "Submission tracking"],
    noteTitle: "Funding is a strategy, not a lucky search.",
    note:
      "CartandGo helps students focus on realistic scholarships and complete files instead of chasing random links.",
  },
  "study-abroad": {
    badge: "One study-abroad desk for school, funding, visa and travel readiness.",
    cards: [
      ["School selection", "Choose programs and countries that fit your budget, timeline and long-term goal.", "Cap"],
      ["Scholarship planning", "Shortlist realistic funding options and track documents before deadlines arrive.", "Search"],
      ["Visa readiness", "Connect admission, proof of funds, travel history and study intent into one file.", "File"],
      ["Arrival planning", "Flights, insurance, accommodation and support steps prepared before departure.", "Plane"],
    ],
    steps: ["Review profile", "Choose schools and routes", "Prepare funding evidence", "Apply and plan travel"],
    noteTitle: "Study abroad should not be scattered.",
    note:
      "CartandGo helps students connect admission, scholarships, loans, certificates, visa evidence and travel bookings into one practical roadmap.",
  },
  loans: {
    badge: "Student funding guidance with clear repayment expectations.",
    cards: [
      ["Eligibility review", "We look at school, course, country, cosigner needs and affordability before applications begin.", "Check"],
      ["Budget planning", "Tuition, deposits, living costs, flights and visa fees mapped into one realistic plan.", "Money"],
      ["School disbursement", "Guidance on lender requirements, admission documents and payment timelines.", "Cap"],
      ["Repayment clarity", "You understand repayment windows and risks before taking on debt.", "Shield"],
    ],
    steps: ["Assess admission plan", "Build cost estimate", "Review funding options", "Prepare loan evidence"],
    noteTitle: "Borrowing should never be vague.",
    note:
      "We help students compare funding routes carefully so visa plans do not collapse under unclear costs.",
  },
  pof: {
    badge: "Proof of funds checks before embassy fees or formal submissions.",
    cards: [
      ["Statement review", "We check transaction flow, balance history, source of funds and consistency with your story.", "File"],
      ["Sponsor evidence", "Employment, business, relationship and consent documents reviewed for credibility.", "Users"],
      ["Savings pathway", "Pay-small-small planning for clients building toward a stronger financial profile.", "Money"],
      ["Risk reduction", "We flag weak documents early to reduce avoidable denials and financial loss.", "Shield"],
    ],
    steps: ["Upload statements", "Review source of funds", "Fix evidence gaps", "Prepare final POF pack"],
    noteTitle: "Your money evidence must make sense.",
    note:
      "Proof of funds is more than a balance. We check whether the documents tell a believable, consistent financial story.",
  },
  blog: {
    badge: "Practical guides for visa, travel, funding and relocation decisions.",
    cards: [
      ["Visa planning notes", "Checklists, timelines and common mistakes for visit, study and work visa applicants.", "File"],
      ["POF explainers", "How proof of funds, sponsors and bank statements are assessed in real applications.", "Money"],
      ["Study abroad guides", "School search, scholarships, course choice and student visa preparation.", "Cap"],
      ["Travel alerts", "Flight, hotel, insurance and destination planning updates for modern travelers.", "Plane"],
    ],
    steps: ["Read a guide", "Save your checklist", "Ask a question", "Book support when ready"],
    noteTitle: "Good information prevents expensive mistakes.",
    note:
      "The blog is built to answer the questions clients ask before they spend money on submissions, bookings or school deposits.",
  },
  payment: {
    badge: "Secure service payments, payment plans and invoice confirmation.",
    cards: [
      ["Invoice review", "Confirm exactly what you are paying for before making transfer or card payment.", "File"],
      ["Pay-small-small options", "Structured savings or installment guidance for eligible service packages.", "Money"],
      ["Embassy fee caution", "We encourage document checks before formal submissions or embassy fee payments.", "Shield"],
      ["Receipt confirmation", "Payments are tracked against your service so next steps stay organized.", "Check"],
    ],
    steps: ["Request invoice", "Confirm service scope", "Make payment", "Receive receipt and next steps"],
    noteTitle: "Payment should come with clarity.",
    note:
      "CartandGo keeps service scope, receipts and next actions visible so clients understand what each payment covers.",
  },
  contact: {
    badge: "Talk to a visa and travel advisor before you commit money.",
    cards: [
      ["Free consultation", "Share your destination, timeline and concern so we can point you to the right service.", "Message"],
      ["WhatsApp support", "Fast conversation for visa, flight, hotel, course and proof-of-funds questions.", "User"],
      ["Document review request", "Ask what documents are missing before formal submission or embassy payment.", "File"],
      ["Lagos and remote", "Consultations by appointment in Lagos and remote support for clients abroad.", "Location"],
    ],
    steps: ["Send your goal", "Get service direction", "Share documents", "Receive next steps"],
    noteTitle: "Contact us on the channel that works.",
    note:
      "Website: www.cartandgotravels.com. Email: visaofficer@cartandgotravels.com. WhatsApp: +234 802 846 0427, +234 807 323 1272, +1 347 420 0238.",
  },
  auth: {
    badge: "A future workspace for students and applicants.",
    cards: [
      ["Application status", "Track visa, school, funding and document progress in one place.", "File"],
      ["Course access", "Keep certificates and learning milestones connected to your relocation plan.", "Book"],
      ["Advisor notes", "Review checklist updates, missing documents and next actions from the team.", "Message"],
      ["Payment history", "Keep invoices, receipts and service plans organized.", "Money"],
    ],
    steps: ["Create profile", "Add service", "Upload documents", "Track progress"],
    noteTitle: "The portal is being shaped around real client workflows.",
    note:
      "Until full login access is active, clients can continue through WhatsApp, email and direct advisor support.",
  },
  about: {
    badge: "A travel agency built on transparency, advocacy and practical guidance.",
    cards: [
      ["Transparency first", "We explain requirements, risks and costs before clients make major payments.", "Shield"],
      ["Travel under one roof", "Visa, flights, hotels, insurance, courses, scholarships and loans connected in one plan.", "Globe"],
      ["Document verification", "We reduce denial risk by checking evidence before formal submissions.", "Check"],
      ["Relocation community", "We support people seeking better travel, study, work and mobility opportunities.", "Users"],
    ],
    steps: ["Listen to your goal", "Assess the route", "Build the checklist", "Support the journey"],
    noteTitle: "Why CartandGo?",
    note:
      "We are dedicated to building a community of transparency and advocacy for individuals seeking to relocate, while reducing avoidable financial loss and visa denials.",
  },
} as const;
