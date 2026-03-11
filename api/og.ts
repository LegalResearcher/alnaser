/**
 * Alnasser Tech Digital Solutions
 * api/og.ts — Dynamic OG Tags for WhatsApp & Telegram
 *
 * يعترض طلبات الروبوتات (واتساب، تيليجرام، إلخ)
 * ويُرجع HTML مع OG Tags ديناميكية مخصصة لكل صفحة
 *
 * الصفحات المدعومة:
 * - /challenge/:id  → اسم المتحدي + المادة + النسبة
 * - /exam/:id       → اسم المادة + عدد الأسئلة
 * - /levels/:id     → اسم المستوى
 * - /about          → صفحة عن المنصة
 * - /               → الصفحة الرئيسية
 */

export const config = { runtime: 'edge' };

const BASE_URL   = 'https://alnaseer.org';
const OG_IMAGE   = `${BASE_URL}/og-image.png`;
const SITE_NAME  = 'منصة الناصر | الباحث القانوني المتخصص';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL  || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// ───────────────────────────────────────────
// هل هذا روبوت؟
// ───────────────────────────────────────────
function isCrawler(ua: string): boolean {
  return /whatsapp|telegram|twitterbot|facebookexternalhit|linkedinbot|slackbot|discordbot|googlebot|bingbot|applebot/i.test(ua);
}

// ───────────────────────────────────────────
// جلب بيانات من Supabase REST API
// ───────────────────────────────────────────
async function fetchSupabase(table: string, query: string): Promise<any[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?${query}`,
      {
        headers: {
          apikey:        SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// ───────────────────────────────────────────
// بناء HTML الاستجابة
// ───────────────────────────────────────────
function buildHTML(params: {
  title:       string;
  description: string;
  image:       string;
  url:         string;
}): string {
  const { title, description, image, url } = params;
  // escape لمنع XSS
  const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />

  <!-- Open Graph -->
  <meta property="og:type"        content="website" />
  <meta property="og:site_name"   content="${esc(SITE_NAME)}" />
  <meta property="og:url"         content="${esc(url)}" />
  <meta property="og:title"       content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image"       content="${esc(image)}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt"    content="${esc(title)}" />
  <meta property="og:locale"       content="ar_YE" />

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image"       content="${esc(image)}" />

  <!-- إعادة توجيه المستخدم الحقيقي فوراً -->
  <meta http-equiv="refresh" content="0;url=${esc(url)}" />
</head>
<body>
  <p>جاري التوجيه إلى <a href="${esc(url)}">${esc(url)}</a></p>
</body>
</html>`;
}

// ───────────────────────────────────────────
// الدالة الرئيسية
// ───────────────────────────────────────────
export default async function handler(req: Request): Promise<Response> {
  const ua = req.headers.get('user-agent') || '';

  // إذا لم يكن روبوتاً — أعد توجيهه للتطبيق مباشرة
  if (!isCrawler(ua)) {
    return new Response(null, {
      status: 302,
      headers: { Location: req.url },
    });
  }

  const url      = new URL(req.url);
  const pathname = url.searchParams.get('path') || '/';
  const fullUrl  = `${BASE_URL}${pathname}`;

  // القيم الافتراضية
  let title       = SITE_NAME;
  let description = 'اختبر معرفتك القانونية وطوّر مهاراتك مع أحدث نماذج الامتحانات — أكثر من 5000 سؤال قانوني في 43 مادة.';
  let image       = OG_IMAGE;

  // ── /challenge/:id ──
  const challengeMatch = pathname.match(/^\/challenge\/([\w-]+)/);
  if (challengeMatch) {
    const id   = challengeMatch[1];
    const rows = await fetchSupabase(
      'challenge_sessions',
      `id=eq.${id}&select=creator_name,creator_percentage,creator_score,subjects(name)&limit=1`
    );
    const data = rows[0];
    if (data) {
      const subjectName = data.subjects?.name || 'اختبار قانوني';
      const pct         = data.creator_percentage ?? 0;
      title       = `⚔️ ${data.creator_name} يتحداك في ${subjectName}!`;
      description = `حقّق ${pct}% — هل تستطيع التفوق عليه؟ انضم الآن على منصة الناصر للباحث القانوني`;
    } else {
      title       = '⚔️ تحدٍّ قانوني ينتظرك!';
      description = 'انضم إلى التحدي الآن على منصة الناصر — الباحث القانوني المتخصص';
    }
  }

  // ── /exam/:id ──
  else if (pathname.match(/^\/exam\/([\w-]+)/) && !pathname.includes('/start') && !pathname.includes('/result')) {
    const examMatch = pathname.match(/^\/exam\/([\w-]+)/);
    if (examMatch) {
      const id   = examMatch[1];
      const rows = await fetchSupabase(
        'subjects',
        `id=eq.${id}&select=name,questions_count&limit=1`
      );
      const data = rows[0];
      if (data) {
        title       = `اختبار ${data.name} | منصة الناصر`;
        description = `اختبر معرفتك في مادة ${data.name}${data.questions_count ? ` — ${data.questions_count} سؤال` : ''} — اختبارات قانونية احترافية`;
      }
    }
  }

  // ── /levels/:id ──
  else if (pathname.match(/^\/levels\/([\w-]+)/)) {
    const levelMatch = pathname.match(/^\/levels\/([\w-]+)/);
    if (levelMatch) {
      const id   = levelMatch[1];
      const rows = await fetchSupabase(
        'levels',
        `id=eq.${id}&select=name&limit=1`
      );
      const data = rows[0];
      if (data) {
        title       = `${data.name} | منصة الناصر`;
        description = `تصفح مواد ${data.name} وابدأ اختباراتك القانونية الآن على منصة الناصر`;
      }
    }
  }

  // ── /levels ──
  else if (pathname === '/levels') {
    title       = 'المستويات الدراسية | منصة الناصر';
    description = 'اختر مستواك الدراسي وابدأ رحلتك القانونية — 4 مستويات تغطي 43 مادة قانونية متخصصة';
  }

  // ── /about ──
  else if (pathname === '/about') {
    title       = 'عن المنصة | منصة الناصر';
    description = 'منصة الناصر — المبادرة الشخصية لأ. معين الناصر لخدمة طلاب الشريعة والقانون في اليمن';
  }

  // ── /diagnostic ──
  else if (pathname === '/diagnostic') {
    title       = 'الاختبار التشخيصي | منصة الناصر';
    description = 'اكتشف نقاط قوتك وضعفك في مختلف مواد القانون — اختبار تشخيصي شامل';
  }

  const html = buildHTML({ title, description, image, url: fullUrl });

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type':  'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  });
}
