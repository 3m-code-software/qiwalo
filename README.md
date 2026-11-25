# قيوالو — Qiwalo

سوق إقامة عربي للأقصر وأسوان. النسخة الحالية: **ويب أولاً، متجاوب مع الموبايل**، بنموذج مختلط خفيف (وحدات أفراد + فنادق صغيرة) بعمولة **12%** على الحجز المؤكد فقط.

## الحالة الحالية

- ✅ Next.js 16 + React 19 + TypeScript + Tailwind 4.
- ✅ Prisma schema + طبقة بيانات (Prisma أو بيانات تجريبية تلقائياً لو `DATABASE_URL` فاضي).
- ✅ Supabase Auth (إيميل + باسورد) مع أدوار GUEST / OWNER / ADMIN؛ الجلسة في كوكيز Supabase الآمنة.
- ✅ بحث بالفلاتر والترتيب، صفحة وحدة كاملة بالخريطة والمراجعات، حجز فوري، لوحة مالك، لوحة إدارة.
- ✅ ٤٠ وحدة عرض بتفاصيل كاملة + مالكين مختلفين + تقييمات عرض (موسومة داخلياً بـ `isDemo`).
- ✅ تحقق المالك (بطاقة وجه/ظهر + سيلفي بعد الموافقة + تاريخ ميلاد وعمر محسوب + شروط بتوقيت) وطابور مراجعة إداري.
- ✅ معاينة الإعلان قبل النشر + تقويم توفر وأسعار + عمولة قابلة للتعديل لكل مالك/شريك.
- ✅ شروط ضيف/مالك/منصة وسياسة الخصوصية «نسخة معتمدة» + بانر قبول غير محجوز + دعم واتساب/تليجرام 01066094050.
- ✅ إشعارات تليجرام مجانية + Resend/WhatsApp جاهزة؛ لو غير مضبوطة بيتم تسجيل بيانات الحجز في Vercel logs.
- ✅ Paymob webhook فقط (تحقق HMAC + تحديث حالة الحجز). **لا يوجد checkout حي بعد.**
- ✅ Cloudinary signed upload لصور الوحدات (السيرفر يوقّع، المالك يرفع من النموذج).
- ✅ خريطة Leaflet/OpenStreetMap مجانية بنقطتين (الوحدة + الاستلام) وزر اتجاهات Google Maps.
- ✅ شات Tawk.to في كل الصفحات (يُحمّل عبر `next/script` مع إجبار الأيقونة على الظهور).
- ✅ سيرفر MCP للقراءة فقط على `/api/mcp` بـ 4 أدوات دعم، محمي بـ `MCP_API_TOKEN`. التفاصيل: `docs/QIWALO-MCP.md`.
- ⏳ Vercel Blob / Paymob checkout حي / Flutter — لاحقاً.

## التشغيل محلياً

```bash
npm install
cp .env.example .env.local
npm run dev
```

افتح <http://localhost:3000>.

> لو `DATABASE_URL` فاضي، التطبيق يشتغل بـ 8 وحدات تجريبية في الأقصر وأسوان + حجوزات تجريبية. البيانات في الذاكرة (بتضيع عند إعادة تشغيل السيرفر). مع Supabase، الـ ٤٠ وحدة الإضافية بتتضاف بـ `npm run db:seed:demo`.

## المتغيرات البيئية

انسخ `.env.example` إلى `.env.local` واملأ المطلوب:

| المتغير | الحالة | الغرض |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | مطلوب | رابط الموقع (localhost للتطوير) |
| `SESSION_SECRET` | مطلوب | توقيع كوكي الجلسة — سلسلة عشوائية طويلة |
| `DATABASE_URL` | اختياري | Supabase Postgres. فاضي = بيانات تجريبية |
| `NEXT_PUBLIC_SUPABASE_URL` | مطلوب للدخول الحقيقي | `https://<PROJECT_REF>.supabase.co` (عام) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | مطلوب للدخول الحقيقي | مفتاح anon/public من لوحة Supabase (عام) |

### الربط بـ Supabase

استخدم **Session pooler** مش Direct connection — Direct في الخطة المجانية بيحل لـ IPv6 فقط ومش بيشتغل من شبكات IPv4 (زي Vercel وبعض الانترنت المحلي).

```env
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<PASSWORD>@<SESSION_POOLER_HOST>:5432/postgres?sslmode=require"
```

