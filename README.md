# قيوالو — Qiwalo

سوق إقامة عربي للأقصر وأسوان. النسخة الحالية: **ويب أولاً، متجاوب مع الموبايل**، بنموذج مختلط خفيف (وحدات أفراد + فنادق صغيرة) بعمولة **12%** على الحجز المؤكد فقط.

## الحالة الحالية

- ✅ Next.js 16 + React 19 + TypeScript + Tailwind 4.
- ✅ Prisma schema + طبقة بيانات (Prisma أو بيانات تجريبية تلقائياً لو `DATABASE_URL` فاضي).
- ✅ تسجيل دخول مؤقت بـ JWT cookie موقّع (`jose`) — يُستبدل لاحقاً بـ Supabase Auth.
- ✅ بحث، صفحة وحدة، حجز تجريبي فوري، لوحة مالك، لوحة إدارة.
- ✅ Paymob webhook فقط (تحقق HMAC + تحديث حالة الحجز). **لا يوجد checkout حي بعد.**
- ⏳ Cloudinary / Vercel Blob / Resend / WhatsApp — الخطوات الخارجية مطلوبة منك، الكود لاحقاً.

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
| `CLOUDINARY_*` | لاحقاً | رفع صور الملاك |
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
```

## اللي لازم تعمله أنت خارجياً (Cloudinary)

الخطوات دي محتاجة منك في حسابك، وأنا هكتب الكود بعد ما ترسللي القيم (ما تبعتهاش في الشات لو حساسة — حطّها في Vercel مباشرة):

1. اعمل حساب على <https://cloudinary.com> (الخطة المجانية كافية للمبدأ).
2. من الـ Dashboard انسخ **Cloud Name**.
3. افتح `Settings → API Keys` واعمل **Generate New API Secret** (أو استخدم الحالي). انسخ `API Key` و`API Secret`.
4. اعمل **Upload Preset** من `Settings → Upload` (أو Media Library → Upload Presets):
   - الاسم: `qiwalo_units`.
   - التوقيع: **Signed** (أفضل للأمان — التوقيع هيتم على السيرفر).
   - Folder: `qiwalo`.
   - الصلاحيات: رفع فقط، منع الحذف العام.
5. فعّل **Auto format / quality** في transformation الافتراضية لو متاح، وحدد `f_auto,q_auto` للعرض.
6. جرّب ترفع صورة تجريبية من Media Library وتأكد إن الرابط بيفتح.
7. في VercelLater (أو `.env.local` محلياً) أضف:
   ```
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=qiwalo_units
   ```
8. ابعتلي **الـ Cloud Name واسم الـ preset فقط** عشان أظبط الـ URLs. الـ API Secret خليه في Vercel بس.

> ملاحظة: `images.remotePatterns` في `next.config.ts` بيسمح بالفعل بـ `res.cloudinary.com`، فالصور هتظهر مباشرة.

## Paymob webhook

- المسار: `POST /api/paymob/webhook`
- بيتحقق من HMAC باستخدام `PAYMOB_SECRET_KEY`.
- بيقرأ `order.merchant_order_id` كرقم الحجز (`QW-...`).
- لحد ما نعمل checkout حي، الحجز بيتأكد تجريبياً فوراً.

في لوحة Paymob: أضف Webhook URL = `https://<domain>/api/paymob/webhook` && انسخ الـ HMAC Secret إلى `PAYMOB_SECRET_KEY`.

## رفع المشروع على GitHub (أنت تعملها)

من مجلد `qiwalo-fresh`:

```bash
git init
git add .
git commit -m "Qiwalo web MVP: booking marketplace for Luxor & Aswan"
git branch -M main
git remote add origin https://github.com/<USERNAME>/qiwalo.git
git push -u origin main
```

تأكد إن `.env.local` مش موجود في الـ commit (مستبعد في `.gitignore`).

## نشر Vercel (بعد GitHub)

1. Vercel → **Add New → Project** واختار repo `qiwalo`.
2. Framework: Next.js (بيكتشفه تلقائياً). Build command: `npm run build`.
3. في **Environment Variables** أضف: `NEXT_PUBLIC_SITE_URL`, `SESSION_SECRET`, `PAYMOB_SECRET_KEY`، و`DATABASE_URL` لو حابب تربط Supabase.
4. انشر. لو بيانات تجريبية بس، الموقع هيشتغل من غير قاعدة بيانات.

## خريطة الطريق

1. ✅ الأساس + مسار الضيف + المالك/الإدارة + webhook.
2. ربط Supabase Postgres فعلي + استبدال الجلسة المؤقتة.
3. Paymob checkout حي.
4. Cloudinary + Blob للصور/الفيديو.
5. Resend / WhatsApp + cron للتذكير.
6. Flutter لاحقاً بنفس الـ API/الـ repo layer.
