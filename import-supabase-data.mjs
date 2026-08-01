// import-supabase-data.mjs
// سكربت استيراد النسخة الاحتياطية (من backup-supabase-data.mjs) إلى مشروع سوباباس الجديد
//
// طريقة الاستخدام:
//   1. عدّل NEW_SUPABASE_URL تحت (أو مرّرها كمتغير بيئة).
//   2. شغّل بمتغير البيئة SUPABASE_SERVICE_ROLE_KEY (لازم service_role key
//      للمشروع الجديد، تلقاه بـ Project Settings -> API -> service_role).
//      لا تكتب المفتاح داخل الملف مباشرة ولا تشاركه بأي محادثة.
//   3. تأكد إن مجلد النسخة الاحتياطية (مثلاً backup_2026-08-01) موجود بنفس
//      المسار اللي بتشغّل منه السكربت، أو مرّر المسار كـ argument.
//
// مثال تشغيل:
//   SUPABASE_SERVICE_ROLE_KEY="eyJ..." node import-supabase-data.mjs ./backup_2026-08-01
//
// ملاحظات مهمة:
//   - جدول user_roles ما يتستورد تلقائيًا (حساب الأدمن انعمل مسبقًا يدويًا
//     بنفس الإيميل على المشروع الجديد بـ UUID مختلف). لو تحتاج صفوف أدوار
//     ثانية غير الأدمن، عدّلها يدويًا بعد المراجعة.
//   - جدول platform_stats صف واحد بس (id=1) وموجود مسبقًا، فالسكربت يسويله
//     UPDATE بدل INSERT.
//   - الترتيب يراعي الـ foreign keys (subjects قبل questions، إلخ).
//   - الاستيراد يتم على دفعات (batches) لتفادي تجاوز حدود الطلب.

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const NEW_SUPABASE_URL = process.env.NEW_SUPABASE_URL || "https://nhrlwemvkvgmtzoiwcym.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("❌ لازم تحدد SUPABASE_SERVICE_ROLE_KEY كمتغير بيئة قبل التشغيل.");
  process.exit(1);
}

const BACKUP_DIR = process.argv[2] || "./backup_2026-08-01";

// الترتيب يراعي الاعتماديات (foreign keys) — الجداول المستقلة أولاً
const IMPORT_ORDER = [
  "levels",
  "subjects",
  "platform_settings",
  "subject_exam_forms",
  "questions",
  "question_stats",
  "question_reports",
  "question_suggestions",
  "exam_results",
  "student_profiles",
  "deletion_requests",
  "review_passwords",
  "battle_rooms",
  "battle_players",
  "battle_session_results",
  "battle_history",
  "battle_leaderboard",
  "challenge_sessions",
  "challenge_results",
  "app_installs",
  "app_sessions",
  "site_analytics",
];

// جداول نتجاهلها عن قصد
const SKIP_TABLES = new Set(["user_roles"]);

// الجدول اللي فيه صف وحيد ثابت (id=1) يحتاج UPDATE بدل INSERT
const SINGLE_ROW_UPSERT = new Set(["platform_stats"]);

const BATCH_SIZE = 500;

const supabase = createClient(NEW_SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function readTableFile(table) {
  const filePath = path.join(BACKUP_DIR, `${table}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function importTable(table) {
  const rows = readTableFile(table);
  if (rows === null) {
    console.log(`⏭️  ${table}: ما لقيت ملف، تجاوزته`);
    return { table, status: "skipped_no_file" };
  }
  if (rows.length === 0) {
    console.log(`⏭️  ${table}: فاضي، ما فيه شي يتستورد`);
    return { table, status: "empty" };
  }

  if (SINGLE_ROW_UPSERT.has(table)) {
    const { error } = await supabase.from(table).update(rows[0]).eq("id", rows[0].id);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
      return { table, status: "failed", error: error.message };
    }
    console.log(`✅ ${table}: تحديث صف واحد`);
    return { table, status: "ok", rows: 1 };
  }

  let imported = 0;
  let error = null;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error: err } = await supabase.from(table).upsert(batch, { onConflict: "id" });
    if (err) {
      error = err;
      console.log(`❌ ${table}: فشل بالدفعة ${i}-${i + batch.length} (${err.message})`);
      break;
    }
    imported += batch.length;
    process.stdout.write(`\r⏳ ${table}: ${imported}/${rows.length}`);
  }

  if (error) {
    return { table, status: "failed", error: error.message, rows: imported };
  }

  console.log(`\r✅ ${table}: ${imported}/${rows.length} صف تم استيرادها      `);
  return { table, status: "ok", rows: imported };
}

async function main() {
  console.log("=== استيراد بيانات منصة الناصر للمشروع الجديد ===\n");
  console.log(`المصدر: ${BACKUP_DIR}`);
  console.log(`الوجهة: ${NEW_SUPABASE_URL}\n`);

  const summary = [];

  for (const table of IMPORT_ORDER) {
    if (SKIP_TABLES.has(table)) continue;
    const result = await importTable(table);
    summary.push(result);
  }

  console.log("\n📦 خلص الاستيراد!\n");
  const failed = summary.filter((s) => s.status === "failed");
  if (failed.length) {
    console.log(`⚠️ ${failed.length} جدول فيه مشكلة:`);
    failed.forEach((f) => console.log(`  - ${f.table}: ${f.error}`));
  } else {
    console.log("كل الجداول اتستوردت بدون أخطاء ✅");
  }

  fs.writeFileSync(
    path.join(BACKUP_DIR, "_import_summary.json"),
    JSON.stringify(summary, null, 2),
    "utf-8"
  );
}

main();
