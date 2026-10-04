const faqs = [
  [
    "Do I pay service charge before my visa is approved?",
    "No. For eligible visa support routes, Cart & Go reviews your pathway and documents first, then confirms the right next step before major fees are paid.",
  ],
  [
    "Can you help after a visa refusal?",
    "Yes. We review the refusal note, identify weak evidence, rebuild the checklist and help you prepare a stronger document strategy.",
  ],
  [
    "Do you handle flights and hotels too?",
    "Yes. You can request flights, hotels, tours, insurance and visa-related bookings through one team so your itinerary stays consistent.",
  ],
  [
    "What documents should I send first?",
    "Start with your destination, travel purpose, passport status, timeline, refusal history if any, and the documents you already have.",
  ],
  [
    "Can I contact the team on WhatsApp?",
    "Yes. Use any WhatsApp button on the site to send your request directly to the advisory team.",
  ],
] as const;

export function FaqSection() {
  return (
    <section className="bg-white px-[5%] py-20 md:px-[4%] xl:px-[8%]">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.85fr_1.15fr]">
        <div>
          <p className="text-xs font-black uppercase text-[#0098ba]">Get Clarity</p>
          <h2 className="mt-3 font-serif text-4xl text-[#07324a] md:text-5xl">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="divide-y divide-[#d7dfe5] rounded-lg border border-[#d7dfe5] bg-[#f9fcff]">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group p-5 open:bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-[#07141a]">
                {question}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#e8f6fb] text-lg text-[#0098ba] transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#545f68]">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