تجيب الرابط من Supabase → المشروع → **Connect → Connection pooling → Session pooler → URI**. بعدين:

```powershell
npm run db:push
npm run db:seed
```

نفس القيمة اتحطّت في Vercel → Settings → Environment Variables (**All Environments**) عشان الإنتاج يقرأ من قاعدة البيانات مش من بيانات الذاكرة.

### Supabase Auth

1. لوحة Supabase → **Authentication → Providers → Email** → عطّل **Confirm email** (الدخول فوري في الـ MVP).
2. **Project Settings → API** → انسخ **Project URL** و**anon public** key إلى `.env.local` وVercel (كل البيئات).
3. **Authentication → URL Configuration → Redirect URLs** → أضف `https://qiwalo-ygzh.vercel.app/reset-password` عشان رابط استعادة الباسورد يشتغل.
4. `/forgot-password` → `/reset-password` + `proxy.ts` (تجديد كوكيز Supabase) شغّالين؛ البانر بيحترم `termsAcceptedAt` بعد القبول.
5. اعمل حساب الأدمن الحقيقي مرة واحدة محلياً:

```powershell
$env:ADMIN_EMAIL = "you@example.com"
$env:ADMIN_PASSWORD = "كلمة-مرور-قوية"
$env:ADMIN_NAME = "إدارة قيوالو"
npm run db:seed:admin
```

الباسورد يتحط في المتغيرات البيئية فقط — **أبداً** في `.env.example` أو في الشات. السكربت ينشئ مستخدم Supabase Auth ويرقّيه لـ `ADMIN` في جدول `User`.

> ملاحظة أمنية: بما إن تأكيد الإيميل متوقف في الـ MVP، سجّل الدخول بحساباتك الحقيقية فقط. الدور بيُحدد عند أول creation ولا يتغيّر بتسجيل جديد بنفس البريد.

### إشعارات التسجيل وترحيب تليجرام

1. نموذج إنشاء الحساب فيه **رقم تليفون إلزامي** للضيف والمالك. بعد نجاح التسجيل، البوت يبعت لك (`TELEGRAM_ADMIN_CHAT_ID`) رسالة فيها **الاسم ورقم التليفون فقط**.
2. العميل يتحوّل لصفحة `/telegram` فيها رابط `https://t.me/<TELEGRAM_BOT_USERNAME>?start=<توكن موقّع>`؛ يضغطه ثم **Start** في البوت، فيوصله ترحيب **باسمه فقط**. الرابط اختياري والـ `next` محفوظ بعد التخطي.
3. عشان الـ webhook يشتغل، اضبط مرة واحدة بعد النشر: `TELEGRAM_BOT_USERNAME=qiwalo_notify_bot` و`TELEGRAM_WEBHOOK_SECRET=<قيمة عشوائية طويلة>` في Vercel، ثم شغّل `npm run telegram:webhook` محلياً بعد ما `.env.local` فيه `NEXT_PUBLIC_SITE_URL` والبوت والسر. السكربت يعمل `setWebhook` وما بيطبعش السر.
4. الـ webhook على `POST /api/telegram/webhook?secret=...` محمي بمقارنة ثابتة-الزمن؛ ما بيقبلش إلا التوكن الموقّع من السيرفر (صلاحية ٧ أيام) وما بيخزّنش رقم التليفون.
| `PAYMOB_SECRET_KEY` | مطلوب للـ webhook | مفتاح HMAC في لوحة Paymob |
| `CRON_SECRET` | لاحقاً | حماية مهام cron |
| `MCP_API_TOKEN` | مطلوب لتفعيل MCP | Bearer/API key لسيرفر القراءة فقط — Vercel Secrets فقط، ليس في الشات |
| `CLOUDINARY_CLOUD_NAME` | مطلوب للرفع | `dbmxnruhi` |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | مطلوب للرفع | حطّهم في Vercel/.env.local، مش في الشات |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | مطلوب للرفع | `qiwalo_units` |
| `BLOB_READ_WRITE_TOKEN` | لاحقاً | تخزين الفيديو/المرفقات |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `ADMIN_EMAIL` | اختياري | إشعارات الإيميل |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_ID` / `ADMIN_WHATSAPP` | اختياري | إشعارات واتساب Cloud |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_ADMIN_CHAT_ID` | موصى به | إشعارات تليجرام مجانية — تُحط في Vercel Secrets، مش في الشات |
| `TELEGRAM_BOT_USERNAME` / `TELEGRAM_WEBHOOK_SECRET` | مطلوب للترحيب | اسم البوت في رابط التفعيل (مش سر) + سر الـ webhook (Vercel Secrets فقط) |
| `BANK_NAME` / `BANK_ACCOUNT` / `BANK_IBAN` | اختياري | تفاصيل التحويل البنكي المعروضة للضيف |

