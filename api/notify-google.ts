/**
 * Alnasser Tech Digital Solutions
 * api/notify-google.ts — Google Indexing API
 *
 * يُخبر جوجل فوراً عند إضافة/تعديل محتوى جديد
 * بدلاً من انتظار العنكبوت أن يكتشفه وحده
 *
 * ─── المتطلبات ───
 * 1. فعّل "Web Search Indexing API" في Google Cloud Console
 * 2. أنشئ Service Account وحمّل مفتاح JSON
 * 3. أضف Service Account كـ Owner في Google Search Console
 * 4. ضع محتوى ملف JSON في متغير بيئة: GOOGLE_SERVICE_ACCOUNT_JSON
 */

const INDEXING_API_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const BASE_URL = 'https://alnaseer.org';

// أنواع الإشعارات
type NotificationType = 'URL_UPDATED' | 'URL_DELETED';

interface NotifyResult {
  url: string;
  success: boolean;
  error?: string;
}

/**
 * يُنشئ JWT Token لمصادقة Google API
 * (يستخدم مفتاح الـ Service Account)
 */
async function getGoogleAuthToken(serviceAccountJson: string): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountJson);

  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // ترميز Base64URL
  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const unsignedToken = `${encode(header)}.${encode(payload)}`;

  // توقيع بـ RSA-SHA256
  const keyData = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');

  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signedB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const jwt = `${unsignedToken}.${signedB64}`;

  // استبدال JWT بـ Access Token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

/**
 * يُرسل إشعاراً لجوجل لـ URL واحد
 */
async function notifyUrl(
  url: string,
  type: NotificationType,
  accessToken: string
): Promise<NotifyResult> {
  try {
    const res = await fetch(INDEXING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url, type }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { url, success: false, error: err };
    }

    return { url, success: true };
  } catch (e) {
    return { url, success: false, error: String(e) };
  }
}

/**
 * ─── الدالة الرئيسية ───
 * ترسل إشعارات لجوجل لقائمة من الـ URLs
 *
 * الاستخدام من الكود:
 * await notifyGoogleIndexing(['/levels/1', '/exam/5']);
 */
export async function notifyGoogleIndexing(
  paths: string[],
  type: NotificationType = 'URL_UPDATED'
): Promise<NotifyResult[]> {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    console.warn('⚠️  GOOGLE_SERVICE_ACCOUNT_JSON غير موجود في متغيرات البيئة');
    return [];
  }

  const accessToken = await getGoogleAuthToken(serviceAccountJson);
  const urls = paths.map(p => `${BASE_URL}${p}`);

  // إرسال الإشعارات على التوازي (بحد أقصى 200 URL في اليوم)
  const results = await Promise.all(
    urls.map(url => notifyUrl(url, type, accessToken))
  );

  const succeeded = results.filter(r => r.success).length;
  const failed    = results.filter(r => !r.success).length;
  console.log(`✅ Google Indexing: ${succeeded} نجح، ${failed} فشل`);

  return results;
}

/**
 * ─── Vercel API Handler ───
 * POST /api/notify-google
 * Body: { paths: string[], type?: 'URL_UPDATED' | 'URL_DELETED' }
 *
 * مثال الاستدعاء:
 * fetch('/api/notify-google', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json', 'x-api-key': 'YOUR_SECRET' },
 *   body: JSON.stringify({ paths: ['/levels/1', '/exam/5'] })
 * })
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // حماية بسيطة بـ API Key
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.NOTIFY_API_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { paths, type = 'URL_UPDATED' } = await req.json();

  if (!Array.isArray(paths) || paths.length === 0) {
    return new Response('paths array required', { status: 400 });
  }

  if (paths.length > 200) {
    return new Response('Max 200 URLs per day', { status: 400 });
  }

  const results = await notifyGoogleIndexing(paths, type);

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
