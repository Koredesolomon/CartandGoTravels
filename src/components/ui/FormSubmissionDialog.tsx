"use client";

type FormSubmissionDialogProps = {
  onClose: () => void;
  title?: string;
};

export function FormSubmissionDialog({
  onClose,
  title = "Thank you for your submission",
}: FormSubmissionDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#050505]/65 px-5 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-submission-title"
    >
      <div className="w-full max-w-md rounded-md border border-[#e2dacb] bg-white p-6 text-center shadow-[0_30px_90px_-35px_rgba(0,0,0,.65)]">
        <p className="text-xs font-black uppercase text-[#1aa6b7]">
          Request received
        </p>
        <h2
          id="form-submission-title"
          className="mt-2 font-serif text-3xl font-semibold text-[#0f1e3d]"
        >
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#5a5f6b]">
          Your request has been sent. The Cart&Go team will review it and get
          back to you shortly.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex rounded bg-[#c68a2e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b87d22]"
        >
          Close
        </button>
      </div>
    </div>
  );
}
