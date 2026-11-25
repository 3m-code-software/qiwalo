// جولة تفقدية كاملة على وضع Mock: تلاتين خطوة تقريباً، صورة لكل خطوة على الديسكتوب وأندرويد.
// التشغيل: ابدأ سيرفر Mock على المنفذ 3140 ثم: node scripts/qa-tour.mjs
// لا يتصل بالإنتاج ولا يستخدم أي أسرار أو بيانات حقيقية.
import { chromium, devices } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const BASE = process.env.QA_BASE_URL || "http://localhost:3140";
const abs = (relative) => new URL(relative, BASE).href;
const OUT = path.resolve("docs/qa/screenshots");
const DATA = path.resolve("docs/qa/qa-results.json");
await fs.mkdir(OUT, { recursive: true });

const dateAfter = (days) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer() {
  for (let i = 0; i < 90; i += 1) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return;
    } catch { /* السيرفر لسه بيقلع */ }
    await sleep(1000);
  }
  throw new Error(`السيرفر ${BASE} ما استجابش خلال ٩٠ ثانية`);
}

const results = [];
const consoleIssues = [];

async function capture(page, platform, key, title) {
  const file = `${platform}-${key}.jpg`;
  // caret: "initial" عشان Playwright ما يحقنش caret-color في الـ DOM وقت التصوير فيسبب تحذير hydration وهمي.
  await page.screenshot({ path: path.join(OUT, file), type: "jpeg", quality: 72, caret: "initial" });
  const metrics = await page.evaluate(() => {
    const broken = [...document.images]
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src)
      .slice(0, 4);
    const small = [...document.querySelectorAll("button, a")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.height < 24 && getComputedStyle(el).visibility !== "hidden";
      })
      .slice(0, 6)
      .map((el) => (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 40));
    const textEls = [...document.querySelectorAll("p, span, a, button, label, h1, h2, h3, h4, li, dd, dt")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && el.textContent.trim();
      });
    const clipped = textEls
      .filter((el) => {
        const style = getComputedStyle(el);
        return el.scrollWidth > el.clientWidth + 2 && ["hidden", "clip", "ellipsis"].includes(style.textOverflow || style.overflow);
      })
      .slice(0, 6)
      .map((el) => el.textContent.trim().slice(0, 40));
    return {
      h1: document.querySelector("h1")?.textContent.trim().slice(0, 90) || "",
      h1Count: document.querySelectorAll("h1").length,
      dir: document.documentElement.dir,
      overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      minFontPx: Math.min(...textEls.map((el) => parseFloat(getComputedStyle(el).fontSize) || 16)),
      clippedText: clipped,
      imagesWithoutAlt: [...document.images].filter((img) => !img.hasAttribute("alt")).length,
      brokenImages: broken,
      smallTargets: small,
      errorScreen: document.body.innerText.includes("حصل خلط بسيط"),
    };
  });
  const row = { platform, key, title, file, url: page.url(), ...metrics };
  results.push(row);
  console.log(`${platform}/${key} — ${title} | overflow=${metrics.overflow} broken=${metrics.brokenImages.length} error=${metrics.errorScreen}`);
  return row;
}

async function safe(label, fn) {
  try {
    await fn();
  } catch (error) {
    consoleIssues.push({ label, message: String(error?.message || error).slice(0, 300) });
    console.log(`⚠ ${label}: ${String(error?.message || error).slice(0, 160)}`);
  }
}

