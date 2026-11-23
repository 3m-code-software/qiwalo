# قيوالو — Qiwalo

سوق إقامة عربي للأقصر وأسوان. النسخة الحالية: **ويب أولاً، متجاوب مع الموبايل**، بنموذج مختلط خفيف (وحدات أفراد + فنادق صغيرة) بعمولة **12%** على الحجز المؤكد فقط.

## الحالة الحالية

- ✅ Next.js 16 + React 19 + TypeScript + Tailwind 4.
- ✅ Prisma schema + طبقة بيانات (Prisma أو بيانات تجريبية تلقائياً لو `DATABASE_URL` فاضي).
- ✅ Supabase Auth (إيميل + باسورد) مع أدوار GUEST / OWNER / ADMIN؛ الجلسة في كوكيز Supabase الآمنة.
- ✅ بحث، صفحة وحدة، حجز تجريبي فوري، لوحة مالك، لوحة إدارة.
- ✅ Paymob webhook فقط (تحقق HMAC + تحديث حالة الحجز). **لا يوجد checkout حي بعد.**
- ✅ Cloudinary signed upload لصور الوحدات (السيرفر يوقّع، المالك يرفع من النموذج).
- ⏳ Vercel Blob / Resend / WhatsApp — لاحقاً.

## التشغيل محلياً

```bash
npm install
cp .env.example .env.local
npm run dev
```

افتح <http://localhost:3000>.

> لو `DATABASE_URL` فاضي، التطبيق يشتغل بـ 8 وحدات تجريبية في الأقصر وأسوان + حجوزات تجريبية. البيانات في الذاكرة (بتضيع عند إعادة تشغيل السيرفر).

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
3. اعمل حساب الأدمن الحقيقي مرة واحدة محلياً:

```powershell
$env:ADMIN_EMAIL = "you@example.com"
$env:ADMIN_PASSWORD = "كلمة-مرور-قوية"
$env:ADMIN_NAME = "إدارة قيوالو"
npm run db:seed:admin
```

الباسورد يتحط في المتغيرات البيئية فقط — **أبداً** في `.env.example` أو في الشات. السكربت ينشئ مستخدم Supabase Auth ويرقّيه لـ `ADMIN` في جدول `User`.

> ملاحظة أمنية: بما إن تأكيد الإيميل متوقف في الـ MVP، سجّل الدخول بحساباتك الحقيقية فقط. الدور بيُحدد عند أول creation ولا يتغيّر بتسجيل جديد بنفس البريد.
| `PAYMOB_SECRET_KEY` | مطلوب للـ webhook | مفتاح HMAC في لوحة Paymob |
| `CRON_SECRET` | لاحقاً | حماية مهام cron |
| `CLOUDINARY_CLOUD_NAME` | مطلوب للرفع | `dbmxnruhi` |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | مطلوب للرفع | حطّهم في Vercel/.env.local، مش في الشات |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | مطلوب للرفع | `qiwalo_units` |
| `BLOB_READ_WRITE_TOKEN` | لاحقاً | تخزين الفيديو/المرفقات |
| `RESEND_API_KEY` / `WHATSAPP_*` | لاحقاً | الإشعارات |

## الحسابات

صفحة `/login` فيها وضعين: **دخول** (إيميل + باسورد) و**إنشاء حساب** (الاسم + الإيميل + الباسورد +نوع الحساب: ضيف / صاحب وحدة).

- الحسابات التجريبية (`@qiwalo.test`) بتظهر **فقط** محلياً لما Supabase Auth مش معرّف — في الإنتاج مش موجودة.
- الأدمن بيتعمل بسكربت `npm run db:seed:admin` (موضح فوق) ومش قابل للاختيار من نموذج التسجيل.
- الضيوف يقدروا يحجزوا **بدون حساب** — الحجز بيطلب الاسم والبريد والتليفون بس.

## الأوامر المفيدة

```bash
npm run dev        # تطوير
npm run build      # prisma generate + بناء الإنتاج
npm run typecheck  # فحص TypeScript
npm run lint       # ESLint
npm run db:generate
npm run db:push    # بعد ما تحط DATABASE_URL
npm run db:seed         # بيانات تجريبية: 3 مستخدمين + 8 وحدات + 3 حجوزات
npm run db:seed:admin   # حساب الأدمن الحقيقي (ADMIN_EMAIL/PASSWORD/NAME من البيئة)
```

## Cloudinary (مُدمج ✅)

القيم اللي اتبعتت:

- Cloud Name: `dbmxnruhi`
- Upload Preset: `qiwalo_units` (Signed)

الرفع بيتم هكذا:

1. المالك بعد تسجيل الدخول يختار صورة من نموذج إضافة الوحدة.
2. المتصفح يبعتهلـ `POST /api/upload` (multipart).
3. الـ Route Handler بيتحقق من الجلسة ونوع الملف والحجم (لحد 5MB)، وبعدين يوقّع الرفع بالـ API Secret ويبعته لـ Cloudinary.
4. Cloudinary يرجّع `secure_url`، والصورة تظهر في معاينة النموذج وتتحفظ مع الوحدة.

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
3. في **Environment Variables** (All Environments) أضف: `NEXT_PUBLIC_SITE_URL`, `SESSION_SECRET`, `PAYMOB_SECRET_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`, `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. انشر. لو بيانات تجريبية بس، الموقع هيشتغل من غير قاعدة بيانات.

## خريطة الطريق

1. ✅ الأساس + مسار الضيف + المالك/الإدارة + webhook.
2. ✅ Cloudinary signed upload لصور الوحدات.
3. ✅ ربط Supabase Postgres فعلي + Supabase Auth بدل الجلسة المؤقتة.
4. Paymob checkout حي.
5. Vercel Blob للفيديو/المرفقات.
6. Resend / WhatsApp + cron للتذكير.
7. Flutter لاحقاً بنفس الـ API/الـ repo layer.
