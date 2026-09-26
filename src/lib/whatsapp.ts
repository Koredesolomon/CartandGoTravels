export const whatsappContacts = [
  {
    label: "+234 807 323 1272",
    phone: "2348073231272",
  },
  {
    label: "+1 347 420 0238",
    phone: "13474200238",
  },
] as const;

export function createWhatsAppUrl(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function formatLeadMessage(
  title: string,
  entries: readonly [string, FormDataEntryValue | string | number | undefined | null][],
) {
  const lines = entries
    .map(([label, value]) => {
      const text = String(value ?? "").trim();
      return text ? `${label}: ${text}` : "";
    })
    .filter(Boolean);

  return [`Hello Cart&Go, I need help with ${title}.`, ...lines].join("\n");
}
