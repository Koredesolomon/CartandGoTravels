"use client";

import { useRef } from "react";
import { Icon } from "@/components/ui/Icon";

type UploadCardProps = {
  documentName: string;
  description: string;
  fileName: string;
  isReading: boolean;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  helpText?: string;
  className?: string;
};

export function UploadCard({
  documentName,
  description,
  fileName,
  isReading,
  onFileSelect,
  onRemove,
  helpText = "PDF, DOCX or TXT · Up to 10MB",
  className = "",
}: UploadCardProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div className={`mx-auto w-full max-w-4xl rounded-2xl border border-[#d7dfe5] bg-white px-5 py-8 text-center sm:px-8 sm:py-10 ${className}`}>
      <p className="mx-auto max-w-2xl text-base leading-7 text-[#5b6870] sm:text-lg sm:leading-8">
        {description}
      </p>
      <input
        ref={fileInput}
        type="file"
        accept=".docx,.pdf,.txt"
        aria-label={`Choose ${documentName} file`}
        tabIndex={-1}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFileSelect(file);
        }}
        disabled={isReading}
      />
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={isReading}
        className="mt-6 inline-flex min-h-12 w-full max-w-xs items-center justify-center gap-3 rounded-lg bg-[#f0a42f] px-5 py-3 text-base font-black text-[#07141a] transition hover:bg-[#ffb347] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0098ba] disabled:cursor-wait disabled:opacity-60"
      >
        <Icon name="Upload" className="h-5 w-5 sm:h-6 sm:w-6" />
        {isReading ? `Reading your ${documentName}…` : fileName ? `Replace your ${documentName}` : `Upload your ${documentName}`}
      </button>
      <p className="mt-4 text-xs leading-5 text-[#5b6870] sm:text-sm">
        {helpText}
      </p>
      {fileName ? (
        <div className="mx-auto mt-6 flex max-w-xl items-center justify-center gap-3 rounded-xl bg-[#e8f6fb] px-4 py-3 text-sm font-semibold text-[#07324a]" role="status">
          <Icon name="Check" className="h-5 w-5 shrink-0 text-[#0098ba]" />
          <span className="min-w-0 break-all">{fileName}</span>
          <button
            type="button"
            aria-label={`Remove uploaded ${documentName}`}
            onClick={onRemove}
            disabled={isReading}
            className="ml-1 shrink-0 rounded px-2 py-1 text-lg text-[#5b6870] transition hover:text-[#07141a] disabled:opacity-40"
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}
