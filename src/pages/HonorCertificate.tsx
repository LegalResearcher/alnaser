/**
 * صفحة وثيقة الشرف — منصة الناصر القانونية
 * النسخة 2.0 — احترافية عالمية
 * تحميل خط Cairo من Google Fonts داخل Canvas
 * دقة عالية 2x — رسم SVG Path للميزان — ختم رسمي
 */

import { useState, useEffect } from 'react';
import { Award, Send, CheckCircle, User, MapPin, GraduationCap, Loader2, Phone } from 'lucide-react';

// ─── ثوابت ───────────────────────────────────────────────────────────────────

const LEVELS = [
  { value: '1', label: 'المستوى الأول',   rank: 'بمرتبة الجدارة المعرفية', rankEn: 'jadara'  },
  { value: '2', label: 'المستوى الثاني',  rank: 'بمرتبة الجدارة المعرفية', rankEn: 'jadara'  },
  { value: '3', label: 'المستوى الثالث',  rank: 'بمرتبة التميّز القانوني', rankEn: 'tamayoz' },
  { value: '4', label: 'المستوى الرابع',  rank: 'بمرتبة الشرف الرفيع',    rankEn: 'sharaf'  },
];

const RANK_STYLES: Record<string, { color: string; colorDark: string; colorLight: string; glow: string; stars: number }> = {
  jadara:  { color: '#1d4ed8', colorDark: '#1e3a8a', colorLight: '#dbeafe', glow: 'rgba(29,78,216,0.3)',   stars: 3 },
  tamayoz: { color: '#7c3aed', colorDark: '#4c1d95', colorLight: '#ede9fe', glow: 'rgba(124,58,237,0.3)',  stars: 4 },
  sharaf:  { color: '#92400e', colorDark: '#78350f', colorLight: '#fef3c7', glow: 'rgba(146,64,14,0.35)',  stars: 5 },
};

const GOVERNORATES = [
  'صنعاء','عدن','تعز','الحديدة','إب','ذمار','المحويت','حجة','صعدة','عمران',
  'البيضاء','الضالع','شبوة','أبين','لحج','مأرب','الجوف','حضرموت','المهرة','سقطرى','ريمة',
];

function generateVerifyCode(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `NSR-${year}-${rand}`;
}

// ─── تحميل خط Cairo من Google Fonts ─────────────────────────────────────────

async function loadCairoFont(): Promise<void> {
  try {
    // تحميل الخط إذا لم يكن محملاً بالفعل
    if (!document.querySelector('#cairo-font-link')) {
      const link = document.createElement('link');
      link.id = 'cairo-font-link';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap';
      document.head.appendChild(link);
    }
    // انتظار تحميل الخط عبر FontFace API
    await document.fonts.load('900 40px Cairo');
    await document.fonts.load('700 24px Cairo');
    await document.fonts.load('400 18px Cairo');
  } catch {
    // تجاهل خطأ التحميل — سيستخدم الخط الاحتياطي
  }
}

// ─── دوال مساعدة للرسم ───────────────────────────────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line !== '') {
      ctx.fillText(line.trim(), x, currentY);
      line = word + ' ';
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY;
}

