/**
 * api/render.ts — Dynamic Rendering Engine
 * منصة الناصر — الباحث القانوني
 *
 * النهج المعتمد رسمياً من Google: "Dynamic Rendering"
 * https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering
 *
 * المنطق:
 * ✅ Googlebot / أي crawler → HTML كامل مع محتوى نصي + meta + schema
 * ✅ مستخدم عادي → index.html (React SPA يعمل عادي)
 */

export const config = { runtime: 'edge' };

const BASE_URL  = 'https://alnaseer.org';
const OG_IMAGE  = `${BASE_URL}/og-image.png`;
const SITE_NAME = 'منصة الناصر | الباحث القانوني المتخصص';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const CRAWLER_UA =
  /googlebot|google-inspectiontool|bingbot|yandexbot|baiduspider|facebookexternalhit|twitterbot|whatsapp|telegram|linkedinbot|slackbot|discordbot|applebot|duckduckbot|rogerbot|360spider|ahrefsbot|semrushbot/i;

// ─── Supabase helper ───────────────────────────────────────────────────────
async function db(table: string, query: string): Promise<any[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    return r.ok ? r.json() : [];
  } catch { return []; }
}

function e(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── HTML Builder ──────────────────────────────────────────────────────────
function html(
  title: string,
  desc: string,
  url: string,
  body: string,
  schema?: object
): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${e(title)}</title>
<meta name="description" content="${e(desc)}"/>
<link rel="canonical" href="${e(url)}"/>
<meta name="robots" content="index, follow"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="${e(SITE_NAME)}"/>
<meta property="og:url" content="${e(url)}"/>
<meta property="og:title" content="${e(title)}"/>
<meta property="og:description" content="${e(desc)}"/>
<meta property="og:image" content="${OG_IMAGE}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:locale" content="ar_YE"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:site" content="@AlnasserTech"/>
<meta name="twitter:title" content="${e(title)}"/>
<meta name="twitter:description" content="${e(desc)}"/>
<meta name="twitter:image" content="${OG_IMAGE}"/>
${schema ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>` : ''}
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Cairo,Tajawal,Arial,sans-serif;direction:rtl;background:#f8fafc;color:#1e293b;padding:24px;line-height:1.8}
  .wrap{max-width:900px;margin:0 auto}
  h1{color:#1d4ed8;font-size:1.8rem;margin-bottom:12px}
  h2{color:#1e40af;font-size:1.3rem;margin:20px 0 8px}
  p{color:#475569;margin-bottom:12px}
  nav{margin:16px 0;padding:12px;background:#eff6ff;border-radius:8px}
  nav a{margin-left:16px;color:#1d4ed8;text-decoration:none;font-weight:600}
  .subjects{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin:16px 0}
  .subject{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:14px;text-decoration:none;color:#1e293b;display:block}
  .subject:hover{border-color:#1d4ed8}
  .subject-name{font-weight:700;color:#1d4ed8}
  .subject-count{font-size:.85rem;color:#64748b;margin-top:4px}
  .badge{display:inline-block;background:#dbeafe;color:#1d4ed8;padding:2px 10px;border-radius:99px;font-size:.8rem;margin-bottom:8px}
  ul{padding-right:20px;color:#475569}
  li{margin-bottom:6px}
</style>
</head>
<body>
<div class="wrap">
<nav>
  <a href="${BASE_URL}/">🏠 الرئيسية</a>
  <a href="${BASE_URL}/levels">📚 المستويات</a>
  <a href="${BASE_URL}/about">ℹ️ عن المنصة</a>
  <a href="${BASE_URL}/diagnostic">🔬 التشخيصي</a>
</nav>
${body}
</div>
</body>
</html>`;
}

// ─── صفحة المستوى ──────────────────────────────────────────────────────────
async function renderLevel(id: string, url: string) {
  const [levels, subjects] = await Promise.all([
    db('levels', `id=eq.${id}&select=name,description&limit=1`),
    db('subjects', `level_id=eq.${id}&select=id,name,questions_count&order=name&is_active=eq.true`),
  ]);
  const level = levels[0];
  if (!level) return null;

  const title = `${level.name} | منصة الناصر`;
  const desc  = `تصفح مواد ${level.name} وابدأ اختباراتك القانونية — ${subjects.length} مادة متاحة على منصة الناصر.`;

  const subjectCards = subjects.map((s: any) => `
    <a href="${BASE_URL}/exam/${s.id}" class="subject">
      <div class="subject-name">${e(s.name)}</div>
      ${s.questions_count ? `<div class="subject-count">📝 ${s.questions_count} سؤال</div>` : ''}
    </a>`).join('');

  const body = `
    <span class="badge">المستويات الدراسية</span>
    <h1>${e(level.name)}</h1>
    <p>${level.description ? e(level.description) : desc}</p>
    <h2>المواد الدراسية (${subjects.length} مادة)</h2>
    <div class="subjects">${subjectCards}</div>`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: level.name,
    description: desc,
    provider: { '@type': 'Organization', name: 'منصة الناصر', url: BASE_URL },
    educationalLevel: level.name,
    hasCourseInstance: subjects.map((s: any) => ({
      '@type': 'CourseInstance',
      name: s.name,
      url: `${BASE_URL}/exam/${s.id}`,
    })),
  };

  return { title, desc, body, schema };
}

