import { createWhatsAppUrl, whatsappContacts } from "@/lib/whatsapp";

type WhatsAppLeadActionsProps = {
  message: string;
  className?: string;
};

export function WhatsAppLeadActions({
  message,
  className = "",
}: WhatsAppLeadActionsProps) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {whatsappContacts.map((contact) => (
        <a
          key={contact.phone}
          href={createWhatsAppUrl(contact.phone, message)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-md bg-[#0098ba] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#007f9c]"
        >
          Send to {contact.label}
        </a>
      ))}
    </div>
  );
}
