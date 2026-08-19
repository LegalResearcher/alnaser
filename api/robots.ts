export const config = { runtime: 'edge' };

const ROBOTS_TEXT = `# منصة الناصر القانونية
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /progress
Disallow: /exam/*/start
Disallow: /exam/*/result

Sitemap: https://alnaseer.org/sitemap.xml
`;

export default function handler(): Response {
  return new Response(ROBOTS_TEXT, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