## الحسابات

صفحة `/login` فيها وضعين: **دخول** (إيميل + باسورد) و**إنشاء حساب** (الاسم + الإيميل + رقم التليفون + الباسورد +نوع الحساب: ضيف / صاحب وحدة).

- الحسابات التجريبية (`@qiwalo.test`) بتظهر **فقط** محلياً لما Supabase Auth مش معرّف — في الإنتاج مش موجودة.
- الأدمن بيتعمل بسكربت `npm run db:seed:admin` (موضح فوق) ومش قابل للاختيار من نموذج التسجيل.
- الضيوف يقدروا يحجزوا **بدون حساب** — الحجز بيطلب الاسم والبريد والتليفون والجنسية وطريقة الدفع وقبول شروط الضيوف.
- بعد الحجز يقدر الضيف ينشئ حساب اختيارياً عشان يشوف تاريخ حجوزاته.
- الدفع الحالي: **تحويل بنكي أو كاش عند الوصول** — مفيش دفع إلكتروني حقيقي لسه.
- التقييم بيتسجل بعد ما الإدارة تحدّث الحجز لـ مكتمل، وبيروح للإدارة للمراجعة قبل النشر.

## الأوامر المفيدة

```bash
npm run dev        # تطوير
npm run build      # prisma generate + بناء الإنتاج
npm run typecheck  # فحص TypeScript
npm run lint       # ESLint
npx playwright install chromium   # مرة واحدة فقط
npm run test:e2e       # ٢٧ اختبار على Mock محلي (بدون Supabase/Cloudinary/إنتاج)
npm run test:recovery  # ٣ اختبارات لمسار استعادة كلمة المرور بـ Supabase وهمي
npm run qa:tour     # جولة تصويرية: ٢٢ خطوة × ديسكتوب/أندرويد (سيرفر Mock على 3140)
npm run db:generate
npm run db:push    # بعد ما تحط DATABASE_URL
npm run db:seed         # بيانات تجريبية: 3 مستخدمين + 8 وحدات + 3 حجوزات
npm run db:seed:demo    # ٤٠ وحدة عرض + ١٠ مالكين + ٩٤ تقييم عرض
npm run db:seed:admin   # حساب الأدمن الحقيقي (ADMIN_EMAIL/PASSWORD/NAME من البيئة)
```

## التوثيق والجولة التفقدية

