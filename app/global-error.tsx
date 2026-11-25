"use client";

import { useEffect } from "react";
import ErrorFallback from "@/components/ErrorFallback";

/**
 * Replaces the root layout when the layout itself throws.
 * Next.js 16: must be a Client Component and define its own <html>/<body>;
 * metadata exports are not supported here, so React's <title> is used instead.
 * Styles are inline in ErrorFallback because global CSS is not loaded in this document.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, background: "#faf8f4" }}>
        <title>حصل خلط بسيط | قيوالو</title>
        <ErrorFallback global onRetry={retry} />
      </body>
    </html>
  );
}
