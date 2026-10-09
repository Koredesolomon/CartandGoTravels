export type CvTemplateId = "classic" | "modern" | "minimal" | "executive" | "scholarly";
export type CvDocumentContent = { name: string; contact: string[]; sections: { heading: string; body: string }[] };
export const cvTemplates = [
  { id: "classic", name: "Classic", description: "Centred name, traditional rules and balanced spacing.", accent: "#31594e", alignment: "center", heading: "rule", margin: 48, bodySize: 11, lineHeight: 16, sectionGap: 16, nameSize: 25 },
  { id: "modern", name: "Modern", description: "A bold blue name and a clean accent down the page.", accent: "#22577a", alignment: "left", heading: "accent", margin: 48, bodySize: 11, lineHeight: 16, sectionGap: 18, nameSize: 28 },
  { id: "minimal", name: "Minimal", description: "Quiet typography, open space and understated headings.", accent: "#30363b", alignment: "left", heading: "plain", margin: 54, bodySize: 10.5, lineHeight: 16, sectionGap: 20, nameSize: 23 },
  { id: "executive", name: "Executive", description: "A navy name banner with strong section dividers.", accent: "#172c45", alignment: "left", heading: "rule", margin: 48, bodySize: 11, lineHeight: 16, sectionGap: 17, nameSize: 26 },
  { id: "scholarly", name: "Scholarly", description: "A formal centred header and compact research sections.", accent: "#34303f", alignment: "center", heading: "double-rule", margin: 48, bodySize: 10.5, lineHeight: 15, sectionGap: 16, nameSize: 24 },
] as const;
export function cvTemplate(id: CvTemplateId) {
  return cvTemplates.find(template => template.id === id) ?? cvTemplates[0];
}