- سجل التطوير الكامل (البنود ١–٣١ والإصلاحات): [`docs/IMPROVEMENTS-LOG.md`](docs/IMPROVEMENTS-LOG.md).
- صفحة تحميل أندرويد المستقلة (تظهر بعد الضغط على «تحميل تطبيق أندرويد» في الفوتر أو «تحميل» في الهيدر): `/download` — فيها ملف `qiwalo.apk` وأربع خطوات تثبيت مصوّرة، ومخفية من محركات البحث.
- صفحة تفعيل تليجرام بعد التسجيل: `/telegram` — رابط البوت مع توكن موقّع، وترحيب للعميل باسمه فقط؛ انظر [إشعارات التسجيل](#إشعارات-التسجيل-وترحيب-تليجرام).
- تقرير التجربة الشاملة مع **٤٤ لقطة شاشة** لكل خطوة على الديسكتوب والأندرويد، والقياسات وملاحظات UX: [`docs/QA-REPORT.md`](docs/QA-REPORT.md). الصور في `docs/qa/screenshots/` والنتائج الخام في `docs/qa/qa-results.json`.
- لإعادة الجولة: شغّل سيرفر Mock على المنفذ ٣١٤٠ مع تفريغ `DATABASE_URL` ومتغيرات Supabase/Telegram/Cloudinary/Resend/WhatsApp/البنك (زي ما في `playwright.config.ts`)، ثم `npm run qa:tour`. لا تتصل الجولة بالإنتاج ولا تستخدم أسراراً.

## Cloudinary (مُدمج ✅)

القيم اللي اتبعتت:

- Cloud Name: `dbmxnruhi`
- Upload Preset: `qiwalo_units` (Signed)

الرفع بيتم هكذا:

1. المالك بعد تسجيل الدخول يختار صورة من نموذج إضافة الوحدة.
2. المتصفح يبعتهلـ `POST /api/upload` (multipart).
3. المتصفح يضغّط الصورة تلقائياً (تصغير لأقصى 1600px + JPEG 82%)، ثم يبعتهلـ `POST /api/upload`.
4. الـ Route Handler بيتحقق من الجلسة ونوع الملف والحجم (لحد 4MB — تحت حد Vercel)، ويوقّع الرفع بالـ API Secret ويبعته لـ Cloudinary.
5. Cloudinary يرجّع `secure_url`، والصورة تظهر في معاينة النموذج وتتحفظ مع الوحدة.

> **لو ظهر «الرفع فشل. حاول مرة تانية.»**: غالباً الـ API Key في Cloudinary مفيش عليه صلاحية `create`. روح **Cloudinary → Settings → API Keys** وفعّل صلاحية الرفع/الإنشاء للـ key المستخدم (أو أنشئ key جديد بصلاحيات كاملة وحدّث `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` في Vercel + redeploy). الـ `api.ping()` شغال حتى لو صلاحية الرفع غير مفعّلة.

اللي لازم تضيفه **أنت** في `.env.local` أو Vercel (ما تبعتهوش في الشات):

```
CLOUDINARY_CLOUD_NAME=dbmxnruhi
CLOUDINARY_API_KEY=<من Settings → API Keys>
CLOUDINARY_API_SECRET=<من Settings → API Keys>
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=qiwalo_units
```

من غير `API_KEY` و`API_SECRET` الرفع هيقع برسالة واضحة في الواجهة. الـ Cloud Name والـ preset مش أسرار، موجودين في `.env.example`.

> `images.remotePatterns` في `next.config.ts` بيسمح بـ `res.cloudinary.com`، فالصور هتظهر مباشرة في البطاقات وصفحة الوحدة.

## Paymob webhook

- المسار: `POST /api/paymob/webhook`
- بيتحقق من HMAC باستخدام `PAYMOB_SECRET_KEY`.
- بيقرأ `order.merchant_order_id` كرقم الحجز (`QW-...`).
- لحد ما نعمل checkout حي، الحجز بيتأكد تجريبياً فوراً.

في لوحة Paymob: أضف Webhook URL = `https://<domain>/api/paymob/webhook` && انسخ الـ HMAC Secret إلى `PAYMOB_SECRET_KEY`.

## GitHub

المشروع مرفوع بالفعل على:

**https://github.com/3m-code-software/qiwalo** (Public، branch `main`)

لأي تحديث لاحق من مجلد `qiwalo-fresh`:

```bash
git add .
git commit -m "وصف التغيير"
git push
```

تأكد إن `.env.local` مش موجود في الـ commit (مستبعد في `.gitignore`).

## نشر Vercel (بعد GitHub)

1. Vercel → **Add New → Project** واختار repo `qiwalo`.
2. Framework: Next.js (بيكتشفه تلقائياً). Build command: `npm run build`.
3. في **Environment Variables** (All Environments) أضف: `NEXT_PUBLIC_SITE_URL`, `SESSION_SECRET`, `PAYMOB_SECRET_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`, `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. وللإشعارات/الدفع اليدوي (اختياري): `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_EMAIL`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `ADMIN_WHATSAPP`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `BANK_NAME`, `BANK_ACCOUNT`, `BANK_IBAN`.
4. انشر. لو بيانات تجريبية بس، الموقع هيشتغل من غير قاعدة بيانات.

## خريطة الطريق

1. ✅ الأساس + مسار الضيف + المالك/الإدارة + webhook.
2. ✅ Cloudinary signed upload لصور الوحدات.
3. ✅ ربط Supabase Postgres فعلي + Supabase Auth بدل الجلسة المؤقتة.
4. ✅ Sprint 1: ثقة/محتوى/خريطة/فلاتر/إشعارات/تحقق المالك/مراجعات.
5. ✅ اعتماد نصوص الشروط والخصوصية (`نسخة معتمدة`).
6. Paymob checkout حي + دومين مخصص.
7. Vercel Blob للفيديو/المرفقات + cron للتذكير.
8. Flutter لاحقاً بنفس الـ API/الـ repo layer.
