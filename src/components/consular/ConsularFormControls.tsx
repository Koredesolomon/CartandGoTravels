import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import type { Flag } from "@/lib/localRewriteAnalysis";

export type EntryMode = "upload" | "paste" | "scratch";

export const inputClass =
  "mt-1.5 w-full rounded-md border border-[#d7dfe5] bg-[#fbf8f2] px-3 py-2.5 text-[14.5px] text-[#1b1f27] outline-none transition focus:border-[#0098ba] focus:ring-2 focus:ring-[#0098ba]/20";

function flagClass(type: Flag["type"]) {
  if (type === "excellent") {
    return "border-[#0098ba] bg-[#e8f6fb]";
  }

  if (type === "weak") {
    return "border-[#f0a42f] bg-[#fff7e8]";
  }

  return "border-[#f00000] bg-[#fff0f0]";
}

export function EmptyReport() {
  return (
    <div className="flex min-h-96 flex-col justify-center rounded-md bg-[#e8f6fb] p-6">
      <Icon name="Search" className="h-10 w-10 text-[#0098ba]" />
      <h2 className="mt-5 font-serif text-3xl text-[#07141a]">
        Your readiness report will appear here.
      </h2>
      <p className="mt-3 max-w-xl leading-7 text-[#5b6870]">
        Upload travel documents or paste their text, then run the review to see evidence-based findings, proofreading corrections and questions to resolve.
      </p>
    </div>
  );
}

export function Score({ score }: { score: number }) {
  return (
    <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-[7px] border-[#d7dfe5]">
      <span className="font-serif text-3xl font-black text-[#07141a]">{score}</span>
      <span className="text-xs text-[#5b6870]">/ 100</span>
    </div>
  );
}

export function FlagCard({ type, title, body }: Flag) {
  return (
    <div className={`mt-4 rounded-md border-l-4 p-4 text-sm leading-6 ${flagClass(type)}`}>
      <b className="block text-[#07141a]">{title}</b>
      <span className="text-[#5b6870]">{body}</span>
    </div>
  );
}

export function ReportSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-7">
      <h3 className="mb-3 text-xs font-black uppercase text-[#f0a42f]">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-[#d7dfe5] bg-white p-6">{children}</div>;
}

export function ScratchInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mb-3 block text-[12.5px] font-semibold text-[#07141a]">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="block text-[12.5px] font-semibold text-[#07141a]">
      {label}
      <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

export function EntryToggle({
  value,
  onChange,
  labels,
  modes = ["upload", "paste", "scratch"],
}: {
  value: EntryMode;
  onChange: (mode: EntryMode) => void;
  labels: readonly string[];
  modes?: readonly EntryMode[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {modes.map((mode, index) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`rounded-md border px-4 py-2 text-sm font-bold ${
            value === mode
              ? "border-[#07141a] bg-[#07141a] text-white"
              : "border-[#d7dfe5] bg-[#fbf8f2] text-[#1b1f27]"
          }`}
        >
          {labels[index]}
        </button>
      ))}
    </div>
  );
}
