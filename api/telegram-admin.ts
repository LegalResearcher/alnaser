import type { IncomingMessage, ServerResponse } from 'node:http';

const BOT_API = 'https://alnasser-legal-telegram-bot-supabase-hasadalyoum.vercel.app';
const ALLOWED_PREFIX = '/api/telegram/admin/';

type VercelRequest = IncomingMessage & { body?: unknown };

function jsonResponse(res: ServerResponse, body: Record<string, unknown>, status: number): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function requestHeader(request: VercelRequest, name: string): string | undefined {
  const value = request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value.join(', ') : value;
}

async function requestBody(request: VercelRequest): Promise<Buffer | undefined> {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') return undefined;
  if (Buffer.isBuffer(request.body)) return request.body;
  if (typeof request.body === 'string') return Buffer.from(request.body);
  if (request.body !== undefined) return Buffer.from(JSON.stringify(request.body));

  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
}

async function handler(request: VercelRequest, response: ServerResponse): Promise<void> {
  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.setHeader('Cache-Control', 'no-store');
    response.end();
    return;
  }

  const incoming = new URL(request.url || '/', 'https://alnaseer.org');
  const relativePath = incoming.searchParams.get('path') || '';
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  if (!path.startsWith(ALLOWED_PREFIX) && path !== '/api/telegram/admin-stats') {
    jsonResponse(response, { ok: false, error: 'invalid_admin_path' }, 400);
    return;
  }

  const query = new URLSearchParams(incoming.searchParams);
  query.delete('path');
  const target = `${BOT_API}${path}${query.size ? `?${query.toString()}` : ''}`;
  const headers = new Headers();
  const authorization = requestHeader(request, 'authorization');
  const contentType = requestHeader(request, 'content-type');
  if (authorization) headers.set('Authorization', authorization);
  if (contentType) headers.set('Content-Type', contentType);
  // The bot protects admin routes by Origin; the server-to-server proxy must preserve the trusted platform origin.
  headers.set('Origin', 'https://alnaseer.org');

  try {
    const upstream = await fetch(target, {
      method: request.method || 'GET',
      headers,
      body: await requestBody(request),
    });
    response.statusCode = upstream.status;
    response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.end(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    jsonResponse(response, { ok: false, error: 'bot_api_unreachable' }, 502);
  }
}

export default handler;

export const config = {
  api: {
    bodyParser: false,
  },
};
