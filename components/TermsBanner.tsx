"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { acceptTermsAction } from "@/app/actions";

const ACK_KEY = "qiwalo-terms-ack-v1";
const subscribe = () => () => {};
const getAcknowledged = () => {
  try {
    return window.localStorage.getItem(ACK_KEY) === "1";
  } catch {
    return false;
  }
};
const getServerAcknowledged = () => false;

export default function TermsBanner({ accepted = false }: { accepted?: boolean }) {
  const pathname = usePathname() || "/";
  const acknowledged = useSyncExternalStore(subscribe, getAcknowledged, getServerAcknowledged);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (accepted || acknowledged) return;
    const timer = window.setTimeout(() => setVisible(true), 10_000);
    return () => window.clearTimeout(timer);
  }, [accepted, acknowledged]);

  function acknowledge() {
    try {
      window.localStorage.setItem(ACK_KEY, "1");
    } catch {
      /* Ignore storage failures; hiding locally is enough. */
    }
    setDismissed(true);
  }

  if (accepted || acknowledged || !visible || dismissed) return null;

  const isOwnerArea =
    pathname === "/owner" ||
    pathname.startsWith("/owner/") ||
    pathname === "/admin/owner" ||
    pathname.startsWith("/admin/owner/");
  const termsHref = isOwnerArea ? "/terms/owner" : "/terms/guest";

  return (
    <aside
      dir="rtl"
      aria-label="تنبيه شروط الاستخدام"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border border-gold/40 bg-navy-deep/95 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.75)] backdrop-blur-xl"
    >
      <div className="flex items-start gap-3 p-3.5">
        <button
          type="button"
          onClick={acknowledge}
          aria-label="إغلاق التنبيه"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-lg leading-none text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          ×
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-white">قبل أن تكمل، راجع شروط الاستخدام</p>
          <p className="muted mt-1 text-[0.72rem] leading-6 text-white/60">
            نسخة معتمدة — البنود الجوهرية واضحة وقابلة للتنفيذ.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <form action={acceptTermsAction}>
              <input type="hidden" name="next" value={pathname} />
              <button
                type="submit"
                onClick={acknowledge}
                className="rounded-lg bg-gradient-to-l from-gold-bright to-gold px-4 py-1.5 text-xs font-extrabold text-navy-deep transition hover:brightness-105"
              >
                قبول
              </button>
            </form>
            <Link
              href={termsHref}
              onClick={acknowledge}
              className="rounded-lg border border-white/20 px-4 py-1.5 text-xs font-bold text-white/80 transition hover:border-gold/60 hover:text-gold-bright"
            >
              مراجعة الشروط
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
