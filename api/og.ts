/**
 * Alnasser Tech Digital Solutions
 * api/og.ts — Dynamic OG Tags
 *
 * يُستدعى من كل الصفحات المهمة
 * - روبوت → يُرجع HTML مع OG Tags ديناميكية
 * - مستخدم عادي → يُعيد التوجيه للتطبيق
 */

export const config = { runtime: 'edge' };

const BASE_URL  = 'https://alnaseer.org';
const OG_IMAGE  = `${BASE_URL}/og-image.png`;
const SITE_NAME = 'منصة الناصر | الباحث القانوني المتخصص';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const CRAWLER_REGEX =
  /whatsapp|telegram|twitterbot|facebookexternalhit|linkedinbot|slackbot|discordbot|googlebot|bingbot|applebot|pinterest/i;

async function fetchSupabase(table: string, query: string): Promise<any[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    return res.ok ? await res.json() : [];
  } catch { return []; }
}

function esc(s: string) {
  return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function buildHTML(title: string, description: string, image: string, url: string): string {
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head>
<meta charset="UTF-8"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="${esc(SITE_NAME)}"/>
<meta property="og:url" content="${esc(url)}"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(description)}"/>
<meta property="og:image" content="${esc(image)}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:locale" content="ar_YE"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(description)}"/>
<meta name="twitter:image" content="${esc(image)}"/>
<meta http-equiv="refresh" content="0;url=${esc(url)}"/>
</head><body><a href="${esc(url)}">${esc(title)}</a></body></html>`;
}

export default async function handler(req: Request): Promise<Response> {
  const ua       = req.headers.get('user-agent') || '';
  const reqUrl   = new URL(req.url);
  const pathname = reqUrl.searchParams.get('path') || '/';
  const fullUrl  = `${BASE_URL}${pathname}`;

  // مستخدم عادي → أعده للتطبيق
  if (!CRAWLER_REGEX.test(ua)) {
    return new Response(null, {
      status: 302,
      headers: { Location: fullUrl },
    });
  }

  // القيم الافتراضية
  let title       = SITE_NAME;
  let description = 'اختبر معرفتك القانونية وطوّر مهاراتك مع أحدث نماذج الامتحانات — أكثر من 10000 سؤال قانوني في 43 مادة.';
  let image       = OG_IMAGE;

  // /challenge/:id
  const challengeMatch = pathname.match(/^\/challenge\/([\w-]+)/);
  if (challengeMatch) {
    const rows = await fetchSupabase('challenge_sessions',
      `id=eq.${challengeMatch[1]}&select=creator_name,creator_percentage,subjects(name)&limit=1`);
    const d = rows[0];
    if (d) {
      const subject = d.subjects?.name || 'اختبار قانوني';
      const pct     = d.creator_percentage ?? 0;
      title       = `⚔️ ${d.creator_name} يتحداك في ${subject}!`;
      description = `حقّق ${pct}% — هل تستطيع التفوق عليه؟ انضم الآن على منصة الناصر`;
    } else {
      title       = '⚔️ تحدٍّ قانوني ينتظرك!';
      description = 'انضم إلى التحدي الآن على منصة الناصر — الباحث القانوني المتخصص';
    }
  }

  // /exam/:id
  else if (pathname.match(/^\/exam\/([\w-]+)/) && !pathname.includes('/start') && !pathname.includes('/result')) {
    const m = pathname.match(/^\/exam\/([\w-]+)/);
    if (m) {
      const rows = await fetchSupabase('subjects', `id=eq.${m[1]}&select=name,questions_count&limit=1`);
      const d = rows[0];
      if (d) {
        title       = `اختبار ${d.name} | منصة الناصر`;
        description = `اختبر معرفتك في مادة ${d.name}${d.questions_count ? ` — ${d.questions_count} سؤال` : ''} — اختبارات قانونية احترافية`;
      }
    }
  }

  // /levels/:id
  else if (pathname.match(/^\/levels\/([\w-]+)/)) {
    const m = pathname.match(/^\/levels\/([\w-]+)/);
    if (m) {
      const rows = await fetchSupabase('levels', `id=eq.${m[1]}&select=name&limit=1`);
      const d = rows[0];
      if (d) {
        title       = `${d.name} | منصة الناصر`;
        description = `تصفح مواد ${d.name} وابدأ اختباراتك القانونية الآن`;
      }
    }
  }

  // /levels
  else if (pathname === '/levels') {
    title       = 'المستويات الدراسية | منصة الناصر';
    description = 'اختر مستواك الدراسي — 4 مستويات تغطي 43 مادة قانونية متخصصة';
  }

  // /about
  else if (pathname === '/about') {
    title       = 'عن المنصة | منصة الناصر';
    description = 'منصة الناصر — مبادرة أ. معين الناصر لخدمة طلاب الشريعة والقانون في اليمن';
  }

  // /diagnostic
  else if (pathname === '/diagnostic') {
    title       = 'الاختبار التشخيصي | منصة الناصر';
    description = 'اكتشف نقاط قوتك وضعفك — اختبار تشخيصي شامل لجميع مواد القانون';
  }

  const html = buildHTML(title, description, image, fullUrl);
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type':  'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  });
}
