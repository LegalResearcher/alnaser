/**
 * api/sitemap.ts — Vercel Serverless Function
 * sitemap يضم الصفحات العامة القابلة للفهرسة فقط
 * آخر تحديث: 2026-06-15
 */

export const config = { runtime: 'edge' };

const BASE_URL = 'https://alnaseer.org';
const TODAY    = '2026-06-15';

function url(loc: string, changefreq: string, priority: string, lastmod = TODAY) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

// أسئلة مختارة للفهرسة (صفحات /question/:id عامة وقابلة للفهرسة)
const QUESTION_IDS = [
  // ════ المستوى الأول (25 سؤال) ════
  'c68ad808-b931-474a-bd1b-832926c6df7d',
  '29c96eb9-90fd-419e-8c18-1229a2638441',
  'ae365372-f8df-452c-8aac-ba42a24a48ee',
  '73c27adb-22d2-459e-88b6-117988c9d484',
  'fc60ecef-4c40-45ac-a502-33240c1a9947',
  '53b5b3b0-e24d-425f-a097-80e576b732d5',
  '0c74606e-148a-475d-9f8f-19ec71e95722',
  '18ef6335-0c83-4e14-8332-01adb41a547e',
  '9fc86187-1aa8-4f55-8137-68d9deddb6a9',
  '76f6e1c1-69e8-4b3e-b74a-89f5ec8edc14',
  'd108fd41-075f-47d5-b765-9487b7bb97bb',
  '50b740a1-2f57-45d6-83fa-08aff525c6f2',
  '7b940dba-e255-4cb7-96af-abf4ae4b16ce',
  'db899333-3ba0-4c8c-b127-bca2b9be6694',
  'fff399dc-5f0e-4b23-9df9-7ef33503ab86',
  'f697fcf2-844a-4b74-bfac-22951b264cd7',
  '4db9988c-27bb-42ec-8813-65f55d851870',
  '380288b6-fbfa-412a-9cb5-e69923c1367e',
  'e42719a0-4d7f-4c98-aa28-c52844df4f92',
  '62d979f1-a287-4069-b0ff-fa06083d85b6',
  'b2fd4675-1947-46c5-8431-67f94d51bd3a',
  '5a5cdf8c-990d-4223-82b5-9f6b2ae5ef5a',
  '6447507a-ff4f-4659-ab66-74b2d1f6af2f',
  '59276db8-7228-4b47-a314-86884c7ee857',
  'f5763d49-f5e0-4cf1-9f5f-875a636d8240',
  // ════ المستوى الثاني (25 سؤال) ════
  'fab4f376-69f1-42d4-84bd-d3ce5f3882fb',
  'b2cbfff1-55ef-4826-9187-de03d782598d',
  '8f8be1b8-3bf6-4afb-bea2-08376ee43dd2',
  '07d6e949-29aa-44a7-ac44-2f4a6fa7b93b',
  'abeee710-ffdd-4780-af88-93ada2f707f1',
  'f2149f66-d35e-4c0e-bf36-18fb7badb4d8',
  '317dcf83-11a0-48f0-a6eb-99797b7de76f',
  'f0f7ae3e-df6c-4230-ad3c-d3c090e809b0',
  '0765ddd7-769a-452a-a596-b6cc684ad55d',
  '727300da-d7c7-402c-855a-0f905c15d79f',
  '3a0a9ef5-ba65-4426-89bd-831c9fe50eb5',
  '8fb5bb88-acd4-4ce7-946a-38c3a2205264',
  '1271dfd4-589c-4254-93e4-848adefd36b1',
  'a0ca4e6a-0c51-47fc-b13f-f2efddff4bae',
  '2f25b8e7-da18-471b-8d3a-48fb05feb28a',
  'fe012d30-e085-4468-acb2-48a5b88bf386',
  'f5997fe7-0f8c-4d68-9ae3-cad2301ecb3c',
  '410b8665-d300-43fb-a0ee-d251194f72cb',
  '2dcacfeb-31fa-4567-8633-56bc87050834',
  'eb033e32-3ca3-486c-8aa6-a44275312e9d',
  '8290776d-acae-42f4-b65f-afd6bc5f206a',
  'c3585729-a33c-44e9-8a18-bb96a1e9a553',
  'd4372ccb-f7b5-404d-97e4-c6f8fccc9f89',
  '9c2201fc-9229-4ccb-b16c-8cd7fd429626',
  '02855212-0293-4638-946f-22878f45e1c2',
  // ════ المستوى الثالث (25 سؤال) ════
  '9b9e68cb-116f-4d1d-9c9b-a5efdf3244cc',
  '5bc9c438-4884-4b7f-989a-281b3794ec05',
  '0a5cbf6f-4e2a-45f5-9aa9-1148beb20c78',
  '2230ce51-c5a0-4fca-95fc-736467a0f51c',
  '9e08cf1f-ec1c-4b1f-96c3-6ccd8c15ac1e',
  'f0c401d3-7304-45e8-ae6e-be1eef4c4081',
  '2203565c-16ee-46f6-9482-836b340d2106',
  'd6fac289-f1c6-4fc2-bff1-3c2f518539bb',
  'ea3921ba-ed0a-4fba-a4fd-9308059417c8',
  'f5fb4e16-21e1-40c0-98dd-6e5a06826ef6',
  '792e6d87-b87c-4aea-a76f-45ac8dc50531',
  'd7273e70-ffd9-4559-9730-92e204d44227',
  '16ee6fe6-575c-4cb1-b800-462237321cdc',
  'b1659350-aa7c-402b-899c-e585dd355d37',
  '01076f9d-fda0-4da5-bee5-2de7ae46b34d',
  '7bbe2b0c-cf27-475e-b8c3-c6eac0935a05',
  '7a41564b-d693-4d18-9717-b15620b4d4cf',
  'b7c96ab4-981a-44f1-953a-2df398e67503',
  'd45c52b8-4bce-4c6b-b248-4fe90916031f',
  '71f2924c-b3a8-498d-93aa-0aa51a068c91',
  'fe64f294-7399-4f3f-bda0-2a1656219365',
  '5ab8eeca-cf94-4b24-8bf2-fda19771fedd',
  '840273f6-39b1-4612-add0-ba14aaf225b7',
  '09ef007d-586c-4757-ad2f-49e3efff8557',
  '40b67d60-3e05-44c4-bc85-8a526baf2778',
  // ════ المستوى الرابع (25 سؤال) ════
  'e6895cbf-1050-42cb-bc43-7b326fa2dc5b',
  '62070fb7-69f4-4c8e-8a7b-4180f18b89a0',
  'a6aba8f3-9ea3-4484-a2e2-4e8cfa64adb0',
  '038995ec-a827-44cd-a4f3-c7f8af2510b3',
  '1edfc2dd-a7e6-45a0-bb87-648b3f302c0c',
  '32749439-c416-4a14-b4d0-f1d1117705d7',
  'c45d5dd3-c2c2-41ce-acfb-90abc8265b0e',
  '166e1bdc-16e2-4484-b152-7a334100e049',
  '102116d4-5b1b-4c32-bf48-cc90a5f7fb18',
  'e4e40ff3-b591-488a-bf73-ae00b3af6288',
  '57d0eb36-98f8-4a51-94f5-db200ce53542',
  '2e846054-446b-4ad7-b02b-bfe265e43efd',
  'a172f481-b60c-49a4-aaf3-8217fe1d7c8b',
  'afc7e49b-79a2-4faa-ab7d-c6190041b1b6',
  'e2145d0a-565a-4b4f-be11-501d4dc07dca',
  '34459fed-763b-411f-a802-0a7f964f71dc',
  '55f60849-b4da-414f-a8a0-d522b03a0d6f',
  '5297c8f9-4a63-4407-a967-95a9b8871564',
  '6f4d8e14-dec6-4f63-a540-119c27ab6530',
  '4c4b453c-bfc2-44c2-86db-6fd5cd73a0be',
  '558bd2bd-0172-4008-b014-121e295f0251',
  '8207e8ad-4133-40b9-8d38-14fcd8bc5d1c',
  '0ee54de5-2439-4684-b47c-a6deed5f64c9',
  'a4e3185e-b097-4b06-87e0-5dbb20ccdb07',
  '0d7d3c56-f87e-4c57-8cca-6f84b1b1ebee',
];

export default async function handler(_req: Request): Promise<Response> {
  const entries: string[] = [];

  // ── الصفحات الثابتة العامة ──
  entries.push(url(`${BASE_URL}`,            'weekly',  '1.0'));
  entries.push(url(`${BASE_URL}/levels`,     'weekly',  '0.9'));
  entries.push(url(`${BASE_URL}/about`,      'monthly', '0.7'));
  entries.push(url(`${BASE_URL}/features`,   'monthly', '0.6'));
  entries.push(url(`${BASE_URL}/diagnostic`, 'monthly', '0.7'));
  entries.push(url(`${BASE_URL}/privacy`,    'yearly',  '0.3'));

  // ── أسئلة مشتركة (صفحات عامة بمحتوى قانوني فعلي) ──
  for (const id of QUESTION_IDS) {
    entries.push(url(`${BASE_URL}/question/${id}`, 'monthly', '0.5'));
  }

  // ملاحظة: تم حذف /exam/:id و /levels/:id و /progress من الـ sitemap
  // لأنها صفحات ديناميكية تتطلب تسجيل دخول أو تُعيد redirect

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
    http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

${entries.join('\n')}

</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