// رسم ميزان العدالة بـ Canvas Path (بديل Emoji)
function drawScales(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size * 0.045;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const s = size;
  // العمود المركزي
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.45);
  ctx.lineTo(cx, cy + s * 0.45);
  ctx.stroke();

  // القاعدة
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.35, cy + s * 0.45);
  ctx.lineTo(cx + s * 0.35, cy + s * 0.45);
  ctx.stroke();

  // الذراع الأفقي
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.42, cy - s * 0.18);
  ctx.lineTo(cx + s * 0.42, cy - s * 0.18);
  ctx.stroke();

  // نقطة التوازن
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.18, s * 0.045, 0, Math.PI * 2);
  ctx.fill();

  // الكفتان (نصف دائرة)
  // يسار
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.68, cy + s * 0.04);
  ctx.lineTo(cx - s * 0.16, cy + s * 0.04);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - s * 0.42, cy + s * 0.04, s * 0.26, 0, Math.PI);
  ctx.stroke();

  // يمين
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.16, cy + s * 0.04);
  ctx.lineTo(cx + s * 0.68, cy + s * 0.04);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + s * 0.42, cy + s * 0.04, s * 0.26, 0, Math.PI);
  ctx.stroke();

  // خيوط التعليق
  ctx.lineWidth = size * 0.03;
  // يسار
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.42, cy - s * 0.18);
  ctx.lineTo(cx - s * 0.68, cy + s * 0.04);
  ctx.moveTo(cx - s * 0.42, cy - s * 0.18);
  ctx.lineTo(cx - s * 0.16, cy + s * 0.04);
  ctx.stroke();
  // يمين
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.42, cy - s * 0.18);
  ctx.lineTo(cx + s * 0.16, cy + s * 0.04);
  ctx.moveTo(cx + s * 0.42, cy - s * 0.18);
  ctx.lineTo(cx + s * 0.68, cy + s * 0.04);
  ctx.stroke();

  ctx.restore();
}

