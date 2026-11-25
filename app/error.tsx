"use client";

import { useEffect } from "react";
import ErrorFallback from "@/components/ErrorFallback";

/**
 * Error boundary for route segments below the root layout.
 * Next.js 16: must be a Client Component; `retry()` re-fetches/re-renders the segment.
 * The raw error is logged only — never shown to the guest.
 */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorFallback onRetry={retry} />;
}