async function signInDemo(page, name, next) {
  await page.goto(abs(`/login?next=${encodeURIComponent(next)}`), { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name }).click();
  await page.waitForURL(new RegExp(next.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

async function tour(browser, platform, contextOptions) {
  // تواريخ مختلفة لكل منصّة عشان حجز الديسكتوب ما يقفلش نفس الوحدة على أندرويد في بيانات Mock المشتركة.
  const checkIn = dateAfter(platform === "desktop" ? 40 : 50);
  const checkOut = dateAfter(platform === "desktop" ? 43 : 53);
  const context = await browser.newContext({ locale: "ar-EG", ...contextOptions });
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  page.setDefaultNavigationTimeout(150_000); // أول تجميع لـ next dev على القرص البطيء قد يستغرق دقيقة
  page.on("pageerror", (error) => consoleIssues.push({ platform, label: "pageerror", message: String(error).slice(0, 300) }));

  const go = async (url, key, title, selector) => {
    await page.goto(abs(url), { waitUntil: "domcontentloaded" });
    if (selector) await page.locator(selector).first().waitFor({ state: "visible" });
    await capture(page, platform, key, title);
  };

  await safe(`${platform}/home`, async () => {
    await go("/", "01-home", "الرئيسية — أعلى الصفحة", "h1");
  });

  await safe(`${platform}/journey`, async () => {
    const target = await page.evaluate(() => {
      const section = document.querySelector('section[aria-labelledby="journey-title"]');
      const li = section.querySelectorAll("ol li")[3];
      const r = li.getBoundingClientRect();
      document.documentElement.style.scrollBehavior = "auto";
      scrollTo({ top: Math.round(r.top + scrollY + r.height / 2 - innerHeight / 2), behavior: "instant" });
      return true;
    });
    if (!target) throw new Error("قسم الرحلة غير موجود");
    await sleep(1200);
    const row = await capture(page, platform, "02-journey", "سكرول الرحلة — المرحلة ٤");
    row.journey = await page.evaluate(() => {
      const section = document.querySelector('section[aria-labelledby="journey-title"]');
      const sticky = section.querySelector('[class*="sticky"]');
      return {
        heading: section.querySelector('[class*="bottom-0"] h3')?.textContent.trim(),
        position: getComputedStyle(sticky).position,
        stickyTop: Math.round(sticky.getBoundingClientRect().top),
      };
    });
  });

  await go("/search", "03-search", "البحث — كل النتائج", "a.card");

  await safe(`${platform}/unit`, async () => {
    const card = page.locator("a.card", { hasText: "دار المدينة بإطلالة على النيل" }).first();
    await card.click();
    await page.waitForURL(/\/stay\//);
    await capture(page, platform, "04-unit", "صفحة الوحدة والتفاصيل");
  });

  await safe(`${platform}/login`, async () => {
    await go("/login?next=%2Fsearch", "05-login", "تسجيل الدخول — حسابات تجريبية", "button");
    await page.getByRole("button", { name: "ضيف تجريبي" }).click();
    await page.waitForURL(/\/search/);
  });

  await safe(`${platform}/search-filtered`, async () => {
    await page.locator("#checkIn").fill(checkIn);
    await page.locator("#checkOut").fill(checkOut);
    await page.locator("#guests").fill("2");
    await page.getByRole("button", { name: "ابحث عن إقامتك" }).click();
    await page.waitForURL(new RegExp(`checkIn=${checkIn}`));
    await capture(page, platform, "06-search-filtered", "البحث بعد تحديد التواريخ والضيوف");
  });

  let reference = "";
  await safe(`${platform}/booking-flow`, async () => {
    await page.locator("a.card", { hasText: "دار المدينة بإطلالة على النيل" }).first().click();
    await page.waitForURL(/\/stay\//);
    await capture(page, platform, "07-unit-booking", "وحدة مع نموذج الحجز مملوء بالتواريخ");

    await page.locator('form[action="/checkout"]').getByRole("button", { name: /احجز الآن/ }).click();
    await page.waitForURL(/\/checkout/);
    await page.locator("#fullName").fill("أحمد محمد");
    await page.locator("#email").fill("guest@qiwalo.test");
    await page.locator("#phone").fill("01066094050");
    await page.locator("#nationality").fill("مصري");
    await page.locator('input[name="terms"]').check();
    await capture(page, platform, "08-checkout", "الدفع — البيانات جاهزة والتحقق من الشروط");

    await page.getByRole("button", { name: "تأكيد الحجز" }).click();
    await page.waitForURL(/\/booking\/QW-/, { timeout: 40_000 });
    reference = new URL(page.url()).pathname.split("/").pop();
    await capture(page, platform, "09-booking-confirmed", `تأكيد الحجز ${reference}`);

    await page.getByRole("link", { name: "تفاصيل الدفع والبنك" }).click();
    await page.waitForURL(/\/payment\//);
    await capture(page, platform, "10-payment", "تفاصيل الدفع والتحويل البنكي");
  });

  await safe(`${platform}/favorites`, async () => {
    await page.goto(abs("/stay/nile-view-dar-al-madina"), { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /إضافة .* إلى المفضلة/ }).first().click();
    await page.goto(abs("/favorites"), { waitUntil: "domcontentloaded" });
    await page.locator("h1", { hasText: "المفضلة" }).first().waitFor();
    await capture(page, platform, "11-favorites", "المفضلة بعد حفظ وحدة");
  });

  await safe(`${platform}/owner`, async () => {
    await signInDemo(page, "مالك تجريبي", "/owner");
    await capture(page, platform, "12-owner", "لوحة المالك");
  });

  await go("/owner/units/new", "13-owner-new", "إضافة وحدة جديدة", "#name");
  await go("/owner/profile?verify=1", "14-owner-profile", "ملف المالك والتحقق", "h1");
  await go("/owner/bookings", "15-owner-bookings", "حجوزات المالك", "h1");
  await go("/owner/calendar", "16-owner-calendar", "تقويم الأسعار والتواريخ", "h1");

  await safe(`${platform}/admin`, async () => {
    await signInDemo(page, "مدير تجريبي", "/admin");
    await capture(page, platform, "17-admin", "لوحة الإدارة");
    await page.locator("#verifications summary").click();
    await capture(page, platform, "18-admin-verifications", "الإدارة — طلبات التوثيق");
  });

  await go("/terms/guest", "19-terms", "شروط الضيوف — نسخة معتمدة", "h1");
  await go("/privacy", "20-privacy", "سياسة الخصوصية", "h1");
  await go("/forgot-password", "21-forgot", "استعادة كلمة المرور", "h1");
  await go("/هذا-الرابط-غير-موجود", "22-not-found", "صفحة ٤٠٤ عربية", "h1");

  await context.close();
  return reference;
}

await waitForServer();
const browser = await chromium.launch();
try {
  const desktopRef = await tour(browser, "desktop", { viewport: { width: 1440, height: 900 } });
  const androidRef = await tour(browser, "android", {
    ...devices["Pixel 7"],
    deviceScaleFactor: 1, // صور أخف مع الحفاظ على وكيل أندرويد والمس والمقاس
  });
  await fs.writeFile(
    DATA,
    JSON.stringify({ generatedAt: new Date().toISOString(), base: BASE, desktopReference: desktopRef, androidReference: androidRef, results, consoleIssues }, null, 2),
    "utf8",
  );
  console.log(`\nانتهت الجولة: ${results.length} صورة · ${consoleIssues.length} ملاحظة تقنية`);
} finally {
  await browser.close();
}
