/**
 * Alnasser Tech Digital Solutions
 * middleware.ts — Vercel Edge Middleware (Vite compatible)
 *
 * ملاحظة: هذا الملف يعمل مع Vercel Edge Runtime مباشرة
 * بدون الحاجة لـ Next.js
 */

export const config = {
  matcher: [
    '/',
    '/about',
    '/diagnostic',
    '/levels',
    '/levels/(.*)',
    '/exam/(.*)',
    '/challenge/(.*)',
  ],
};

const CRAWLER_REGEX =
  /whatsapp|telegram|twitterbot|facebookexternalhit|linkedinbot|slackbot|discordbot|googlebot|bingbot|applebot/i;

export default async function middleware(request: Request): Promise<Response> {
  const ua = request.headers.get('user-agent') || '';

  // المستخدم العادي — تمرير للتطبيق
  if (!CRAWLER_REGEX.test(ua)) {
    return new Response(null, { status: 200 });
  }

  const url      = new URL(request.url);
  const pathname = url.pathname;

  // وجّه الروبوت إلى /api/og
  const ogUrl = new URL('/api/og', request.url);
  ogUrl.searchParams.set('path', pathname);

  const res = await fetch(ogUrl.toString(), {
    headers: { 'user-agent': ua },
  });

  const html = await res.text();

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type':  'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