// رسم نجوم المرتبة
function drawStars(ctx: CanvasRenderingContext2D, cx: number, cy: number, count: number, color: string, size = 14) {
  const total = count * (size * 2.8);
  let startX = cx - total / 2 + size;
  for (let i = 0; i < count; i++) {
    drawStar(ctx, startX, cy, size, color);
    startX += size * 2.8;
  }
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const innerAngle = outerAngle + (2 * Math.PI) / 10;
    if (i === 0) ctx.moveTo(cx + r * Math.cos(outerAngle), cy + r * Math.sin(outerAngle));
    else ctx.lineTo(cx + r * Math.cos(outerAngle), cy + r * Math.sin(outerAngle));
    ctx.lineTo(cx + (r * 0.42) * Math.cos(innerAngle), cy + (r * 0.42) * Math.sin(innerAngle));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ─── رسم الوثيقة ─────────────────────────────────────────────────────────────

function drawCertificate(
  canvas: HTMLCanvasElement,
  data: {
    name: string;
    governorate: string;
    levelLabel: string;
    rank: string;
    rankStyle: typeof RANK_STYLES['jadara'];
    verifyCode: string;
    exportDate: string;
  }
) {
  // دقة عالية 2x
  const SCALE = 2;
  const W = 900, H = 1270;
  canvas.width  = W * SCALE;
  canvas.height = H * SCALE;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  const { name, governorate, levelLabel, rank, rankStyle, verifyCode, exportDate } = data;
  const cx = W / 2;

  // ── 1. خلفية كريمية راقية
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0,    '#fdfaf3');
  bg.addColorStop(0.15, '#fef9ed');
  bg.addColorStop(0.5,  '#fefbf0');
  bg.addColorStop(0.85, '#fef9ed');
  bg.addColorStop(1,    '#fdfaf3');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── 2. زخرفة إسلامية هندسية خفيفة في الخلفية
  ctx.save();
  ctx.globalAlpha = 0.028;
  ctx.strokeStyle = rankStyle.color;
  ctx.lineWidth = 0.8;
  const step = 80;
  for (let x = 0; x < W; x += step) {
    for (let y = 0; y < H; y += step) {
      // نمط نجمة ثمانية خفيفة
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.stroke();
      if (x + step / 2 < W && y + step / 2 < H) {
        ctx.beginPath();
        ctx.moveTo(x + step / 2 - 8, y + step / 2);
        ctx.lineTo(x + step / 2 + 8, y + step / 2);
        ctx.moveTo(x + step / 2, y + step / 2 - 8);
        ctx.lineTo(x + step / 2, y + step / 2 + 8);
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  // ── 3. توهج مركزي خفيف
  const centerGlow = ctx.createRadialGradient(cx, H * 0.42, 0, cx, H * 0.42, 420);
  centerGlow.addColorStop(0, rankStyle.color + '08');
  centerGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 0, W, H);

  // ── 4. الإطار الخارجي المزدوج
  // ظل للإطار
  ctx.save();
  ctx.shadowColor = rankStyle.color + '40';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = rankStyle.color;
  ctx.lineWidth = 5;
  roundRect(ctx, 18, 18, W - 36, H - 36, 4);
  ctx.stroke();
  ctx.restore();

  // إطار داخلي ذهبي رفيع
  ctx.save();
  ctx.strokeStyle = rankStyle.color;
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.35;
  roundRect(ctx, 30, 30, W - 60, H - 60, 3);
  ctx.stroke();
  ctx.restore();

  // ── 5. زوايا زخرفية مطورة (L + diamond)
  const corners: [number, number, number, number][] = [
    [24, 24,  1,  1],
    [W - 24, 24, -1,  1],
    [24, H - 24,  1, -1],
    [W - 24, H - 24, -1, -1],
  ];
  corners.forEach(([px, py, dx, dy]) => {
    ctx.save();
    ctx.strokeStyle = rankStyle.color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    // L
    ctx.beginPath();
    ctx.moveTo(px, py + dy * 44);
    ctx.lineTo(px, py);
    ctx.lineTo(px + dx * 44, py);
    ctx.stroke();
    // نقطة صغيرة في الزاوية
    ctx.fillStyle = rankStyle.color;
    ctx.beginPath();
    ctx.arc(px + dx * 52, py, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, py + dy * 52, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // ── 6. شريط علوي داكن راقٍ
  const topBar = ctx.createLinearGradient(0, 48, 0, 100);
  topBar.addColorStop(0, rankStyle.colorDark + 'ee');
  topBar.addColorStop(1, rankStyle.color + 'cc');
  ctx.save();
  ctx.fillStyle = topBar;
  ctx.globalAlpha = 0.92;
  roundRect(ctx, 36, 36, W - 72, 64, 3);
  ctx.fill();
  ctx.restore();

  // بسملة داخل الشريط
  ctx.font = '900 22px Cairo, serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('بسم الله الرحمن الرحيم', cx, 78);

  // ── 7. دائرة الشعار
  const logoY = 172;
  ctx.save();
  ctx.shadowColor = rankStyle.glow;
  ctx.shadowBlur = 32;
  // حلقة خارجية
  ctx.strokeStyle = rankStyle.color + '55';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, logoY, 72, 0, Math.PI * 2);
  ctx.stroke();
  // تدرج داخلي
  const logoGrad = ctx.createRadialGradient(cx - 12, logoY - 12, 0, cx, logoY, 62);
  logoGrad.addColorStop(0, rankStyle.color + 'ee');
  logoGrad.addColorStop(0.6, rankStyle.color);
  logoGrad.addColorStop(1, rankStyle.colorDark);
  ctx.fillStyle = logoGrad;
  ctx.beginPath();
  ctx.arc(cx, logoY, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ميزان العدالة (Canvas Path — لا Emoji)
  drawScales(ctx, cx, logoY, 78, '#ffffff');

  // ── 8. اسم المنصة
  ctx.font = '900 30px Cairo, serif';
  ctx.fillStyle = rankStyle.colorDark;
  ctx.textAlign = 'center';
  ctx.fillText('منصة الناصر', cx, 268);

  ctx.font = '400 13px Cairo, serif';
  ctx.fillStyle = '#a8a29e';
  ctx.letterSpacing = '0.15em';
  ctx.fillText('منصة الناصر القانونية  —  alnaseer.org', cx, 290);
  ctx.letterSpacing = '0';

  // فاصل زخرفي
  const drawDivider = (y: number, opacity = 1, width = 160) => {
    ctx.save();
    ctx.globalAlpha = opacity;
    const g = ctx.createLinearGradient(cx - width, 0, cx + width, 0);
    g.addColorStop(0,   'transparent');
    g.addColorStop(0.3, rankStyle.color + '66');
    g.addColorStop(0.5, rankStyle.color);
    g.addColorStop(0.7, rankStyle.color + '66');
    g.addColorStop(1,   'transparent');
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - width, y);
    ctx.lineTo(cx + width, y);
    ctx.stroke();
    // نقطة مركزية
    ctx.fillStyle = rankStyle.color;
    ctx.beginPath();
    ctx.arc(cx, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawDivider(308, 0.8, 140);

  // ── 9. عنوان "لوحة شرف"
  ctx.save();
  ctx.font = '900 58px Cairo, serif';
  // ظل نصي
  ctx.shadowColor = rankStyle.color + '35';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#1c1917';
  ctx.textAlign = 'center';
  ctx.fillText('لوحة شرف', cx, 390);
  ctx.restore();

  // ── 10. شريط المرتبة المطوّر
  // نجوم المرتبة — فوق الشريط
  const rankY = 416;
  drawStars(ctx, cx, rankY - 10, rankStyle.stars, '#fbbf24', 10);

  // شريط المرتبة — النص وحده داخله
  ctx.save();
  ctx.shadowColor = rankStyle.glow;
  ctx.shadowBlur = 20;
  const rankGrad = ctx.createLinearGradient(cx - 210, 0, cx + 210, 0);
  rankGrad.addColorStop(0,   rankStyle.colorDark);
  rankGrad.addColorStop(0.5, rankStyle.color);
  rankGrad.addColorStop(1,   rankStyle.colorDark);
  ctx.fillStyle = rankGrad;
  roundRect(ctx, cx - 210, rankY, 420, 46, 23);
  ctx.fill();
  ctx.restore();

  ctx.font = '700 20px Cairo, serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(rank, cx, rankY + 31);

  // ── 11. نص التقديم
  ctx.font = '400 18px Cairo, serif';
  ctx.fillStyle = '#78716c';
  ctx.textAlign = 'center';
  ctx.fillText('تتقدم إدارة منصة الناصر القانونية بجزيل الشكر وفائق الامتنان للزميل الفاضل:', cx, 496);

  // ── 12. اسم الطالب — القلب البصري
  ctx.save();
  ctx.shadowColor = rankStyle.glow;
  ctx.shadowBlur = 28;
  ctx.font = '900 58px Cairo, serif';
  ctx.fillStyle = rankStyle.color;
  ctx.textAlign = 'center';
  ctx.fillText(name, cx, 578);
  ctx.restore();

  // خط تحت الاسم متدرج
  ctx.save();
  ctx.globalAlpha = 0.3;
  const underline = ctx.createLinearGradient(cx - 300, 0, cx + 300, 0);
  underline.addColorStop(0,   'transparent');
  underline.addColorStop(0.3, rankStyle.color);
  underline.addColorStop(0.7, rankStyle.color);
  underline.addColorStop(1,   'transparent');
  ctx.strokeStyle = underline;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([10, 7]);
  ctx.beginPath();
  ctx.moveTo(cx - 300, 594);
  ctx.lineTo(cx + 300, 594);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // ── 13. التخصص والمستوى
  ctx.font = '600 20px Cairo, serif';
  ctx.fillStyle = '#57534e';
  ctx.textAlign = 'center';
  ctx.fillText(levelLabel, cx, 634);

  // ── 14. فاصل
  drawDivider(656, 0.5, 220);

  // ── 15. النص التقديري
  ctx.font = '400 18px Cairo, serif';
  ctx.fillStyle = '#44403c';
  ctx.textAlign = 'center';
  const line1End = wrapText(ctx,
    'نُقدّر عالياً إسهاماته المتواصلة ومثابرته المتميزة خلال مسيرته التعليمية في المنصة، وإتمامه للرحلة المعرفية بشغف وتفوق، مما أثرى مجتمعنا القانوني الرقمي.',
    cx, 688, 760, 34);
  wrapText(ctx,
    'لذا، كان لزاماً علينا أن نتقدم له بجزيل الشكر والتقدير،',
    cx, line1End + 52, 760, 34);
  wrapText(ctx,
    'متمنين له مستقبلاً مهنياً زاهراً في ميدان العدالة والقانون.',
    cx, line1End + 86, 760, 34);

  // ── 16. فاصل قبل التوقيع
  drawDivider(878, 0.6, 240);

  // ── 17. التاريخ / التوقيع / رقم التحقق
  const col1 = W * 0.18, col2 = W * 0.5, col3 = W * 0.82;

  // عناوين الأعمدة
  ctx.font = '400 13px Cairo, serif';
  ctx.fillStyle = '#a8a29e';
  ctx.textAlign = 'center';
  ctx.fillText('التاريخ والمكان', col1, 904);
  ctx.fillText('مُصدَر من', col2, 904);
  ctx.fillText('رقم التحقق', col3, 904);

  // خط فاصل خفيف بين العناوين والقيم
  ctx.save();
  ctx.strokeStyle = '#e7e5e4';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(44, 912);
  ctx.lineTo(W - 44, 912);
  ctx.stroke();
  ctx.restore();

  // قيم العمود الأول: التاريخ + المدينة
  ctx.font = '700 17px Cairo, serif';
  ctx.fillStyle = '#1c1917';
  ctx.textAlign = 'center';
  ctx.fillText(exportDate, col1, 936);
  ctx.font = '400 14px Cairo, serif';
  ctx.fillStyle = '#78716c';
  ctx.fillText(governorate, col1, 956);

  // توقيع العمود الثاني
  ctx.save();
  ctx.font = '700 22px Cairo, serif';
  ctx.fillStyle = rankStyle.color;
  ctx.shadowColor = rankStyle.glow;
  ctx.shadowBlur = 8;
  ctx.textAlign = 'center';
  ctx.fillText('أ / معين الناصر', col2, 936);
  ctx.restore();
  ctx.font = '400 13px Cairo, serif';
  ctx.fillStyle = '#a8a29e';
  ctx.fillText('منصة الناصر القانونية', col2, 956);

  // رقم التحقق
  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = '#1c1917';
  ctx.fillText(verifyCode, col3, 936);
  // QR placeholder — دائرة صغيرة مع نقطة
  ctx.save();
  ctx.strokeStyle = rankStyle.color + '60';
  ctx.lineWidth = 1;
  ctx.strokeRect(col3 - 20, 943, 40, 40);
  ctx.font = '400 10px Cairo, serif';
  ctx.fillStyle = '#a8a29e';
  ctx.fillText('تحقق', col3, 968);
  ctx.restore();

  // ── 18. ختم رسمي في الأسفل
  const sealY = 1150;
  ctx.save();
  // الدائرة الخارجية
  ctx.strokeStyle = rankStyle.color;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(cx, sealY, 54, 0, Math.PI * 2);
  ctx.stroke();
  // الدائرة الداخلية
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(cx, sealY, 46, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // ميزان مصغر داخل الختم
  ctx.save();
  ctx.globalAlpha = 0.65;
  drawScales(ctx, cx, sealY - 4, 52, rankStyle.color);
  ctx.restore();

  // نص "منصة الناصر" على قوس داخل الختم
  ctx.save();
  ctx.font = '600 11px Cairo, serif';
  ctx.fillStyle = rankStyle.color;
  ctx.globalAlpha = 0.8;
  ctx.textAlign = 'center';
  ctx.fillText('منصة الناصر القانونية', cx, sealY + 42);
  ctx.restore();

  // ── 19. نجمة ذهبية على جانبي الختم
  drawStar(ctx, cx - 78, sealY, 8, rankStyle.color + 'aa');
  drawStar(ctx, cx + 78, sealY, 8, rankStyle.color + 'aa');
}

// ─── الصفحة الرئيسية ─────────────────────────────────────────────────────────

export default function HonorCertificate() {
  const [form, setForm]       = useState({ name: '', governorate: '', level: '', batch: '', phone: '' });
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [step, setStep]       = useState<'form' | 'preview' | 'done'>('form');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [verifyCode] = useState(generateVerifyCode);
  const [fontReady, setFontReady] = useState(false);

  const selectedLevel = LEVELS.find(l => l.value === form.level);
  const rankStyle     = selectedLevel ? RANK_STYLES[selectedLevel.rankEn] : RANK_STYLES['jadara'];
  const exportDate    = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

  // تحميل الخط عند فتح الصفحة
  useEffect(() => {
    loadCairoFont().then(() => setFontReady(true));
  }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'الاسم مطلوب';
    if (!form.governorate) e.governorate = 'المحافظة مطلوبة';
    if (!form.level)       e.level = 'المستوى مطلوب';
    if (!form.batch.trim()) e.batch = 'رقم الدفعة مطلوب';
    if (!form.phone.trim()) e.phone = 'رقم الهاتف مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handlePreview() {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      drawCertificate(canvas, {
        name: form.name.trim(),
        governorate: form.governorate,
        levelLabel: form.level === '4'
          ? `خريج الشريعة والقانون — الدفعة ${form.batch}`
          : `خريج الشريعة والقانون — ${selectedLevel?.label || ''} — الدفعة ${form.batch}`,
        rank: selectedLevel?.rank || '',
        rankStyle,
        verifyCode,
        exportDate,
      });
      setPreviewUrl(canvas.toDataURL('image/png', 1.0));
      setLoading(false);
      setStep('preview');
    }, fontReady ? 80 : 600);
  }

  function handleSendRequest() {
    const levelText = form.level === '4'
      ? `الدفعة ${form.batch}`
      : `${selectedLevel?.label || ''} — الدفعة ${form.batch}`;
    const msg = encodeURIComponent(
      `🏅 طلب لوحة شرف\n` +
      `━━━━━━━━━━━━━━━\n` +
      `👤 الاسم: ${form.name.trim()}\n` +
      `📍 المحافظة: ${form.governorate}\n` +
      `🎓 المستوى: ${levelText}\n` +
      `📱 رقم الهاتف: ${form.phone.trim()}\n` +
      `🔑 رقم التحقق: ${verifyCode}`
    );
    window.open(`https://t.me/MuenAlnaser?text=${msg}`, '_blank');
    setStep('done');
  }

  // ─── نموذج الإدخال ──────────────────────────────────────────────────────

  if (step === 'form') {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">

          {/* رأس الصفحة */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full shadow-xl mb-4"
              style={{ background: `linear-gradient(135deg, ${rankStyle.colorDark}, ${rankStyle.color})` }}>
              <Award className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black text-stone-800 tracking-tight">لوحة شرف</h1>
            <p className="text-stone-400 mt-1 text-sm">منصة الناصر القانونية — alnaseer.org</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-amber-100/60 p-8">

            {/* الاسم */}
            <div className="mb-5">
              <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-2">
                <User className="w-4 h-4" /> الاسم الكامل <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="أدخل اسمك الكامل"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition text-base"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name}</p>}
            </div>

            {/* المحافظة */}
            <div className="mb-5">
              <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-2">
                <MapPin className="w-4 h-4" /> المحافظة <span className="text-red-400">*</span>
              </label>
              <select
                value={form.governorate}
                onChange={e => setForm(f => ({ ...f, governorate: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition text-base"
              >
                <option value="">— اختر المحافظة —</option>
                {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              {errors.governorate && <p className="text-red-400 text-xs mt-1.5">{errors.governorate}</p>}
            </div>

            {/* المستوى */}
            <div className="mb-7">
              <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-3">
                <GraduationCap className="w-4 h-4" /> المستوى الدراسي <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {LEVELS.map(l => {
                  const rs = RANK_STYLES[l.rankEn];
                  const isSelected = form.level === l.value;
                  return (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, level: l.value }))}
                      className="px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all text-right"
                      style={isSelected ? {
                        borderColor: rs.color,
                        backgroundColor: rs.colorLight,
                        color: rs.colorDark,
                        boxShadow: `0 0 0 3px ${rs.color}22`,
                      } : {
                        borderColor: '#e7e5e4',
                        backgroundColor: '#fafaf9',
                        color: '#57534e',
                      }}
                    >
                      {l.label}
                      <div className="text-xs font-normal mt-1 opacity-60 truncate">{l.rank}</div>
                    </button>
                  );
                })}
              </div>
              {errors.level && <p className="text-red-400 text-xs mt-1.5">{errors.level}</p>}
            </div>

            {/* رقم الدفعة */}
            <div className="mb-7">
              <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-2">
                <GraduationCap className="w-4 h-4" /> رقم الدفعة <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="مثال: 20 أو 52"
                value={form.batch}
                onChange={e => setForm(f => ({ ...f, batch: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition text-base"
              />
              {errors.batch && <p className="text-red-400 text-xs mt-1.5">{errors.batch}</p>}
            </div>

            {/* رقم الهاتف */}
            <div className="mb-7">
              <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-2">
                <Phone className="w-4 h-4" /> رقم الهاتف <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                placeholder="مثال: 7XXXXXXXX"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition text-base"
                dir="ltr"
              />
              {errors.phone && <p className="text-red-400 text-xs mt-1.5">{errors.phone}</p>}
            </div>

            <button
              onClick={handlePreview}
              disabled={loading}
              className="w-full py-4 rounded-xl text-white font-black text-lg shadow-lg hover:opacity-92 transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${rankStyle.colorDark}, ${rankStyle.color})` }}
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري إنشاء الوثيقة...</>
                : 'معاينة الوثيقة ←'
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── معاينة + تنزيل ─────────────────────────────────────────────────────

  return (
    <div dir="rtl" className="min-h-screen bg-stone-950 flex flex-col items-center p-4 gap-5">

      <div className="flex items-center gap-3 w-full max-w-3xl pt-4">
        <button
          onClick={() => setStep('form')}
          className="px-5 py-2.5 rounded-xl bg-stone-800 text-stone-200 text-sm hover:bg-stone-700 transition border border-stone-700"
        >
          ← تعديل
        </button>
        <div className="flex-1 text-center text-stone-400 text-sm">
          {step === 'done' ? '✅ تم إرسال الطلب!' : 'معاينة الوثيقة'}
        </div>
        <button
          onClick={step === 'done' ? undefined : handleSendRequest}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition active:scale-95"
          style={step === 'done'
            ? { background: '#16a34a', cursor: 'default' }
            : { background: `linear-gradient(135deg, ${rankStyle.colorDark}, ${rankStyle.color})` }
          }
        >
          {step === 'done'
            ? <><CheckCircle className="w-4 h-4" /> تم الإرسال</>
            : <><Send className="w-4 h-4" /> إرسال طلب</>
          }
        </button>
      </div>

      {previewUrl && (
        <img
          src={previewUrl}
          alt="وثيقة الشرف"
          className="rounded-xl shadow-2xl max-w-full ring-1 ring-white/10"
          style={{ maxWidth: '780px', width: '100%' }}
        />
      )}

      {step === 'done' && (
        <div className="bg-emerald-950/50 border border-emerald-700/30 rounded-xl px-6 py-4 text-emerald-300 text-center text-sm max-w-lg">
          🎉 تم إرسال طلبك بنجاح!<br /><br />
          <span className="text-yellow-300 font-semibold">يرجى التأكد من كتابة رقم جوالك في الرسالة،</span><br />
          وسيتم مراجعتها من قبل الإدارة وإرسال الوثيقة لكم في أقرب وقت.
        </div>
      )}
    </div>
  );
}
