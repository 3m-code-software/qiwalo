# تقرير التجربة الشاملة — قيوالو

**التاريخ:** ٢٥ نوفمبر ٢٠٢٦  
**النسخة المُختبرة:** المشروع الحالي على `main` قبل إضافة هذا التقرير (`ff9f63d`)  
**الهدف:** تجربة مسار التطبيق خطوة بخطوة على سطح المكتب والأندرويد، وتصوير كل خطوة، وتدوين ملاحظات UX دون تغيير سلوك المنتج.

## ملخص تنفيذي

- ✅ **٤٤ لقطة شاشة**: ٢٢ خطوة × منصّتين (سطح مكتب `1440×900` + محاكاة أندرويد `Pixel 7`).
- ✅ **صفر أخطاء JavaScript أو شاشات «حصل خلط بسيط»** في كل الخطوات.
- ✅ **صفر تمرير أفقي، صور مكسورة، نصوص مقطوعة، أو صور بلا `alt`** وقت الالتقاط.
- ✅ **`dir="rtl"`** في كل الصفحات، والصورة اللاصقة في «رحلتك مع قيوالو» ظهرت بالعنوان الصحيح على المنصّتين.
- ✅ مسار الحجز الكامل اكتمل مرتين: `QW-MWW1KX85-81XV` (ديسكتوب) و`QW-MWW1LBD7-O0EA` (أندرويد) — بيانات Mock في الذاكرة، لا حجز حقيقي.
- 📝 ٤ ملاحظات تحسين غير حرجة (مساحات لمس، حجم خط التوقيع، اعتماد الصور الخارجية، كثافة لوحات الإدارة) موثّقة في [الملاحظات](#ملاحظات-ux-وتحسينات-مقترحة) ولم تُنفّذ في هذا البند.

## بيئة الفحص

| العنصر | القيمة |
|---|---|
| السيرفر | `next dev` محلي على `http://localhost:3140` |
| البيانات | وضع **Mock**: `DATABASE_URL` وSupabase وTelegram وResend وWhatsApp وCloudinary وبيانات البنك كلها فاضية |
| المتصفح | Chromium عبر Playwright `1.65.1` |
| سطح المكتب | `1440×900`، لا محاكاة لمس |
| أندرويد | جهاز `Pixel 7` من Playwright (وكيل أندرويد + لمس + مقاس الهاتف، `deviceScaleFactor: 1` لتخفيف حجم الصور) — **محاكاة برمجية وليست جهازاً فيزيائياً** |
| اللغة | `ar-EG`، RTL |
| الأسرار | لا قيم حقيقية، لا اتصال بالإنتاج، لا إيميلات أو إشعارات فعلية |
| الأداة | [`scripts/qa-tour.mjs`](../scripts/qa-tour.mjs) — تُشغّل بـ `npm run qa:tour` |
| البيانات الخام | [`qa/qa-results.json`](qa/qa-results.json) |

> **إعادة الجولة:** ابدأ سيرفر Mock على المنفذ ٣١٤٠ مع تفريغ متغيرات البيئة المذكورة أعلاه، ثم من ترمينال ثانٍ: `npm run qa:tour`. السكربت ينتظر السيرفر، ينفّذ الخطوات على المنصّتين، ويكتب الصور والنتائج في `docs/qa/`.

## القياسات الآلية

| الفحص | الديسكتوب | أندرويد |
|---|---|---|
| لقطات تم التقاطها | ٢٢/٢٢ ✅ | ٢٢/٢٢ ✅ |
| أخطاء `pageerror` / فشل خطوات | ٠ ✅ | ٠ ✅ |
| شاشة خطأ «حصل خلط بسيط» | ٠ ✅ | ٠ ✅ |
| تمرير أفقي (`scrollWidth - innerWidth`) | ٠ ✅ | ٠ ✅ |
| صور مكسورة / بلا `alt` | ٠ / ٠ ✅ | ٠ / ٠ ✅ |
| نصوص مقطوعة (`text-overflow`) | ٠ ✅ | ٠ ✅ |
| `dir` | `rtl` ✅ | `rtl` ✅ |
| «رحلتك مع قيوالو» عند المرحلة ٤ | العنوان «معالم أسوان»، صورة لاصقة عند `y = 96` ✅ | العنوان «معالم أسوان»، صورة لاصقة عند `y = 64` ✅ |
| تأكيد الحجز | `QW-MWW1KX85-81XV` ✅ | `QW-MWW1LBD7-O0EA` ✅ |

> ملاحظة قياسية: عدّاد `h1` أظهر ٢–٣ في لحظة الالتقاط على بعض الصفحات (الوحدة، الحجز، الدفع، المالك، الإدارة) بسبب بثّ Next.js أثناء التحميل؛ إعادة فحص الصفحات بعد اكتمال التحميل أظهرت `h1` واحداً في كل صفحة. لا إجراء مطلوب.

## اللقطات خطوة بخطوة

| # | الخطوة | سطح المكتب (١٤٤٠×٩٠٠) | أندرويد (Pixel 7) |
|---|---|---|---|
| ١ | الرئيسية — أعلى الصفحة | <img src="qa/screenshots/desktop-01-home.jpg" alt="الرئيسية على الديسكتوب" width="320"> | <img src="qa/screenshots/android-01-home.jpg" alt="الرئيسية على أندرويد" width="180"> |
| ٢ | سكرول «رحلتك مع قيوالو» — المرحلة ٤ | <img src="qa/screenshots/desktop-02-journey.jpg" alt="الرحلة على الديسكتوب" width="320"> | <img src="qa/screenshots/android-02-journey.jpg" alt="الرحلة على أندرويد" width="180"> |
| ٣ | البحث — كل النتائج | <img src="qa/screenshots/desktop-03-search.jpg" alt="البحث على الديسكتوب" width="320"> | <img src="qa/screenshots/android-03-search.jpg" alt="البحث على أندرويد" width="180"> |
| ٤ | صفحة الوحدة والتفاصيل | <img src="qa/screenshots/desktop-04-unit.jpg" alt="الوحدة على الديسكتوب" width="320"> | <img src="qa/screenshots/android-04-unit.jpg" alt="الوحدة على أندرويد" width="180"> |
| ٥ | تسجيل الدخول — حسابات تجريبية | <img src="qa/screenshots/desktop-05-login.jpg" alt="الدخول على الديسكتوب" width="320"> | <img src="qa/screenshots/android-05-login.jpg" alt="الدخول على أندرويد" width="180"> |
| ٦ | البحث بعد تحديد التواريخ والضيوف | <img src="qa/screenshots/desktop-06-search-filtered.jpg" alt="بحث مفلتر على الديسكتوب" width="320"> | <img src="qa/screenshots/android-06-search-filtered.jpg" alt="بحث مفلتر على أندرويد" width="180"> |
| ٧ | الوحدة مع نموذج الحجز مملوء بالتواريخ | <img src="qa/screenshots/desktop-07-unit-booking.jpg" alt="نموذج الحجز على الديسكتوب" width="320"> | <img src="qa/screenshots/android-07-unit-booking.jpg" alt="نموذج الحجز على أندرويد" width="180"> |
| ٨ | الدفع — البيانات جاهزة والتحقق من الشروط | <img src="qa/screenshots/desktop-08-checkout.jpg" alt="الدفع على الديسكتوب" width="320"> | <img src="qa/screenshots/android-08-checkout.jpg" alt="الدفع على أندرويد" width="180"> |
| ٩ | تأكيد الحجز `QW-…` | <img src="qa/screenshots/desktop-09-booking-confirmed.jpg" alt="تأكيد الحجز على الديسكتوب" width="320"> | <img src="qa/screenshots/android-09-booking-confirmed.jpg" alt="تأكيد الحجز على أندرويد" width="180"> |
| ١٠ | تفاصيل الدفع والتحويل البنكي | <img src="qa/screenshots/desktop-10-payment.jpg" alt="الدفع على الديسكتوب" width="320"> | <img src="qa/screenshots/android-10-payment.jpg" alt="الدفع على أندرويد" width="180"> |
| ١١ | المفضلة بعد حفظ وحدة | <img src="qa/screenshots/desktop-11-favorites.jpg" alt="المفضلة على الديسكتوب" width="320"> | <img src="qa/screenshots/android-11-favorites.jpg" alt="المفضلة على أندرويد" width="180"> |
| ١٢ | لوحة المالك | <img src="qa/screenshots/desktop-12-owner.jpg" alt="لوحة المالك على الديسكتوب" width="320"> | <img src="qa/screenshots/android-12-owner.jpg" alt="لوحة المالك على أندرويد" width="180"> |
| ١٣ | إضافة وحدة جديدة | <img src="qa/screenshots/desktop-13-owner-new.jpg" alt="إضافة وحدة على الديسكتوب" width="320"> | <img src="qa/screenshots/android-13-owner-new.jpg" alt="إضافة وحدة على أندرويد" width="180"> |
| ١٤ | ملف المالك والتحقق | <img src="qa/screenshots/desktop-14-owner-profile.jpg" alt="تحقق المالك على الديسكتوب" width="320"> | <img src="qa/screenshots/android-14-owner-profile.jpg" alt="تحقق المالك على أندرويد" width="180"> |
| ١٥ | حجوزات المالك | <img src="qa/screenshots/desktop-15-owner-bookings.jpg" alt="حجوزات المالك على الديسكتوب" width="320"> | <img src="qa/screenshots/android-15-owner-bookings.jpg" alt="حجوزات المالك على أندرويد" width="180"> |
| ١٦ | تقويم الأسعار والتواريخ | <img src="qa/screenshots/desktop-16-owner-calendar.jpg" alt="التقويم على الديسكتوب" width="320"> | <img src="qa/screenshots/android-16-owner-calendar.jpg" alt="التقويم على أندرويد" width="180"> |
| ١٧ | لوحة الإدارة | <img src="qa/screenshots/desktop-17-admin.jpg" alt="الإدارة على الديسكتوب" width="320"> | <img src="qa/screenshots/android-17-admin.jpg" alt="الإدارة على أندرويد" width="180"> |
| ١٨ | الإدارة — طلبات التوثيق | <img src="qa/screenshots/desktop-18-admin-verifications.jpg" alt="التوثيق على الديسكتوب" width="320"> | <img src="qa/screenshots/android-18-admin-verifications.jpg" alt="التوثيق على أندرويد" width="180"> |
| ١٩ | شروط الضيوف «نسخة معتمدة» | <img src="qa/screenshots/desktop-19-terms.jpg" alt="الشروط على الديسكتوب" width="320"> | <img src="qa/screenshots/android-19-terms.jpg" alt="الشروط على أندرويد" width="180"> |
| ٢٠ | سياسة الخصوصية | <img src="qa/screenshots/desktop-20-privacy.jpg" alt="الخصوصية على الديسكتوب" width="320"> | <img src="qa/screenshots/android-20-privacy.jpg" alt="الخصوصية على أندرويد" width="180"> |
| ٢١ | استعادة كلمة المرور | <img src="qa/screenshots/desktop-21-forgot.jpg" alt="استعادة الباسورد على الديسكتوب" width="320"> | <img src="qa/screenshots/android-21-forgot.jpg" alt="استعادة الباسورد على أندرويد" width="180"> |
| ٢٢ | صفحة ٤٠٤ عربية | <img src="qa/screenshots/desktop-22-not-found.jpg" alt="صفحة ٤٠٤ على الديسكتوب" width="320"> | <img src="qa/screenshots/android-22-not-found.jpg" alt="صفحة ٤٠٤ على أندرويد" width="180"> |

## ملاحظات UX وتحسينات مقترحة

المشاهدات التالية موثّقة للقرار لاحقاً؛ **لم يتغيّر أي سلوك في المنتج في هذا البند**:

1. **مساحة لمس روابط الهيدر/الفوتر:** قياس الآلي رصد عناصر مثل «واتساب»، «تليجرام»، `01066094050`، «الشروط»، «المفضلة» بارتفاع أقل من ٢٤px في بعض الصفحات. على اللمس يُستحسن مساحة ٤٤px عبر `padding` إضافي مع نفس الشكل بصرياً. لا توجد شكوى مستخدم، لكنها تحسين سهل في بند مستقل.
2. **توقيع `QIWALO` بحجم ٩٫٦px في الفوتر:** عنصر زخرفي مقصود على ما يبدو؛ لو أضفنا له رابطاً يفضّل تكبيره. لا يؤثر على القراءة الحالية.
3. **اعتماد صور «رحلتك مع قيوالو» على Unsplash:** في أول تشغيل للسيرفر ظهرت مهلة تحميل مؤقتة لصور Unsplash، ثم اختفت كل الصور المكسورة بعد الاستقرار. يُستحسن - عند تطوير البند - تنزيل الصور محلياً أو عبر Cloudinary لتقليل الاعتماد على مصدر خارجي. لم نضف حزمة أو خدمة جديدة.
4. **كثافة لوحات المالك/الإدارة على الموبايل:** الجداول والبطاقات تتراص عمودياً بدون تمرير أفقي (قياس `overflow = 0`)، لكنها طويلة. مقترح لاحق: تلخيص البطاقات أو طيّ التفاصيل افتراضياً على الشاشات الصغيرة.
5. **أدوات القياس نفسها:** أول محاولة التقاط أنتجت تنبيه hydration وهمي لأن Playwright يضخّ `caret-color` في DOM؛ اضفنا `caret: "initial"` في السكربت فاختفت التنبيهات. ده أداة اختبار مش عيب في التطبيق. كمان احتجنا تواريخ مختلفة لكل منصة عشان حجز Mock ما يتقاطعش مع نفسه في بيانات الذاكرة المشتركة.

## ما لم يتغيّر

- لا قاعدة بيانات إنتاجية، لا رفع Cloudinary حقيقي، لا إيميلات/إشعارات، لا دفع، لا نطاق، لا تفعيل MCP.
- لا حزم جديدة، لا تعديل على مكوّنات الواجهة أو المنطق التجاري، ولا تغيير في نسخة Next.js (`16.4.6`).
- `cacheComponents` و`partialPrefetching` لسه مفعّلين في `next.config.ts`.
- `qiwalo.apk` وصفحة تحميل أندرويد المؤجلة لم يُلمسا.

## الملفات المضافة/المحدّثة

- `scripts/qa-tour.mjs` — جولة Playwright قابلة لإعادة التشغيل.
- `docs/QA-REPORT.md` — هذا التقرير.
- `docs/qa/qa-results.json` — القياسات الخام لكل خطوة.
- `docs/qa/screenshots/desktop-*.jpg` و`android-*.jpg` — ٤٤ لقطة (JPEG، ~٢MB المجموع).
- `package.json` — أمر `npm run qa:tour`.
- `README.md` و`docs/IMPROVEMENTS-LOG.md` — رابط الجولة والتوثيق.
