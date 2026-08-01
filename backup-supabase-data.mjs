// backup-supabase-data.mjs
// سكربت لسحب نسخة احتياطية كاملة من بيانات منصة الناصر
// يسجل دخول بحساب الأدمن (نفس حساب لوحة تحكم الموقع) ويسحب كل الجداول

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import readline from "readline";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://tozmmphymxiamvdxfmjv.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvem1tcGh5bXhpYW12ZHhmbWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MjY4NTMsImV4cCI6MjA4MjEwMjg1M30.u1HKn54vgXlIgb2Z-9X2hfUIWQtOcEHLFlpsc1ATzo0";

// كل الجداول المستخرجة من ملفات supabase/migrations
const TABLES = [
  "app_installs", "app_sessions", "battle_history", "battle_leaderboard",
  "battle_players", "battle_rooms", "battle_session_results", "challenge_results",
  "challenge_sessions", "deletion_requests", "exam_results", "levels",
  "platform_settings", "platform_stats", "question_reports", "question_stats",
  "question_suggestions", "questions", "review_passwords", "site_analytics",
  "student_profiles", "subject_exam_forms", "subjects", "user_roles",
];

const OUTPUT_DIR = "./backup_" + new Date().toISOString().slice(0, 10);

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log("=== نسخة احتياطية من بيانات منصة الناصر ===\n");

  const email = await ask("إيميل حساب الأدمن: ");
  const password = await ask("كلمة المرور: ");

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log("\nجاري تسجيل الدخول...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

  if (authError) {
    console.error("❌ فشل تسجيل الدخول:", authError.message);
    process.exit(1);
  }
  console.log("✅ تم تسجيل الدخول بنجاح كـ:", authData.user.email);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const summary = [];

  for (const table of TABLES) {
    process.stdout.write(`سحب جدول ${table} ... `);
    let allRows = [];
    let from = 0;
    const pageSize = 1000;
    let error = null;

    while (true) {
      const { data, error: err } = await supabase
        .from(table)
        .select("*")
        .range(from, from + pageSize - 1);

      if (err) { error = err; break; }
      if (!data || data.length === 0) break;

      allRows = allRows.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    if (error) {
      console.log(`❌ (${error.message})`);
      summary.push({ table, status: "failed", error: error.message, rows: 0 });
      continue;
    }

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${table}.json`),
      JSON.stringify(allRows, null, 2),
      "utf-8"
    );
    console.log(`✅ (${allRows.length} صف)`);
    summary.push({ table, status: "ok", rows: allRows.length });
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "_summary.json"),
    JSON.stringify(summary, null, 2),
    "utf-8"
  );

  console.log(`\n📦 خلصت! النسخة الاحتياطية بمجلد: ${OUTPUT_DIR}`);
  const failed = summary.filter((s) => s.status === "failed");
  if (failed.length) {
    console.log(`\n⚠️ ${failed.length} جدول ما قدرنا نسحبه (يحتاج صلاحية أعلى من الأدمن):`);
    failed.forEach((f) => console.log(`  - ${f.table}: ${f.error}`));
  }
}

main();
