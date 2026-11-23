import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const instant = false;

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const role = Array.isArray(sp.role) ? sp.role[0] : sp.role;
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="soft-card">
        <div className="mb-6 text-center">
          <span className="chip">دخول قيوالو</span>
          <h1 className="mt-3 text-2xl font-black">أهلاً بك</h1>
          <p className="muted mt-1 text-sm">سجّل الدخول أو أنشئ حساباً جديداً ببريدك.</p>
        </div>
        <LoginForm next={next} role={role} showDemo={!isSupabaseConfigured()} />
      </div>
      <p className="muted mt-5 text-center text-xs">
        بإنشاء حساب أنت توافق على{" "}
        <Link href="/terms/guest" className="font-bold text-navy underline decoration-gold underline-offset-2">شروط الضيوف</Link>
        {" "}أو{" "}
        <Link href="/terms/owner" className="font-bold text-navy underline decoration-gold underline-offset-2">شروط المالكين</Link>.
      </p>
    </div>
  );
}
