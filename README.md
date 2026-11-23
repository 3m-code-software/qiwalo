# قيوالو — Qiwalo

سوق إقامة عربي للأقصر وأسوان. النسخة الحالية: **ويب أولاً، متجاوب مع الموبايل**، بنموذج مختلط خفيف (وحدات أفراد + فنادق صغيرة) بعمولة **12%** على الحجز المؤكد فقط.

## الحالة الحالية

- ✅ Next.js 16 + React 19 + TypeScript + Tailwind 4.
- ✅ Prisma schema + طبقة بيانات (Prisma أو بيانات تجريبية تلقائياً لو `DATABASE_URL` فاضي).
- ✅ تسجيل دخول مؤقت بـ JWT cookie موقّع (`jose`) — يُستبدل لاحقاً بـ Supabase Auth.
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
| `PAYMOB_SECRET_KEY` | مطلوب للـ webhook | مفتاح HMAC في لوحة Paymob |
| `CRON_SECRET` | لاحقاً | حماية مهام cron |
| `CLOUDINARY_CLOUD_NAME` | مطلوب للرفع | `dbmxnruhi` |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | مطلوب للرفع | حطّهم في Vercel/.env.local، مش في الشات |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | مطلوب للرفع | `qiwalo_units` |
| `BLOB_READ_WRITE_TOKEN` | لاحقاً | تخزين الفيديو/المرفقات |
| `RESEND_API_KEY` / `WHATSAPP_*` | لاحقاً | الإشعارات |

## الحسابات التجريبية

من صفحة `/login` تقدر تدخل مباشرة بأي من:

| البريد | الدور |
|---|---|
| `guest@qiwalo.test` | ضيف |
| `owner@qiwalo.test` | مالك |
| `admin@qiwalo.test` | إدارة (ينشر الوحدات المعلّقة) |

أو اكتب أي بريد جديد && هيتم إنشاء حساب تلقائي.

## الأوامر المفيدة

```bash
npm run dev        # تطوير
npm run build      # prisma generate + بناء الإنتاج
npm run typecheck  # فحص TypeScript
npm run lint       # ESLint
npm run db:generate
npm run db:push    # بعد ما تحط DATABASE_URL
npm run db:seed    # بيانات تجريبية: 3 مستخدمين + 8 وحدات + 3 حجوزات
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
3. في **Environment Variables** أضف: `NEXT_PUBLIC_SITE_URL`, `SESSION_SECRET`, `PAYMOB_SECRET_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`، و`DATABASE_URL` لو حابب تربط Supabase.
4. انشر. لو بيانات تجريبية بس، الموقع هيشتغل من غير قاعدة بيانات.

## خريطة الطريق

1. ✅ الأساس + مسار الضيف + المالك/الإدارة + webhook.
2. ✅ Cloudinary signed upload لصور الوحدات.
3. ربط Supabase Postgres فعلي + استبدال الجلسة المؤقتة.
4. Paymob checkout حي.
5. Vercel Blob للفيديو/المرفقات.
6. Resend / WhatsApp + cron للتذكير.
7. Flutter لاحقاً بنفس الـ API/الـ repo layer.
