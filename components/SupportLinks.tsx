import { SUPPORT_PHONE, SUPPORT_TELEGRAM, SUPPORT_WHATSAPP } from "@/lib/constants";

function SupportIcon({ kind }: { kind: "wa" | "tg" | "tel" }) {
  if (kind === "wa") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor">
        <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm3.2 3.1c-.4 0-.8.2-1 .6-.3.4-.9 1.1-.9 2.5 0 1.4.9 2.7 2 3.2.5.2.9.3 1.2.2.3 0 .6-.1.9-.4.3-.2.5-.6.6-.9.1-.3 0-.5-.1-.7l-.5-.9c-.2-.3-.4-.4-.6-.4-.2 0-.4.1-.5.3l-.3.4c-.4-.2-.7-.5-.9-.8-.2-.3-.3-.6-.3-.9 0-.3.1-.5.3-.6l.3-.3c.1-.1.2-.3.1-.5l-.2-.5c-.1-.2-.3-.4-.6-.4z" />
      </svg>
    );
  }
  if (kind === "tg") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor">
        <path d="M3 11.2 20.5 3.5c.8-.3 1.6.5 1.3 1.3L14.2 21c-.4.9-1.6.8-1.8-.2l-1.4-6.3-6.1-2.2c-.9-.3-.9-1.4-.1-1.6l1.5-.4 7.6-4.8-6 .4c-.3 0-.6-.1-.9-.3L3 11.2z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor">
      <path d="M6 3h3.5l1.8 4.6-2.6 1.8a13 13 0 0 0 6 6l1.8-2.6L21 15v3.5c0 1.4-1.1 2.5-2.5 2.5C10.3 21 3 13.7 3 5.5 3 4.1 4.1 3 5.5 3H6z" />
    </svg>
  );
}

export default function SupportLinks({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-1 text-white/70">
        <a
          href={SUPPORT_WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="واتساب دعم قيوالو"
          title="واتساب"
          className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-[0.7rem] font-bold transition hover:bg-white/10 hover:text-gold-bright"
        >
          <SupportIcon kind="wa" />
          <span className="hidden xl:inline">واتساب</span>
        </a>
        <a
          href={SUPPORT_TELEGRAM}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="تليجرام دعم قيوالو"
          title="تليجرام"
          className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-[0.7rem] font-bold transition hover:bg-white/10 hover:text-gold-bright"
        >
          <SupportIcon kind="tg" />
          <span className="hidden xl:inline">تليجرام</span>
        </a>
        <a
          href={`tel:${SUPPORT_PHONE}`}
          aria-label={`الاتصال بدعم قيوالو على ${SUPPORT_PHONE}`}
          title={SUPPORT_PHONE}
          className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-[0.7rem] font-bold transition hover:bg-white/10 hover:text-gold-bright"
        >
          <SupportIcon kind="tel" />
          <span dir="ltr" className="hidden xl:inline">{SUPPORT_PHONE}</span>
        </a>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5 text-sm text-white/65">
      <li>
        <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition hover:text-gold-bright">
          <SupportIcon kind="wa" />
          <span>واتساب</span>
        </a>
      </li>
      <li>
        <a href={SUPPORT_TELEGRAM} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition hover:text-gold-bright">
          <SupportIcon kind="tg" />
          <span>تليجرام</span>
        </a>
      </li>
      <li>
        <a href={`tel:${SUPPORT_PHONE}`} className="inline-flex items-center gap-2 transition hover:text-gold-bright">
          <SupportIcon kind="tel" />
          <span dir="ltr">{SUPPORT_PHONE}</span>
        </a>
      </li>
    </ul>
  );
}
