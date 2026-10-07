import type { ItineraryPlan } from "@/lib/itinerary";

export const MAX_SUPPORT_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_SUPPORT_TOTAL_BYTES = 30 * 1024 * 1024;
export const SUPPORT_FILE_ACCEPT = ".pdf,.jpg,.jpeg,.png";
export type SupportingDocument = { key: string; label: string; filename: string; mimeType: "application/pdf" | "image/jpeg" | "image/png"; bytes: Uint8Array };

export function itineraryDocumentRequirements(plan: ItineraryPlan) {
  return [
    { key: "passport", label: "Passport bio-data page" },
    { key: "inbound", label: "Inbound flight reservation" },
    { key: "outbound", label: "Outbound flight reservation" },
    ...plan.details.stops.map((stop, index) => ({ key: `accommodation-${index}`, label: `Accommodation proof · stop ${index + 1} · ${stop.cityName}` })),
    { key: "tie", label: "Home-country tie evidence" },
    { key: "finance", label: "Financial means evidence" },
  ];
}