// ─── صفحة المادة ───────────────────────────────────────────────────────────
async function renderExam(id: string, url: string) {
  const rows = await db(
    'subjects',
    `id=eq.${id}&select=name,questions_count,description,levels(name)&limit=1`
  );
  const s = rows[0];
  if (!s) return null;

  const title = `اختبار ${s.name} | منصة الناصر`;
  const desc  = `اختبر معرفتك في مادة ${s.name}${s.questions_count ? ` — ${s.questions_count} سؤال` : ''}. اختبارات قانونية احترافية على منصة الناصر.`;

  const body = `
    ${s.levels?.name ? `<span class="badge">${e(s.levels.name)}</span>` : ''}
    <h1>اختبار مادة ${e(s.name)}</h1>
    <p>${s.description ? e(s.description) : desc}</p>
    ${s.questions_count ? `<p>📝 يحتوي هذا الاختبار على <strong>${s.questions_count} سؤال</strong> متعدد الخيارات مع تصحيح فوري.</p>` : ''}
    <h2>ما ستتدرب عليه</h2>
    <ul>
      <li>أسئلة شاملة لجميع محاور مادة ${e(s.name)}</li>
      <li>تصحيح فوري مع شرح الإجابات</li>
      <li>إحصائيات تفصيلية لأدائك</li>
      <li>إمكانية المشاركة والتحدي</li>
    </ul>
    <p style="margin-top:16px"><a href="${url}" style="color:#1d4ed8;font-weight:700">← ابدأ الاختبار الآن</a></p>`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: `اختبار ${s.name}`,
    description: desc,
    educationalUse: 'assessment',
    inLanguage: 'ar',
    provider: { '@type': 'Organization', name: 'منصة الناصر', url: BASE_URL },
    ...(s.questions_count && { numberOfQuestions: s.questions_count }),
  };

  return { title, desc, body, schema };
}

