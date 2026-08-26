export const TELEGRAM_ADMIN_PROXY = '/api/telegram-admin?path=';

export class TelegramAdminApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'TelegramAdminApiError';
    this.status = status;
    this.code = code;
  }
}

type JsonRecord = Record<string, any>;

export async function telegramAdminRequest<T extends JsonRecord = JsonRecord>(token: string | undefined, path: string, options: RequestInit = {}): Promise<T> {
  if (!token) throw new TelegramAdminApiError(401, 'session_missing', 'انتهت جلسة الإدارة. سجّل الدخول مجددًا.');
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${TELEGRAM_ADMIN_PROXY}${encodeURIComponent(path)}`, { ...options, headers, credentials: 'same-origin', cache: 'no-store' });
  const text = await response.text();
  let body: JsonRecord = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { ok: false, error: 'invalid_json_response' }; }
  if (!response.ok || body.ok === false) {
    const code = typeof body.error === 'string' ? body.error : `http_${response.status}`;
    const safeMessage = response.status === 403 ? 'رفض الخادم الطلب الإداري. تأكد من أن نسخة proxy المنشورة محدثة وأن دورك مدير.' : typeof body.message === 'string' ? body.message : 'تعذر تنفيذ العملية الإدارية.';
    throw new TelegramAdminApiError(response.status, code, safeMessage);
  }
  return body as T;
}

export function formatTelegramAdminError(error: unknown): string {
  if (error instanceof TelegramAdminApiError) return `${error.message} (${error.status}/${error.code})`;
  return error instanceof Error ? error.message : 'تعذر تنفيذ العملية الإدارية.';
}
