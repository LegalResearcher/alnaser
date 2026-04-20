/**
 * api/sitemap.ts — Dynamic XML Sitemap
 * منصة الناصر | الباحث القانوني
 *
 * يُولِّد sitemap.xml ديناميكياً من Supabase
 * يُفعَّل عبر vercel.json: /sitemap.xml → /api/sitemap
 */

export const config = { runtime: 'edge' };

const BASE_URL     = 'https://alnaseer.org';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// ─── Supabase REST helper ──────────────────────────────────────────────────
async function db(table: string, query: string): Promise<any[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    return r.ok ? r.json() : [];
  } catch {
    return [];
  }
}

// ─── بناء عنصر <url> ──────────────────────────────────────────────────────
function url(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: string
): string {
  return `  <url>
    <loc>${BASE_URL}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────
export default async function handler(): Promise<Response> {
  const today = new Date().toISOString().split('T')[0];

  // ── الصفحات الثابتة ─────────────────────────────────────────────────────
  const staticUrls = [
    url('/',           today, 'daily',   '1.0'),
    url('/levels',     today, 'weekly',  '0.9'),
    url('/about',      today, 'monthly', '0.7'),
    url('/features',   today, 'monthly', '0.7'),
    url('/suggest',    today, 'monthly', '0.5'),
    url('/privacy',    today, 'yearly',  '0.3'),
    url('/diagnostic', today, 'weekly',  '0.6'),
    url('/battle/create', today, 'weekly', '0.6'),
    url('/battle/join',   today, 'weekly', '0.6'),
  ];

  // ── جلب المستويات من Supabase ────────────────────────────────────────────
  const levels = await db('levels', 'select=id,updated_at&order=order_num');
  const levelUrls = levels.map((l: any) =>
    url(
      `/levels/${l.id}`,
      l.updated_at ? l.updated_at.split('T')[0] : today,
      'weekly',
      '0.8'
    )
  );

  // ── جلب المواد النشطة من Supabase ────────────────────────────────────────
  const subjects = await db(
    'subjects',
    'select=id,updated_at&is_active=eq.true&order=name'
  );
  const subjectUrls = subjects.map((s: any) =>
    url(
      `/exam/${s.id}`,
      s.updated_at ? s.updated_at.split('T')[0] : today,
      'weekly',
      '0.8'
    )
  );

  // ── تجميع الـ XML ─────────────────────────────────────────────────────────
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
    https://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

${[...staticUrls, ...levelUrls, ...subjectUrls].join('\n')}

</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'X-Robots-Tag': 'noindex', // الـ sitemap نفسه لا يُفهرَس
    },
  });
}
