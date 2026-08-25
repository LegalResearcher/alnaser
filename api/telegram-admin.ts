const BOT_API = 'https://alnasser-legal-telegram-bot-supabase-git-sup-f04e08-hasadalyoum.vercel.app';
const ALLOWED_PREFIX = '/api/telegram/admin/';

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export default async function handler(request: Request): Promise<Response> {
  const incoming = new URL(request.url, 'https://alnaseer.org');
  const relativePath = incoming.searchParams.get('path') || '';
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  if (!path.startsWith(ALLOWED_PREFIX) && path !== '/api/telegram/admin-stats') return jsonResponse({ ok: false, error: 'invalid_admin_path' }, 400);

  const query = new URLSearchParams(incoming.searchParams);
  query.delete('path');
  const target = `${BOT_API}${path}${query.size ? `?${query.toString()}` : ''}`;
  const headers = new Headers();
  const authorization = request.headers.get('authorization');
  const contentType = request.headers.get('content-type');
  if (authorization) headers.set('Authorization', authorization);
  if (contentType) headers.set('Content-Type', contentType);

  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
    });
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', response.headers.get('content-type') || 'application/json; charset=utf-8');
    responseHeaders.set('Cache-Control', 'no-store');
    return new Response(response.body, { status: response.status, headers: responseHeaders });
  } catch {
    return jsonResponse({ ok: false, error: 'bot_api_unreachable' }, 502);
  }
}
