/**
 * Alnasser Tech Digital Solutions
 * middleware.ts — Vercel Edge Middleware
 *
 * يعمل مع Vite + Vercel بدون Next.js
 * يعترض الروبوتات ويوجهها لـ /api/og
 * ويمرر المستخدمين العاديين لـ index.html عبر fetch
 */

const CRAWLER_REGEX =
  /whatsapp|telegram|twitterbot|facebookexternalhit|linkedinbot|slackbot|discordbot|googlebot|bingbot|applebot|pinterest/i;

const OG_PATHS = [
  /^\/challenge\//,
  /^\/exam\//,
  /^\/levels\//,
  /^\/levels$/,
  /^\/about$/,
  /^\/diagnostic$/,
  /^\/$/,
];

export default async function middleware(request: Request): Promise<Response | undefined> {
  const ua       = request.headers.get('user-agent') || '';
  const url      = new URL(request.url);
  const pathname = url.pathname;

  // هل الصفحة مدعومة؟
  const isOGPath = OG_PATHS.some(p => p.test(pathname));
  if (!isOGPath) return undefined; // تمرير عادي

  // هل هو روبوت؟
  if (!CRAWLER_REGEX.test(ua)) return undefined; // تمرير عادي

  // وجّه الروبوت لـ /api/og
  const ogUrl = new URL('/api/og', request.url);
  ogUrl.searchParams.set('path', pathname);

  const res = await fetch(ogUrl.toString(), {
    headers: {
      'user-agent': ua,
      'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
    },
  });

  const html = await res.text();
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

export const config = {
  matcher: [
    '/',
    '/about',
    '/diagnostic',
    '/levels',
    '/levels/:path*',
    '/exam/:path*',
    '/challenge/:path*',
  ],
};
