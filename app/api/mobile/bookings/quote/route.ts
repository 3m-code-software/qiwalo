import { parseStayBody, quoteStayForMobile } from "@/lib/booking-service";

/**
 * BFF للقراءة فقط: تسعير حجز قبل التأكيد.
 * الموبايل يرسل الوحدة والتواريخ وعدد الضيوف فقط؛ السعر يحسبه الخادم دائماً.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "invalid_json", note: "بيانات الطلب غير صالحة." },
      { status: 400 },
    );
  }

  const parsed = parseStayBody(body);
  if (!parsed.ok) {
    return Response.json(
      { ok: false, error: "invalid_request", note: parsed.error },
      { status: 400 },
    );
  }

  try {
    const result = await quoteStayForMobile(parsed.selection);
    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error: result.code ?? "quote_unavailable",
          note: result.error,
        },
        { status: 400 },
      );
    }
    return Response.json(
      { ok: true, quote: result.quote },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const note = error instanceof Error ? error.message : "خطأ غير متوقع";
    return Response.json(
      { ok: false, error: "quote_failed", note },
      { status: 500 },
    );
  }
}
