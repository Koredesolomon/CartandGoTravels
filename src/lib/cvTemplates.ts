export type CvTemplateId = "classic" | "modern" | "minimal" | "executive" | "scholarly";
/** A dated CV entry. Templates lay these out with a bold title and right-aligned dates. */
export type CvEntry = { title: string; organisation: string; location: string; dates: string; notes: string[]; details: string };
/** `body` always holds the complete plain text of a section; `entries` and `list` are layout hints for the same content. */
export type CvSection = { heading: string; body: string; entries?: CvEntry[]; list?: boolean };
export type CvDocumentContent = { name: string; headline?: { label: string; value: string }; contact: string[]; sections: CvSection[] };
export const cvTemplates = [
  { id: "classic", name: "Classic", description: "Centred name, full-width rules and traditional spacing.", accent: "#31594e", alignment: "center", heading: "rule", headingTracking: 1, headingMuted: false, nameInk: false, margin: 50, bodySize: 10.5, lineHeight: 15, sectionGap: 15, nameSize: 25 },
  { id: "modern", name: "Modern", description: "A bold blue name, accent bar and coloured dates.", accent: "#22577a", alignment: "left", heading: "accent", headingTracking: 0.4, headingMuted: false, nameInk: false, margin: 50, bodySize: 10.5, lineHeight: 15, sectionGap: 14, nameSize: 28 },
  { id: "minimal", name: "Minimal", description: "Black name, grey spaced headings and open whitespace.", accent: "#30363b", alignment: "left", heading: "plain", headingTracking: 1.8, headingMuted: true, nameInk: true, margin: 56, bodySize: 10, lineHeight: 15, sectionGap: 19, nameSize: 23 },
  { id: "executive", name: "Executive", description: "A navy banner holding your name, headline and contacts.", accent: "#172c45", alignment: "left", heading: "rule", headingTracking: 0.6, headingMuted: false, nameInk: false, margin: 50, bodySize: 10.5, lineHeight: 15, sectionGap: 14, nameSize: 26 },
  { id: "scholarly", name: "Scholarly", description: "A formal centred header, double rules and compact sections.", accent: "#34303f", alignment: "center", heading: "double-rule", headingTracking: 1.2, headingMuted: false, nameInk: false, margin: 50, bodySize: 10, lineHeight: 14, sectionGap: 14, nameSize: 24 },
] as const;
export type CvTemplate = (typeof cvTemplates)[number];
export function cvTemplate(id: CvTemplateId): CvTemplate {
  return cvTemplates.find(template => template.id === id) ?? cvTemplates[0];
}
