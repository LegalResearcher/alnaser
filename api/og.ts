/**
 * Alnasser Tech Digital Solutions
 * api/og.ts — Dynamic OG Tags + Pre-rendering لـ SEO
 *
 * ✅ الإصلاح: حذف <meta http-equiv="refresh"> التي كانت تُعيد توجيه Googlebot
 *    للـ React SPA الفارغة، مما كان يمنع الفهرسة تماماً.
 *
 * الآن: Googlebot يقرأ HTML كامل مع meta + محتوى نصي → يفهرسه مباشرة.
 */

export const config = { runtime: 'edge' };

const BASE_URL  = 'https://alnaseer.org';
const OG_IMAGE  = `${BASE_URL}/og-image.png`;
const SITE_NAME = 'منصة الناصر | الباحث القانوني المتخصص';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const CRAWLER_REGEX =
  /whatsapp|telegram|twitterbot|facebookexternalhit|linkedinbot|slackbot|discordbot|googlebot|bingbot|applebot|pinterest|duckduckbot|yandexbot/i;

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
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildHTML(
  title: string,
  description: string,
  image: string,
  url: string,
  bodyContent: string = '',
  schema?: object
): string {
  const schemaTag = schema
    ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
    : '';

  // ✅ لا يوجد meta refresh هنا — Googlebot يبقى في الصفحة ويفهرس محتواها
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}"/>
<link rel="canonical" href="${esc(url)}"/>
<meta name="robots" content="index, follow"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="${esc(SITE_NAME)}"/>
<meta property="og:url" content="${esc(url)}"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(description)}"/>
<meta property="og:image" content="${esc(image)}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:alt" content="${esc(title)}"/>
<meta property="og:locale" content="ar_YE"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:site" content="@AlnasserTech"/>
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(description)}"/>
<meta name="twitter:image" content="${esc(image)}"/>
${schemaTag}
<style>
  body { font-family: 'Cairo', Arial, sans-serif; direction: rtl; padding: 20px; color: #1a1a2e; }
  h1 { color: #1d4ed8; }
  nav a { margin-left: 16px; color: #1d4ed8; text-decoration: none; }
  .subjects { margin: 20px 0; }
  .subject-link { display: block; padding: 8px; border-bottom: 1px solid #eee; color: #333; }
</style>
</head>
<body>
<header>
  <h1>${esc(title)}</h1>
  <p>${esc(description)}</p>
  <nav>
    <a href="${BASE_URL}/">الرئيسية</a>
    <a href="${BASE_URL}/levels">المستويات</a>
    <a href="${BASE_URL}/about">عن المنصة</a>
  </nav>
</header>
<main>
${bodyContent}
</main>
</body>
</html>`;
}

export default async function handler(req: Request): Promise<Response> {
  const ua       = req.headers.get('user-agent') || '';
  const reqUrl   = new URL(req.url);
  const pathname = reqUrl.searchParams.get('path') || '/';
  const fullUrl  = `${BASE_URL}${pathname}`;

  // مستخدم عادي → أعده للتطبيق (302 redirect مقبول للمستخدمين فقط)
  if (!CRAWLER_REGEX.test(ua)) {
    return new Response(null, {
      status: 302,
      headers: { Location: fullUrl },
    });
  }

  // ── القيم الافتراضية ──
  let title       = SITE_NAME;
  let description = 'المنصة الأولى لتدريب وتأهيل الباحثين القانونيين في اليمن — بنك أسئلة يضم أكثر من 10000 سؤال في 43 مادة قانونية موزعة على 4 مستويات دراسية.';
  let bodyContent = '';
  let schema: object | undefined;

  // ── الصفحة الرئيسية ──
  if (pathname === '/') {
    bodyContent = `
      <h2>منصة الناصر — الباحث القانوني</h2>
      <p>المنصة الأولى لتدريب وتأهيل الباحثين القانونيين في اليمن. تضم أكثر من 10,000 سؤال قانوني في 43 مادة موزعة على 4 مستويات دراسية.</p>
      <h3>المستويات الدراسية</h3>
      <ul>
        <li><a href="${BASE_URL}/levels">المستوى الأول — مواد السنة الأولى</a></li>
        <li><a href="${BASE_URL}/levels">المستوى الثاني — مواد السنة الثانية</a></li>
        <li><a href="${BASE_URL}/levels">المستوى الثالث — مواد السنة الثالثة</a></li>
        <li><a href="${BASE_URL}/levels">المستوى الرابع — مواد السنة الرابعة</a></li>
      </ul>
      <h3>المميزات</h3>
      <ul>
        <li>بنك أسئلة يضم أكثر من 10,000 سؤال</li>
        <li>43 مادة قانونية متخصصة</li>
        <li>اختبارات تفاعلية مع تصحيح فوري</li>
        <li>تتبع التقدم والإحصائيات الشخصية</li>
        <li>غرف منافسة جماعية</li>
        <li>اختبار تشخيصي لتحديد المستوى</li>
      </ul>`;
    schema = {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'منصة الناصر — الباحث القانوني',
      url: BASE_URL,
      logo: `${BASE_URL}/favicon.png`,
      description,
      foundingLocation: { '@type': 'Place', name: 'صنعاء، الجمهورية اليمنية' },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'اختبارات قانونية مجانية' },
    };
  }

  // ── /challenge/:id ──
  else if (pathname.match(/^\/challenge\/([\w-]+)/)) {
    const m = pathname.match(/^\/challenge\/([\w-]+)/);
    if (m) {
      const rows = await fetchSupabase(
        'challenge_sessions',
        `id=eq.${m[1]}&select=creator_name,creator_percentage,subjects(name)&limit=1`
      );
      const d = rows[0];
      if (d) {
        const subject = d.subjects?.name || 'اختبار قانوني';
        const pct     = d.creator_percentage ?? 0;
        title       = `⚔️ ${d.creator_name} يتحداك في ${subject}!`;
        description = `حقّق ${pct}% — هل تستطيع التفوق عليه؟ انضم الآن على منصة الناصر`;
        bodyContent = `<h2>${title}</h2><p>${description}</p><a href="${fullUrl}">قبول التحدي</a>`;
      } else {
        title       = '⚔️ تحدٍّ قانوني ينتظرك!';
        description = 'انضم إلى التحدي الآن على منصة الناصر — الباحث القانوني المتخصص';
        bodyContent = `<h2>${title}</h2><p>${description}</p>`;
      }
    }
  }

  // ── /exam/:id ──
  else if (pathname.match(/^\/exam\/([\w-]+)$/) && !pathname.includes('/start') && !pathname.includes('/result')) {
    const m = pathname.match(/^\/exam\/([\w-]+)$/);
    if (m) {
      const rows = await fetchSupabase(
        'subjects',
        `id=eq.${m[1]}&select=name,questions_count,description&limit=1`
      );
      const d = rows[0];
      if (d) {
        title       = `اختبار ${d.name} | منصة الناصر`;
        description = `اختبر معرفتك في مادة ${d.name}${d.questions_count ? ` — ${d.questions_count} سؤال` : ''}. اختبارات قانونية احترافية على منصة الناصر.`;
        bodyContent = `
          <h2>اختبار مادة ${esc(d.name)}</h2>
          <p>${d.questions_count ? `يحتوي هذا الاختبار على ${d.questions_count} سؤال متعدد الخيارات.` : ''}</p>
          <p>${d.description ? esc(d.description) : 'اختبارات قانونية شاملة لمادة ' + esc(d.name)}</p>
          <a href="${fullUrl}">ابدأ الاختبار الآن</a>`;
        schema = {
          '@context': 'https://schema.org',
          '@type': 'Quiz',
          name: `اختبار ${d.name}`,
          educationalUse: 'assessment',
          inLanguage: 'ar',
          provider: { '@type': 'Organization', name: 'منصة الناصر', url: BASE_URL },
          ...(d.questions_count && { numberOfQuestions: d.questions_count }),
        };
      } else {
        title       = 'اختبار قانوني | منصة الناصر';
        description = 'اختبر معرفتك القانونية على منصة الناصر';
        bodyContent = `<h2>${title}</h2><p>${description}</p>`;
      }
    }
  }

  // ── /levels/:id ──
  else if (pathname.match(/^\/levels\/([\w-]+)$/)) {
    const m = pathname.match(/^\/levels\/([\w-]+)$/);
    if (m) {
      // جلب المستوى + موادّه
      const [levelRows, subjectRows] = await Promise.all([
        fetchSupabase('levels', `id=eq.${m[1]}&select=name,description&limit=1`),
        fetchSupabase('subjects', `level_id=eq.${m[1]}&select=id,name,questions_count&order=name`),
      ]);
      const d = levelRows[0];
      if (d) {
        title       = `${d.name} | منصة الناصر`;
        description = `تصفح مواد ${d.name} وابدأ اختباراتك القانونية الآن على منصة الناصر`;
        const subjectLinks = subjectRows.map((s: any) =>
          `<li><a href="${BASE_URL}/exam/${s.id}" class="subject-link">${esc(s.name)}${s.questions_count ? ` — ${s.questions_count} سؤال` : ''}</a></li>`
        ).join('\n');
        bodyContent = `
          <h2>${esc(d.name)}</h2>
          <p>${d.description ? esc(d.description) : description}</p>
          <div class="subjects">
            <h3>المواد الدراسية</h3>
            <ul>${subjectLinks}</ul>
          </div>`;
        schema = {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: d.name,
          provider: { '@type': 'Organization', name: 'منصة الناصر', url: BASE_URL },
          educationalLevel: d.name,
          hasCourseInstance: subjectRows.map((s: any) => ({
            '@type': 'CourseInstance',
            name: s.name,
            url: `${BASE_URL}/exam/${s.id}`,
          })),
        };
      }
    }
  }

  // ── /levels ──
  else if (pathname === '/levels') {
    title       = 'المستويات الدراسية | منصة الناصر';
    description = 'اختر مستواك الدراسي وابدأ رحلتك القانونية — 4 مستويات تغطي 43 مادة قانونية متخصصة لطلاب كلية الشريعة والقانون في اليمن.';
    bodyContent = `
      <h2>المستويات الدراسية</h2>
      <p>${description}</p>`;
    schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'المستويات الدراسية — منصة الناصر',
      numberOfItems: 4,
    };
  }

  // ── /about ──
  else if (pathname === '/about') {
    title       = 'عن المنصة | منصة الناصر';
    description = 'منصة الناصر — مبادرة أ. معين الناصر لخدمة طلاب الشريعة والقانون في اليمن. بنك أسئلة يضم أكثر من 10,000 سؤال في 43 مادة قانونية.';
    bodyContent = `<h2>عن منصة الناصر</h2><p>${description}</p>`;
  }

  // ── /diagnostic ──
  else if (pathname === '/diagnostic') {
    title       = 'الاختبار التشخيصي | منصة الناصر';
    description = 'اكتشف نقاط قوتك وضعفك في المواد القانونية — اختبار تشخيصي شامل لجميع مستويات الدراسة القانونية.';
    bodyContent = `<h2>${title}</h2><p>${description}</p>`;
  }

  const html = buildHTML(title, description, OG_IMAGE, fullUrl, bodyContent, schema);

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type':  'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'X-Robots-Tag':  'index, follow',
    },
  });
}