// ─── Handler الرئيسي ───────────────────────────────────────────────────────
export default async function handler(req: Request): Promise<Response> {
  const ua       = req.headers.get('user-agent') || '';
  const reqUrl   = new URL(req.url);
  const pathname = decodeURIComponent(reqUrl.searchParams.get('path') || '/');
  const fullUrl  = `${BASE_URL}${pathname}`;

  // ── مستخدم عادي: أعده للـ SPA ──────────────────────────────────────────
  // ملاحظة: المستخدم العادي لا يصل هنا عادةً (vercel.json يوجهه لـ index.html مباشرة)
  // هذا فقط كـ safety fallback
  if (!CRAWLER_UA.test(ua)) {
    return new Response(null, { status: 302, headers: { Location: fullUrl } });
  }

  // ── Googlebot: ابنِ HTML ديناميكي ─────────────────────────────────────

  let title  = SITE_NAME;
  let desc   = 'المنصة الأولى لتدريب وتأهيل الباحثين القانونيين في اليمن — بنك أسئلة يضم أكثر من 10,000 سؤال في 43 مادة قانونية موزعة على 4 مستويات دراسية.';
  let body   = '';
  let schema: object | undefined;

  // ── / الرئيسية ──
  if (pathname === '/') {
    body = `
      <h1>منصة الناصر — الباحث القانوني</h1>
      <p>${desc}</p>
      <h2>لماذا منصة الناصر؟</h2>
      <ul>
        <li>أكثر من <strong>10,000 سؤال</strong> قانوني متخصص</li>
        <li><strong>43 مادة</strong> في الشريعة والقانون</li>
        <li><strong>4 مستويات</strong> من الأول للرابع</li>
        <li>اختبارات تفاعلية مع تصحيح فوري</li>
        <li>تتبع التقدم والإحصائيات الشخصية</li>
        <li>غرف منافسة جماعية</li>
        <li>اختبار تشخيصي لتحديد المستوى</li>
        <li>مجاني بالكامل</li>
      </ul>
      <h2>ابدأ الآن</h2>
      <p><a href="${BASE_URL}/levels" style="color:#1d4ed8;font-weight:700">← تصفح المستويات الدراسية</a></p>`;
    schema = {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'منصة الناصر — الباحث القانوني',
      url: BASE_URL,
      logo: `${BASE_URL}/favicon.png`,
      description: desc,
      foundingLocation: { '@type': 'Place', name: 'صنعاء، الجمهورية اليمنية' },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'اختبارات قانونية مجانية' },
      sameAs: ['https://twitter.com/AlnasserTech'],
    };
  }

  // ── /levels ──
  else if (pathname === '/levels') {
    title = 'المستويات الدراسية | منصة الناصر';
    desc  = 'اختر مستواك الدراسي وابدأ رحلتك القانونية — 4 مستويات تغطي 43 مادة قانونية متخصصة لطلاب كلية الشريعة والقانون في اليمن.';
    const levels = await db('levels', 'select=id,name,description&order=order_num');
    const cards  = levels.map((l: any) =>
      `<a href="${BASE_URL}/levels/${l.id}" class="subject">
        <div class="subject-name">${e(l.name)}</div>
        ${l.description ? `<div class="subject-count">${e(l.description)}</div>` : ''}
      </a>`
    ).join('');
    body = `
      <h1>المستويات الدراسية</h1>
      <p>${desc}</p>
      <div class="subjects">${cards}</div>`;
    schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'المستويات الدراسية — منصة الناصر',
      description: desc,
      numberOfItems: levels.length || 4,
    };
  }

  // ── /levels/:id ──
  else if (pathname.match(/^\/levels\/[\w-]{36}$/)) {
    const id     = pathname.split('/').pop()!;
    const result = await renderLevel(id, fullUrl);
    if (result) { title = result.title; desc = result.desc; body = result.body; schema = result.schema; }
    else { title = 'مستوى دراسي | منصة الناصر'; body = `<h1>${title}</h1><p>${desc}</p>`; }
  }

  // ── /exam/:id ──
  else if (pathname.match(/^\/exam\/[\w-]{36}$/)) {
    const id     = pathname.split('/').pop()!;
    const result = await renderExam(id, fullUrl);
    if (result) { title = result.title; desc = result.desc; body = result.body; schema = result.schema; }
    else { title = 'اختبار قانوني | منصة الناصر'; body = `<h1>${title}</h1><p>${desc}</p>`; }
  }

  // ── /about ──
  else if (pathname === '/about') {
    title = 'عن المنصة | منصة الناصر';
    desc  = 'منصة الناصر — مبادرة أ. معين الناصر لخدمة طلاب الشريعة والقانون في اليمن. بنك أسئلة يضم أكثر من 10,000 سؤال في 43 مادة قانونية.';
    body  = `<h1>عن منصة الناصر</h1><p>${desc}</p>`;
  }

  // ── /features ──
  else if (pathname === '/features') {
    title = 'مميزات المنصة | منصة الناصر';
    desc  = 'اكتشف مميزات منصة الناصر — اختبارات تفاعلية، بنك أسئلة ضخم، غرف منافسة، تتبع التقدم، واختبار تشخيصي.';
    body  = `<h1>${title}</h1><p>${desc}</p>`;
  }

  // ── /diagnostic ──
  else if (pathname === '/diagnostic') {
    title = 'الاختبار التشخيصي | منصة الناصر';
    desc  = 'اكتشف نقاط قوتك وضعفك في المواد القانونية — اختبار تشخيصي شامل لجميع مستويات الدراسة القانونية.';
    body  = `<h1>${title}</h1><p>${desc}</p>`;
  }

  // ── /privacy ──
  else if (pathname === '/privacy') {
    title = 'سياسة الخصوصية | منصة الناصر';
    desc  = 'سياسة الخصوصية وحماية البيانات لمنصة الناصر — الباحث القانوني.';
    body  = `<h1>${title}</h1><p>${desc}</p>`;
  }

  // ── /challenge/:id ──
  else if (pathname.match(/^\/challenge\/([\w-]+)/)) {
    const m    = pathname.match(/^\/challenge\/([\w-]+)/);
    const rows = m ? await db('challenge_sessions', `id=eq.${m[1]}&select=creator_name,creator_percentage,subjects(name)&limit=1`) : [];
    const d    = rows[0];
    if (d) {
      const subject = d.subjects?.name || 'اختبار قانوني';
      title = `⚔️ ${d.creator_name} يتحداك في ${subject}!`;
      desc  = `حقّق ${d.creator_percentage ?? 0}% — هل تستطيع التفوق عليه؟ انضم الآن على منصة الناصر`;
    } else {
      title = '⚔️ تحدٍّ قانوني ينتظرك!';
      desc  = 'انضم إلى التحدي الآن على منصة الناصر — الباحث القانوني المتخصص';
    }
    body = `<h1>${e(title)}</h1><p>${e(desc)}</p><a href="${fullUrl}">قبول التحدي</a>`;
  }

  // ── fallback ──
  else {
    body = `<h1>${e(title)}</h1><p>${e(desc)}</p>`;
  }

  const responseHtml = html(title, desc, fullUrl, body, schema);

  return new Response(responseHtml, {
    status: 200,
    headers: {
      'Content-Type':  'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'X-Robots-Tag':  'index, follow',
      'Vary':          'User-Agent',
    },
  });
}
