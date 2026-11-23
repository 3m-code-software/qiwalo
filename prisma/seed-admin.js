/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Creates (or promotes) the real admin account.
 *
 * Usage:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' ADMIN_NAME='...' npm run db:seed:admin
 *
 * Secrets are read from the environment / .env.local — never hardcode them.
 * Requires NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY and DATABASE_URL.
 */
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvLocal();

const { createClient } = require("@supabase/supabase-js");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const name = (process.env.ADMIN_NAME || "إدارة قيوالو").trim();

  if (!url || !anonKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY غير معرّفين.");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("ADMIN_EMAIL غير صالح.");
  if (password.length < 6) throw new Error("ADMIN_PASSWORD يجب ألا تقل عن 6 أحرف.");

  const supabase = createClient(url, anonKey);
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role: "ADMIN" } },
  });
  if (error && !/already registered/i.test(error.message)) throw new Error(error.message);

  await prisma.user.upsert({
    where: { email },
    create: { id: email, email, name, role: "ADMIN" },
    update: { name, role: "ADMIN" },
  });

  console.log(` Admin ready: ${email}`);
  console.log(" If signup said 'already registered', the password was kept as-is — reset it in Supabase Dashboard if needed.");
}

main()
  .catch((error) => {
    console.error("seed-admin failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
