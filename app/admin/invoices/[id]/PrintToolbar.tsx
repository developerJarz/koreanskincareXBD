"use client";

import { useEffect } from "react";
import { ArrowLeft, Printer } from "lucide-react";

export function PrintToolbar({
  invoiceNumber,
  autoPrint,
  paperSize,
}: {
  invoiceNumber: string;
  autoPrint: boolean;
  paperSize: string;
}) {
  useEffect(() => {
    document.title = `Invoice ${invoiceNumber}`;
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [autoPrint, invoiceNumber]);

  return (
    <div className="no-print mx-auto mb-4 flex max-w-[860px] flex-wrap items-center justify-between gap-3 px-4">
      <button
        type="button"
        onClick={() => (window.opener ? window.close() : history.back())}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-800 hover:bg-neutral-50"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <p className="text-xs text-neutral-600">
        Paper: {paperSize}. Choose “Save as PDF” in the print dialog to download.
      </p>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white hover:bg-neutral-800"
      >
        <Printer className="h-4 w-4" /> Print / Save PDF
      </button>
    </div>
  );
}
