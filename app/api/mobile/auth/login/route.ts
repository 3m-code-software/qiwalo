import { createClient } from "@supabase/supabase-js";
import { issueMobileToken, MOBILE_TOKEN_TTL_SECONDS } from "@/lib/mobile-auth";
import { getRepo } from "@/lib/repo";
import { isSupabaseConfigured } from "@/lib/supabase/server";

function invalid(error: string, note: string, status = 400) {
  return Response.json(
    { ok: false, error, note },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * تسجيل دخول المالك/السائق للتطبيق. الضيف لا يحتاج جلسة ويكمل الحجز مباشرة.
 * في الإنتاج يتحقق الباسورد عبر Supabase؛ في Mock يقبل أي باسورد ≥ ٦ أحرف
 * لحسابات الاختبار المعروفة، تماماً كوضع الديمو في واجهة الويب.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalid("invalid_json", "بيانات الطلب غير صالحة.");
  }

  const data = body as Record<string, unknown>;
  const email = String(data.email ?? "").trim().toLowerCase();
  const password = String(data.password ?? "");

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return invalid("invalid_request", "أدخل بريداً إلكترونياً صحيحاً.");
  }
  if (password.length < 6) {
    return invalid("invalid_request", "كلمة المرور يجب ألا تقل عن ٦ أحرف.");
  }

  if (isSupabaseConfigured()) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return invalid("invalid_credentials", "البريد أو كلمة المرور غير صحيحة.", 401);
    }
  } else if (process.env.NODE_ENV === "production") {
    return invalid(
      "auth_unavailable",
      "تسجيل الدخول غير مهيأ في هذه البيئة. تواصل مع الدعم.",
      503,
    );
  } else if (password !== (process.env.MOBILE_DEMO_PASSWORD ?? "Qiwalo123")) {
    // كلمة ديمو واحدة موثّقة للاختبار فقط؛ الإنتاج يستخدم Supabase ولا يمر من هنا.
    return invalid("invalid_credentials", "البريد أو كلمة المرور غير صحيحة.", 401);
  }

  const user = await (await getRepo()).getUserByEmail(email);
  if (!user) {
    return invalid("invalid_credentials", "هذا الحساب غير مسجّل في قيوالو. تواصل مع الدعم.", 401);
  }
  if (user.role === "GUEST") {
    return invalid("forbidden", "حساب الضيف لا يستخدم تسجيل الدخول في التطبيق.", 403);
  }

  const session = { email: user.email, name: user.name, role: user.role };
  const token = await issueMobileToken(session);

  return Response.json(
    {
      ok: true,
      token,
      expiresIn: MOBILE_TOKEN_TTL_SECONDS,
      user: session,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
