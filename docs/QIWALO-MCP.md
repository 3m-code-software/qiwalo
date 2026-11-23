# قيوالو — سيرفر MCP للقراءة فقط

## الغرض

سيرفر MCP خاص بقيوالو يسمح للوكيل الذكي أو فريق الدعم بالحصول على **بيانات حية للقراءة فقط** من المنصة، بدون أي قدرة على التعديل أو الحجز أو الدفع أو الوصول لبيانات العملاء الحساسة.

- **الرابط:** `https://qiwalo-ygzh.vercel.app/api/mcp`
- **النوع:** Streamable HTTP، stateless، JSON responses
- **المصادقة:** API Key / Bearer token
- **القاعدة:** لا أدوات كتابة، لا دفع، لا أسرار عملاء، لا وثائق توثيق الملاك.

---

## تعبئة فورم الـ MCP Server

| الحقل | القيمة |
|---|---|
| **Name** | `Qiwalo Support MCP` |
| **Description** | `Read-only tools for Qiwalo customer support: search units, check booking status, and read policies. No writes, no payments, no customer secrets.` |
| **Label** | `qiwalo-support` |
| **URL** | `https://qiwalo-ygzh.vercel.app/api/mcp` |
| **Authentication method** | `API Key` |
| **API Key / Header** | `Authorization: Bearer <MCP_API_TOKEN>` |

> لو الفورم يعرض `OAuth 2.0` و`API Key` معاً، اختر **API Key**. الـ token يُخزَّن في أسرار المنصة/Vercel فقط، ولا يُكتب في الشات ولا في الملفات.

---

## تجهيز الـ Token على Vercel

1. افتح Vercel → مشروع `qiwalo-ygzh` → **Settings → Environment Variables**.
2. أضف متغيراً جديداً:
   - **Key:** `MCP_API_TOKEN`
   - **Value:** أنشئ قيمة عشوائية طويلة محلياً، مثلاً:
     ```powershell
     [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }))
     ```
     أو على Linux/macOS:
     ```bash
     openssl rand -hex 32
     ```
   - **Environments:** Production + Preview + Development.
3. احفظ، ثم أعد النشر (Redeploy) أو ادفع commit جديد على `main`.
4. الصق نفس القيمة في حقل الـ API Key في منصة الوكيل. **لا ترسلها لأي محادثة.**

لو المتغير غير موجود، الـ endpoint يرجع `503 mcp_not_configured`. لو الـ token غلط أو ناقص، يرجع `401 unauthorized`.

---

## الأدوات المتاحة

| الأداة | المدخلات | ما ترجعه | محظورات |
|---|---|---|---|
| `search_units` | `city`, `type`, `q`, `minPrice`, `maxPrice`, `minRating`, `guests`, `checkIn`, `checkOut`, `amenities`, `sort` | حتى 20 وحدة منشورة: الاسم، الرابط، المدينة، النوع، السعر، التقييم، المرافق، الصور، الخريطة، سياسة الإلغاء | لا ترجع `ownerId` أو العمولة أو حالة المراجعة |
| `get_unit_details` | `slug` | تفاصيل وحدة منشورة + حتى 10 تقييمات منشورة | الوحدات غير المنشورة تظهر كـ `found: false` |
| `get_booking_status` | `reference` | ملخص محدود: رقم الحجز، اسم الوحدة، التواريخ، الحالة، طريقة الدفع، رقم الدعم | لا اسم الضيف، لا جنسية، لا ملاحظات دفع، لا مبالغ، لا IDs داخلية |
| `get_policies` | `topic` اختياري: `all`, `payment`, `cancellation`, `owner`, `privacy` | نصوص السياسات + روابط الصفحات + قنوات الدعم + عبارة الدفع المعتمدة | لا تؤكد صياغة قانونية نهائية؛ الصفحات لسه مسودات |

كل الأدوات موسومة بـ:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false,
  "idempotentHint": true,
  "openWorldHint": false
}
```

---

## عبارة الدفع الثابتة

تُعاد في `get_policies` وفي ملخص الحجز حرفياً:

> تحويل بنكي أو كاش عند الوصول

لا توجد أداة دفع، ولا أدوات Paymob، ولا أي تعديل على قاعدة البيانات.

---

## اختبار سريع محلياً

```powershell
$env:MCP_API_TOKEN = "<same-test-token>"
npm run dev
```

ثم من عميل MCP أو سكربت اختبار، اربط بـ:

```
http://localhost:3000/api/mcp
Authorization: Bearer <same-test-token>
```

افحص:
- `tools/list` → 4 أدوات فقط.
- `tools/call` على `get_policies` → يرجع عبارة الدفع ورقم الدعم `01066094050`.
- `tools/call` على `search_units` → يرجع وحدات منشورة فقط.
- طلب بدون token → `401`.

---

## الملفات المرتبطة

- `app/api/mcp/route.ts` — التنفيذ.
- `lib/repo/index.ts` — طبقة القراءة من Supabase/Prisma أو البيانات التجريبية.
- `lib/constants.ts` — العمولة، المدن، أنواع الوحدات، سياسات الإلغاء، ورقم الدعم.
- `docs/QIWALO-SUPPORT-TRAINING.md` — المرجع البشري لفريق الدعم.
- `docs/QIWALO-AI-AGENT-SPEC.md` — مواصفات الوكيل الذكي.
