"use client";

import { Printer } from "lucide-react";

export function PrintButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" className="btn btn-primary" onClick={() => window.print()}>
      <Printer className="size-4" aria-hidden />
      {children}
    </button>
  );
}
