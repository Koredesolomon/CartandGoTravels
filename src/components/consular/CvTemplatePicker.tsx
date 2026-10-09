"use client";

import { useId } from "react";
import { cvTemplates, type CvTemplateId } from "@/lib/cvTemplates";

function Thumbnail({ id }: { id: CvTemplateId }) {
  const style = cvTemplates.find(template => template.id === id)!;
  const centred = style.alignment === "center";
  return <svg aria-hidden="true" viewBox="0 0 150 198" className="mx-auto w-full max-w-40 rounded-sm bg-white shadow-sm">
    <rect width="150" height="198" fill="white" />
    {id === "executive" ? <rect width="150" height="30" fill={style.accent} /> : null}
    {id === "modern" ? <rect x="5" y="12" width="2" height="172" fill={style.accent} /> : null}
    <text x={centred ? 75 : 14} y="23" textAnchor={centred ? "middle" : "start"} fontSize={id === "modern" ? 11 : 10} fontWeight="700" fill={id === "executive" ? "white" : style.accent}>YOUR NAME</text>
    <rect x={centred ? 35 : 14} y="36" width="80" height="2" fill="#9aa2a7" />
    <rect x={centred ? 47 : 14} y="42" width="56" height="2" fill="#bac1c5" />
    {[56, 87, 119, 152].map((y, section) => <g key={y}>
      <text x="14" y={y} fontSize="4.5" fontWeight="700" fill={style.accent}>{["PROFILE", "EXPERIENCE", "EDUCATION", "SKILLS"][section]}</text>
      {style.heading !== "plain" ? <line x1="14" x2={style.heading === "accent" ? 30 : 136} y1={y + 4} y2={y + 4} stroke={style.accent} strokeWidth={style.heading === "accent" ? 1.2 : 0.5} /> : null}
      {style.heading === "double-rule" ? <line x1="14" x2="136" y1={y + 6} y2={y + 6} stroke={style.accent} strokeWidth="0.3" /> : null}
      {[11, 16, 21].map((offset, index) => <rect key={offset} x="14" y={y + offset} width={[122, 112, 87][index]} height="2" fill={index === 0 ? "#929ca3" : "#d2d8dc"} />)}
    </g>)}
  </svg>;
}

export function CvTemplatePicker({ value, onChange }: { value: CvTemplateId; onChange: (value: CvTemplateId) => void }) {
  const group = useId();
  return <fieldset className="min-w-0">
    <legend className="text-base font-black text-[#07141a]">Choose your CV template</legend>
    <p className="mt-1 text-sm leading-6 text-[#5b6870]">Choose a style for your Job or Academic CV. You can switch templates later without losing your details.</p>
    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {cvTemplates.map(template => <label key={template.id} className={`relative flex cursor-pointer flex-col rounded-lg border-2 p-3 transition focus-within:ring-2 focus-within:ring-[#0098ba] focus-within:ring-offset-2 ${value === template.id ? "border-[#0098ba] bg-[#eef9fb]" : "border-[#d7dfe5] bg-[#f7f9fa] hover:border-[#6faeb8]"}`}>
        <input type="radio" className="sr-only" name={group} aria-label={`${template.name} template`} value={template.id} checked={value === template.id} onChange={() => onChange(template.id)} />
        <Thumbnail id={template.id} />
        <span className="mt-3 text-sm font-black text-[#07141a]">{template.name}</span>
        <span className="mt-1 text-xs leading-5 text-[#5b6870]">{template.description}</span>
        <span className={`mt-auto pt-3 text-xs font-bold ${value === template.id ? "text-[#0f5e68]" : "text-[#5b6870]"}`}>{value === template.id ? "✓ Selected" : "Select template"}</span>
      </label>)}
    </div>
  </fieldset>;
}
