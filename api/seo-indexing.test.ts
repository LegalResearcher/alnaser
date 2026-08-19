import { describe, expect, it } from 'vitest';
import render from './render';
import robots from './robots';
import sitemap from './sitemap';

describe('فهرسة منصة الناصر', () => {
  it('يعلن الروابط العامة للبوت والاختبارات والأسئلة المتنوعة في خريطة الموقع', async () => {
    const response = await sitemap(new Request('https://alnaseer.org/api/sitemap'));
    const xml = await response.text();

    expect(response.headers.get('Content-Type')).toContain('application/xml');
    expect(xml).toContain('https://alnaseer.org/bot');
    expect(xml).toContain('https://alnaseer.org/exam/31817818-25ec-43eb-b9d5-40be136b4948');
    expect(xml).toContain('https://alnaseer.org/exam/6556e38f-d2c4-43fc-8797-c96a8f18edd8');
    expect(xml).toContain('https://alnaseer.org/question/00058303-2b8c-453f-99db-8010780aefc2');
    expect(xml).toContain('https://alnaseer.org/question/0002ad16-960a-4219-b15e-ac1ef0b667e3');
  });

  it('يقدم robots قابلًا للوصول ويرشد الزواحف إلى خريطة الموقع', async () => {
    const response = robots();
    const text = await response.text();

    expect(response.headers.get('Content-Type')).toContain('text/plain');
    expect(text).toContain('Allow: /');
    expect(text).toContain('Disallow: /admin/');
    expect(text).toContain('Sitemap: https://alnaseer.org/sitemap.xml');
  });

  it('يعرض صفحة البوت للزواحف بمحتوى عربي وبيانات منظمة', async () => {
    const response = await render(new Request('https://alnaseer.org/api/render?path=/bot', {
      headers: { 'user-agent': 'Googlebot' },
    }));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Robots-Tag')).toBe('index, follow');
    expect(html).toContain('بوت الناصر القانوني على تيليغرام');
    expect(html).toContain('https://t.me/Moieen2025Bot');
    expect(html).toContain('https://alnaseer.org/images/alnaser-bot-social-logo.png');
    expect(html).toContain('SoftwareApplication');
  });
});
