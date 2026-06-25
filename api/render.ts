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
  .question-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;margin:16px 0}
  .subject-badge{display:inline-block;background:#f1f5f9;color:#475569;padding:4px 12px;border-radius:99px;font-size:.85rem;margin-bottom:16px;font-weight:600}
  .question-text{color:#1e293b;font-size:1.2rem;font-weight:700;margin-bottom:20px;line-height:1.7}
  .options{display:flex;flex-direction:column;gap:10px;margin-bottom:20px}
  .option{display:flex;align-items:center;gap:12px;padding:12px 16px;border:2px solid #e2e8f0;border-radius:10px;background:#f8fafc}
  .option.correct{border-color:#10b981;background:#f0fdf4}
  .opt-label{width:36px;height:36px;border-radius:8px;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem;flex-shrink:0}
  .option.correct .opt-label{background:#10b981;color:#fff}
  .opt-text{flex:1;color:#334155;font-weight:500}
  .correct-badge{background:#10b981;color:#fff;padding:2px 10px;border-radius:99px;font-size:.75rem;font-weight:700;flex-shrink:0}
  .cta-btn{display:block;background:#1d4ed8;color:#fff;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;margin-top:8px}
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

// ─── صفحة السؤال ───────────────────────────────────────────────────────────
async function renderQuestion(id: string, url: string) {
  const questions = await db('questions', `id=eq.${id}&status=eq.active&select=id,question_text,option_a,option_b,option_c,option_d,correct_option,exam_year,subject_id&limit=1`);
  const q = questions[0];
  if (!q) return null;

  const subjects = await db('subjects', `id=eq.${q.subject_id}&select=id,name&limit=1`);
  const subject  = subjects[0];

  const cleanOpt = (t: string) => t ? t.replace(/^[\s]*[A-Dأبجد][.\-\)]\s*/, '').replace(/^[\s]*\d+[.\-\)]\s*/, '').trim() : '';
  const labels: Record<string, string> = { A: 'أ', B: 'ب', C: 'ج', D: 'د' };
  const opts = ['A','B','C','D'].map(k => ({ key: k, text: cleanOpt(q[`option_${k.toLowerCase()}`] || '') })).filter(o => o.text);

  const subjectName = subject?.name || 'اختبار قانوني';
  const qText = q.question_text || '';
  const title = `${qText.slice(0, 60)}${qText.length > 60 ? '...' : ''} | ${subjectName} | منصة الناصر`;
  const desc  = `سؤال من مادة ${subjectName}${q.exam_year ? ` — ${q.exam_year}` : ''} · اختبر معلوماتك القانونية على منصة الناصر`;

  const optionsHtml = opts.map(({ key, text }) => `
    <div class="option${key === q.correct_option ? ' correct' : ''}">
      <span class="opt-label">${labels[key]}</span>
      <span class="opt-text">${e(text)}</span>
      ${key === q.correct_option ? '<span class="correct-badge">✓ الإجابة الصحيحة</span>' : ''}
    </div>`).join('');

  const body = `
    <div class="question-card">
      <div class="subject-badge">📚 ${e(subjectName)}${q.exam_year ? ` · ${q.exam_year}` : ''}</div>
      <h1 class="question-text">${e(qText)}</h1>
      <div class="options">${optionsHtml}</div>
      <a href="${BASE_URL}/exam/${q.subject_id}" class="cta-btn">🚀 ابدأ الاختبار الكامل — ${e(subjectName)}</a>
    </div>`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: qText,
    description: desc,
    url,
    provider: { '@type': 'Organization', name: 'منصة الناصر', url: BASE_URL },
    hasPart: [{
      '@type': 'Question',
      name: qText,
      acceptedAnswer: {
        '@type': 'Answer',
        text: cleanOpt(q[`option_${q.correct_option?.toLowerCase()}`] || ''),
      },
      suggestedAnswer: opts.filter(o => o.key !== q.correct_option).map(o => ({
        '@type': 'Answer', text: o.text,
      })),
    }],
  };

  return { title, desc, body, schema };
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
  let desc   = 'منصة الناصر القانونية هي منصة رقمية مستقلة، تم تأسيسها وتطويرها برؤية وإشراف أ. معين الناصر. تضم المنصة أكثر من ٢٥٬٠٢٨+ سؤال مؤتمت ومكتبة قانونية متكاملة، جرى تصميمها خصيصاً لخدمة وتدريب طلاب الشريعة والقانون، ودعم المحامين والباحثين في تطوير ملكتهم المعرفية والقضائية.';
  let body   = '';
  let schema: object | undefined;

  // ── / الرئيسية ──
  if (pathname === '/') {
    body = `
      <h1>منصة الناصر القانونية</h1>
      <p>${desc}</p>
      <h2>لماذا منصة الناصر؟</h2>
      <ul>
        <li>أكثر من <strong>25,000 سؤال</strong> قانوني مؤتمت</li>
        <li>مكتبة قانونية رقمية متكاملة</li>
        <li><strong>4 مستويات</strong> تغطي كافة فروع الشريعة والقانون</li>
        <li>اختبارات تفاعلية مع تصحيح فوري</li>
        <li>تتبع التقدم والإحصائيات الشخصية</li>
        <li>غرف منافسة جماعية</li>
        <li>اختبار تشخيصي لتحديد المستوى</li>
        <li>أقسام مجانية ومدفوعة</li>
      </ul>
      <h2>ابدأ الآن</h2>
      <p><a href="${BASE_URL}/levels" style="color:#1d4ed8;font-weight:700">← تصفح المستويات الدراسية</a></p>`;
    schema = {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'منصة الناصر القانونية',
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
    desc  = 'اختر مستواك الدراسي وابدأ رحلتك القانونية — 4 مستويات تغطي كافة فروع الشريعة والقانون لطلاب كلية الشريعة والقانون والمحامين والباحثين في اليمن.';
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

  // ── /question/:id ──
  else if (pathname.match(/^\/question\/[\w-]{36}$/)) {
    const id     = pathname.split('/').pop()!;
    const result = await renderQuestion(id, fullUrl);
    if (result) { title = result.title; desc = result.desc; body = result.body; schema = result.schema; }
    else { title = 'سؤال قانوني | منصة الناصر'; body = `<h1>${title}</h1><p>${desc}</p>`; }
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
    desc  = 'منصة الناصر القانونية هي منصة رقمية مستقلة، تم تأسيسها وتطويرها برؤية وإشراف أ. معين الناصر. تضم المنصة أكثر من ٢٥٬٠٢٨+ سؤال مؤتمت ومكتبة قانونية متكاملة، جرى تصميمها خصيصاً لخدمة وتدريب طلاب الشريعة والقانون، ودعم المحامين والباحثين في تطوير ملكتهم المعرفية والقضائية.';
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
    desc  = 'سياسة الخصوصية وحماية البيانات لمنصة الناصر القانونية.';
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
      desc  = 'انضم إلى التحدي الآن على منصة الناصر القانونية';
    }
    body = `<h1>${e(title)}</h1><p>${e(desc)}</p><a href="${fullUrl}">قبول التحدي</a>`;
  }

  // ══════════════════════════════════════════════════════════════
  // المكتبة القانونية — جميع المسارات مع بيانات حقيقية من Supabase
  // ══════════════════════════════════════════════════════════════

  // ── /library (الرئيسية) — عدادات حقيقية من كل جدول ──
  else if (pathname === '/library') {
    // جلب عدادات حقيقية بالتوازي
    const [lawDocs, prosecutionDocs, regulationDocs, judicialRows] = await Promise.all([
      db('legal_documents', 'category=eq.law&select=id&limit=1000'),
      db('legal_documents', 'category=eq.prosecution_instruction&select=id&limit=1000'),
      db('legal_documents', 'category=eq.regulation&select=id&limit=1000'),
      db('judicial_rules',  'select=circuit&limit=1&order=id.asc'),
    ]);
    const lawCount        = lawDocs.length;
    const prosCount       = prosecutionDocs.length;
    const regCount        = regulationDocs.length;

    title = 'المكتبة القانونية الرقمية | منصة الناصر القانونية';
    desc  = 'المكتبة القانونية اليمنية الرقمية الشاملة للتشريعات، تعليمات النيابة، وأكثر من 1997 قاعدة قضائية للمحكمة العليا، بتأسيس وإشراف أ. معين الناصر. تصفح وحمّل الصيغ واللوائح بسهولة.';
    body  = `
      <h1>المكتبة القانونية الرقمية</h1>
      <p>${desc}</p>
      <h2>أقسام المكتبة</h2>
      <div class="subjects">
        <a href="${BASE_URL}/library/legislation" class="subject">
          <span class="badge">تشريعات</span>
          <div class="subject-name">القوانين اليمنية</div>
          <div class="subject-count">${lawCount > 0 ? `${lawCount} قانون ووثيقة` : 'القوانين والتشريعات بآخر التعديلات الرسمية'}</div>
        </a>
        <a href="${BASE_URL}/library/judicial" class="subject">
          <span class="badge">قضاء</span>
          <div class="subject-name">القواعد القضائية</div>
          <div class="subject-count">1997+ قاعدة قضائية — المحكمة العليا اليمنية</div>
        </a>
        <a href="${BASE_URL}/library/prosecution" class="subject">
          <span class="badge">نيابة</span>
          <div class="subject-name">تعليمات النيابة</div>
          <div class="subject-count">${prosCount > 0 ? `${prosCount} تعليمة وملف جزائي` : 'الملفات والتعليمات الجزائية'}</div>
        </a>
        <a href="${BASE_URL}/library/regulations" class="subject">
          <span class="badge">لوائح</span>
          <div class="subject-name">اللوائح والأنظمة</div>
          <div class="subject-count">${regCount > 0 ? `${regCount} لائحة ونظام` : 'الأنظمة واللوائح التنفيذية'}</div>
        </a>
      </div>
      <p><a href="${BASE_URL}/library/search" style="color:#1d4ed8;font-weight:700">← البحث الشامل في جميع الأقسام</a></p>`;
    schema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'المكتبة القانونية الرقمية — منصة الناصر',
      description: desc,
      url: `${BASE_URL}/library`,
      inLanguage: 'ar',
      provider: { '@type': 'Organization', name: 'منصة الناصر', url: BASE_URL },
      about: { '@type': 'Thing', name: 'القانون اليمني والتشريعات' },
      numberOfItems: lawCount + prosCount + regCount,
    };
  }

  // ── /library/search ──
  else if (pathname === '/library/search') {
    // جلب إحصائية شاملة للبحث
    const [allDocs, judicialCount] = await Promise.all([
      db('legal_documents', 'select=id&limit=1000'),
      db('judicial_rules',  'select=id&limit=2000'),
    ]);
    const totalDocs  = allDocs.length;
    const totalRules = judicialCount.length;
    title = 'البحث القانوني الشامل | المكتبة القانونية | منصة الناصر';
    desc  = `ابحث في جميع أقسام المكتبة القانونية الرقمية — ${totalDocs > 0 ? totalDocs + ' وثيقة قانونية و' : ''}${totalRules > 0 ? totalRules + ' قاعدة قضائية' : 'قواعد قضائية'} وتشريعات يمنية في مكان واحد.`;
    body  = `
      <h1>البحث الشامل في المكتبة القانونية</h1>
      <p>${desc}</p>
      ${totalDocs > 0 ? `<p>يشمل البحث <strong>${totalDocs}</strong> وثيقة قانونية و<strong>${totalRules}</strong> قاعدة قضائية.</p>` : ''}
      <p><a href="${BASE_URL}/library" style="color:#1d4ed8;font-weight:700">← العودة للمكتبة</a></p>`;
  }

  // ── /library/judicial — دوائر حقيقية من RPC ──
  else if (pathname === '/library/judicial') {
    // جلب الدوائر وعدد قواعدها عبر نفس RPC المستخدمة في الواجهة
    const circuitRows = await db('judicial_rules', 'select=circuit&limit=2000');
    // تجميع يدوي لتحاشي RPC في edge function
    const circuitMap: Record<string, number> = {};
    for (const r of circuitRows) {
      if (r.circuit) circuitMap[r.circuit] = (circuitMap[r.circuit] || 0) + 1;
    }
    const circuits = Object.entries(circuitMap).sort((a, b) => b[1] - a[1]);
    const totalRules = circuitRows.length;

    title = 'القواعد القضائية للمحكمة العليا | المكتبة القانونية | منصة الناصر';
    desc  = `${totalRules > 0 ? totalRules : 'أكثر من 1997'} قاعدة قضائية ومبدأ صادر عن المحكمة العليا اليمنية — مصنّفة بـ${circuits.length} دائرة قضائية متخصصة على منصة الناصر.`;
    const circuitLinks = circuits.map(([name, count]) => {
      const slug = encodeURIComponent(name);
      return `<a href="${BASE_URL}/library/judicial/${slug}" class="subject">
        <div class="subject-name">${e(name)}</div>
        <div class="subject-count">${count} قاعدة قضائية</div>
      </a>`;
    }).join('');
    body  = `
      <h1>القواعد القضائية للمحكمة العليا اليمنية</h1>
      <p>${desc}</p>
      <h2>الدوائر القضائية (${circuits.length} دائرة)</h2>
      <div class="subjects">${circuitLinks || '<p>الدوائر القضائية</p>'}</div>
      <p style="margin-top:16px"><a href="${BASE_URL}/library" style="color:#1d4ed8;font-weight:700">← العودة للمكتبة</a></p>`;
    schema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'القواعد القضائية للمحكمة العليا اليمنية',
      description: desc,
      url: `${BASE_URL}/library/judicial`,
      inLanguage: 'ar',
      numberOfItems: totalRules,
      provider: { '@type': 'Organization', name: 'منصة الناصر', url: BASE_URL },
    };
  }

  // ── /library/judicial/:circuit — قواعد الدائرة الحقيقية ──
  else if (pathname.match(/^\/library\/judicial\/[\w%-]+$/)) {
    const circuitSlug = pathname.split('/').pop()!;
    const circuitName = decodeURIComponent(circuitSlug);
    // جلب قواعد هذه الدائرة (الميتاداتا فقط — بدون content)
    const rules = await db(
      'judicial_rules',
      `circuit=eq.${encodeURIComponent(circuitName)}&select=id,circuit,issue_number,rule_number,subject,is_premium&order=id.asc&limit=100`
    );
    title = `${e(circuitName)} | القواعد القضائية | منصة الناصر`;
    desc  = `${rules.length > 0 ? rules.length + ' قاعدة قضائية' : 'قواعد قضائية'} صادرة عن ${e(circuitName)} في المحكمة العليا اليمنية — منصة الناصر القانونية.`;
    const ruleItems = rules.slice(0, 30).map((r: any) =>
      `<li><a href="${BASE_URL}/library/judicial/${circuitSlug}#rule-${r.id}" style="color:#1d4ed8">
        ${r.subject ? e(r.subject) : `قاعدة رقم ${r.rule_number || r.id}`}
        ${r.issue_number ? `— العدد ${r.issue_number}` : ''}
        ${r.is_premium ? '<span style="color:#d97706;font-size:.8rem"> (مدفوع)</span>' : ''}
      </a></li>`
    ).join('');
    body  = `
      <h1>${e(circuitName)}</h1>
      <p>${desc}</p>
      ${ruleItems ? `<h2>القواعد القضائية</h2><ul>${ruleItems}</ul>` : ''}
      ${rules.length > 30 ? `<p style="color:#64748b">… و${rules.length - 30} قاعدة أخرى</p>` : ''}
      <p style="margin-top:16px"><a href="${BASE_URL}/library/judicial" style="color:#1d4ed8;font-weight:700">← الدوائر القضائية</a></p>`;
    schema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${circuitName} — المحكمة العليا اليمنية`,
      description: desc,
      url: `${BASE_URL}/library/judicial/${circuitSlug}`,
      inLanguage: 'ar',
      numberOfItems: rules.length,
      provider: { '@type': 'Organization', name: 'منصة الناصر', url: BASE_URL },
    };
  }

  // ── /library/:category — وثائق حقيقية من legal_documents ──
  else if (pathname.match(/^\/library\/(?!doc\/|files|favorites|subscription|other-services|search|judicial)[\w-]+$/)) {
    const segment = pathname.split('/').pop()!;
    // تحويل segment → category كما تفعل LegalDocumentList.tsx
    const dbCategory =
      segment === 'regulations'  ? 'regulation' :
      segment === 'prosecution'  ? 'prosecution_instruction' : 'law';

    const categoryMeta: Record<string, { name: string; badge: string; baseDesc: string }> = {
      law:                      { name: 'القوانين اليمنية',          badge: 'تشريعات', baseDesc: 'القوانين والتشريعات اليمنية بآخر التعديلات الرسمية' },
      prosecution_instruction:  { name: 'تعليمات النيابة العامة',    badge: 'نيابة',   baseDesc: 'تعليمات النيابة العامة والملفات والتعليمات الجزائية' },
      regulation:               { name: 'اللوائح والأنظمة',          badge: 'لوائح',   baseDesc: 'اللوائح التنفيذية والأنظمة الإدارية اليمنية' },
    };
    const meta = categoryMeta[dbCategory] || { name: 'المكتبة القانونية', badge: '', baseDesc: '' };

    // جلب الوثائق الحقيقية (بدون content)
    const docs = await db(
      'legal_documents',
      `category=eq.${dbCategory}&select=id,file_name,is_featured,is_premium,display_order&order=display_order.asc&limit=200`
    );
    const featured  = docs.filter((d: any) => d.is_featured);
    const totalDocs = docs.length;

    title = `${meta.name} | المكتبة القانونية | منصة الناصر`;
    desc  = `${meta.baseDesc} — ${totalDocs > 0 ? totalDocs + ' وثيقة متاحة' : 'مكتبة شاملة'} على منصة الناصر القانونية اليمنية.`;

    const docLinks = docs.slice(0, 40).map((d: any) =>
      `<li><a href="${BASE_URL}/library/doc/${d.id}" style="color:#1d4ed8">
        ${e(d.file_name)}
        ${d.is_featured ? '<span style="color:#d97706"> ★</span>' : ''}
        ${d.is_premium  ? '<span style="color:#7c3aed;font-size:.8rem"> (مدفوع)</span>' : ''}
      </a></li>`
    ).join('');

    body  = `
      <h1>${e(meta.name)}</h1>
      <p>${desc}</p>
      ${featured.length > 0 ? `<p><strong>الوثائق المميزة:</strong> ${featured.slice(0,5).map((d:any)=>e(d.file_name)).join('، ')}</p>` : ''}
      ${docLinks ? `<h2>الوثائق (${totalDocs})</h2><ul>${docLinks}</ul>` : ''}
      ${docs.length > 40 ? `<p style="color:#64748b">… و${docs.length - 40} وثيقة أخرى</p>` : ''}
      <p style="margin-top:16px"><a href="${BASE_URL}/library" style="color:#1d4ed8;font-weight:700">← العودة للمكتبة</a></p>`;
    schema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${meta.name} — منصة الناصر`,
      description: desc,
      url: `${BASE_URL}/library/${segment}`,
      inLanguage: 'ar',
      numberOfItems: totalDocs,
      provider: { '@type': 'Organization', name: 'منصة الناصر', url: BASE_URL },
    };
  }

  // ── /library/doc/:id — اسم الوثيقة الحقيقي ──
  else if (pathname.match(/^\/library\/doc\/[\w-]+$/)) {
    const docId = pathname.split('/').pop()!;
    const docs  = await db(
      'legal_documents',
      `id=eq.${docId}&select=id,file_name,category,is_premium,is_featured&limit=1`
    );
    const doc = docs[0];
    const categoryLabel: Record<string, string> = {
      law:                    'القوانين اليمنية',
      prosecution_instruction:'تعليمات النيابة',
      regulation:             'اللوائح والأنظمة',
    };
    const catSlug: Record<string, string> = {
      law:                    'legislation',
      prosecution_instruction:'prosecution',
      regulation:             'regulations',
    };
    if (doc) {
      const catName = categoryLabel[doc.category] || 'المكتبة القانونية';
      const catSeg  = catSlug[doc.category] || 'legislation';
      title = `${e(doc.file_name)} | ${catName} | منصة الناصر`;
      desc  = `اطلع على ${e(doc.file_name)} — ${catName} في المكتبة القانونية الرقمية على منصة الناصر القانونية اليمنية.${doc.is_premium ? ' (وثيقة مدفوعة)' : ''}`;
      body  = `
        <h1>${e(doc.file_name)}</h1>
        <p>${desc}</p>
        ${doc.is_premium ? '<p style="color:#7c3aed;font-weight:600">🔒 هذه الوثيقة متاحة للمشتركين فقط</p>' : ''}
        <p style="margin-top:16px">
          <a href="${BASE_URL}/library/${catSeg}" style="color:#1d4ed8;font-weight:700">← ${catName}</a>
          &nbsp;|&nbsp;
          <a href="${BASE_URL}/library" style="color:#1d4ed8">المكتبة القانونية</a>
        </p>`;
      schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: doc.file_name,
        description: desc,
        url: `${BASE_URL}/library/doc/${docId}`,
        inLanguage: 'ar',
        isAccessibleForFree: !doc.is_premium,
        publisher: { '@type': 'Organization', name: 'منصة الناصر', url: BASE_URL },
      };
    } else {
      title = 'وثيقة قانونية | المكتبة القانونية | منصة الناصر';
      desc  = 'اطلع على الوثيقة القانونية في المكتبة القانونية الرقمية — منصة الناصر القانونية اليمنية.';
      body  = `<h1>${e(title)}</h1><p>${e(desc)}</p><p><a href="${BASE_URL}/library" style="color:#1d4ed8;font-weight:700">← العودة للمكتبة</a></p>`;
    }
  }

  // ── /library/other-services ──
  else if (pathname === '/library/other-services') {
    // جلب عدد مواضيع فهرس المحكمة العليا
    const topics = await db('judicial_index_topics', 'select=id&limit=1000');
    title = 'الخدمات الأخرى | المكتبة القانونية | منصة الناصر';
    desc  = `خدمات إضافية في المكتبة القانونية — فهرس المحكمة العليا${topics.length > 0 ? ` (${topics.length} موضوع)` : ''} والمراجع القانونية على منصة الناصر.`;
    body  = `
      <h1>الخدمات الأخرى</h1>
      <p>${desc}</p>
      <div class="subjects">
        <a href="${BASE_URL}/library/other-services/supreme-court" class="subject">
          <div class="subject-name">فهرس المحكمة العليا</div>
          ${topics.length > 0 ? `<div class="subject-count">${topics.length} موضوع مفهرس</div>` : ''}
        </a>
        <a href="${BASE_URL}/library/other-services/legal-references" class="subject">
          <div class="subject-name">المراجع القانونية</div>
          <div class="subject-count">مراجع للباحثين والمحامين</div>
        </a>
      </div>
      <p><a href="${BASE_URL}/library" style="color:#1d4ed8;font-weight:700">← العودة للمكتبة</a></p>`;
  }

  // ── /library/other-services/supreme-court ──
  else if (pathname === '/library/other-services/supreme-court' || pathname === '/library/other-services/supreme-court/index') {
    // جلب مواضيع الفهرس مجمّعة بالدائرة
    const topics = await db(
      'judicial_index_topics',
      'select=circuit,topic&order=circuit_order.asc,topic_order.asc&limit=1000'
    );
    // تجميع بالدائرة
    const byCircuit: Record<string, string[]> = {};
    for (const t of topics) {
      if (!byCircuit[t.circuit]) byCircuit[t.circuit] = [];
      byCircuit[t.circuit].push(t.topic);
    }
    const circuits = Object.keys(byCircuit);
    title = 'فهرس المحكمة العليا | المكتبة القانونية | منصة الناصر';
    desc  = `الفهرس الشامل لأحكام ومبادئ المحكمة العليا اليمنية — ${topics.length > 0 ? topics.length + ' موضوع في ' : ''}${circuits.length > 0 ? circuits.length + ' دائرة قضائية' : 'دوائر قضائية متخصصة'} — منصة الناصر القانونية.`;
    const circuitSections = circuits.map(c =>
      `<div style="margin-bottom:16px">
        <h3 style="color:#1e40af">${e(c)}</h3>
        <ul>${byCircuit[c].slice(0, 10).map(t => `<li style="color:#475569">${e(t)}</li>`).join('')}
        ${byCircuit[c].length > 10 ? `<li style="color:#94a3b8">… و${byCircuit[c].length - 10} موضوعاً آخر</li>` : ''}</ul>
      </div>`
    ).join('');
    body  = `
      <h1>فهرس المحكمة العليا اليمنية</h1>
      <p>${desc}</p>
      ${circuitSections}
      <p style="margin-top:16px"><a href="${BASE_URL}/library/other-services" style="color:#1d4ed8;font-weight:700">← الخدمات الأخرى</a></p>`;
    schema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'فهرس المحكمة العليا اليمنية — منصة الناصر',
      description: desc,
      url: `${BASE_URL}/library/other-services/supreme-court`,
      inLanguage: 'ar',
      numberOfItems: topics.length,
      provider: { '@type': 'Organization', name: 'منصة الناصر', url: BASE_URL },
    };
  }

  // ── /library/other-services/legal-references ──
  else if (pathname === '/library/other-services/legal-references') {
    title = 'المراجع القانونية | المكتبة القانونية | منصة الناصر';
    desc  = 'مراجع قانونية متخصصة للباحثين والمحامين وطلاب الشريعة والقانون — منصة الناصر القانونية اليمنية.';
    body  = `<h1>${e(title)}</h1><p>${e(desc)}</p><p><a href="${BASE_URL}/library/other-services" style="color:#1d4ed8;font-weight:700">← الخدمات الأخرى</a></p>`;
  }

  // ── /library/subscription ──
  else if (pathname === '/library/subscription') {
    // جلب عدد المحتوى المدفوع لإبراز قيمة الاشتراك
    const [premiumDocs, premiumRules] = await Promise.all([
      db('legal_documents', 'is_premium=eq.true&select=id&limit=1000'),
      db('judicial_rules',  'is_premium=eq.true&select=id&limit=1000'),
    ]);
    title = 'الاشتراك في المكتبة القانونية | منصة الناصر';
    desc  = `اشترك في المكتبة القانونية الرقمية للوصول الكامل${premiumDocs.length > 0 ? ` لـ${premiumDocs.length} وثيقة مدفوعة` : ''}${premiumRules.length > 0 ? ` و${premiumRules.length} قاعدة قضائية` : ''} — منصة الناصر القانونية اليمنية.`;
    body  = `
      <h1>${e(title)}</h1>
      <p>${desc}</p>
      ${premiumDocs.length > 0 || premiumRules.length > 0 ? `
      <div class="subjects" style="margin:16px 0">
        ${premiumDocs.length > 0 ? `<div class="subject"><div class="subject-name">${premiumDocs.length} وثيقة قانونية مدفوعة</div></div>` : ''}
        ${premiumRules.length > 0 ? `<div class="subject"><div class="subject-name">${premiumRules.length} قاعدة قضائية مدفوعة</div></div>` : ''}
      </div>` : ''}
      <p><a href="${BASE_URL}/library" style="color:#1d4ed8;font-weight:700">← العودة للمكتبة</a></p>`;
    schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'اشتراك المكتبة القانونية — منصة الناصر',
      description: desc,
      url: `${BASE_URL}/library/subscription`,
      provider: { '@type': 'Organization', name: 'منصة الناصر', url: BASE_URL },
    };
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
