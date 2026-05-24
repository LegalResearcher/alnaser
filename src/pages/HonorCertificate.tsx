/**
 * صفحة وثيقة الشرف — منصة الناصر
 * المسار: /honor-certificate
 * بدون أي مكتبة خارجية — يستخدم Canvas API المدمجة في المتصفح
 */

import { useState } from 'react';
import { Award, Download, CheckCircle, User, MapPin, GraduationCap, Phone } from 'lucide-react';

// ─── ثوابت ───────────────────────────────────────────────────────────────────

const LEVELS = [
  { value: '1', label: 'المستوى الأول',        rank: 'بمرتبة الجدارة المعرفية', rankEn: 'jadara'  },
  { value: '2', label: 'المستوى الثاني',       rank: 'بمرتبة الجدارة المعرفية', rankEn: 'jadara'  },
  { value: '3', label: 'المستوى الثالث',       rank: 'بمرتبة التميّز القانوني', rankEn: 'tamayoz' },
  { value: '4', label: 'خريج تخصص الشريعة والقانون — المستوى الرابع', rank: 'بمرتبة الشرف الرفيع',    rankEn: 'sharaf'  },
];

const RANK_STYLES: Record<string, { color: string; colorLight: string; glow: string }> = {
  jadara:  { color: '#1e40af', colorLight: '#dbeafe', glow: 'rgba(30,64,175,0.25)'   },
  tamayoz: { color: '#7e22ce', colorLight: '#f3e8ff', glow: 'rgba(126,34,206,0.25)'  },
  sharaf:  { color: '#92400e', colorLight: '#fef3c7', glow: 'rgba(146,64,14,0.25)'   },
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

// ─── رسم الوثيقة على Canvas ──────────────────────────────────────────────────

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
  const W = 900;
  const H = 1200;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const { name, governorate, levelLabel, rank, rankStyle, verifyCode, exportDate } = data;

  // ── خلفية متدرجة
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,   '#fefce8');
  bg.addColorStop(0.5, '#fef9ee');
  bg.addColorStop(1,   '#fefce8');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── نمط خلفية زخرفي خفيف
  ctx.save();
  ctx.globalAlpha = 0.04;
  for (let x = 0; x < W; x += 60) {
    for (let y = 0; y < H; y += 60) {
      ctx.fillStyle = rankStyle.color;
      ctx.fillRect(x + 30, y + 30, 6, 6);
      ctx.fillRect(x,      y,      6, 6);
    }
  }
  ctx.restore();

  // ── إطار خارجي
  ctx.strokeStyle = rankStyle.color;
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, W - 32, H - 32);

  // ── إطار داخلي
  ctx.strokeStyle = rankStyle.color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.4;
  ctx.strokeRect(28, 28, W - 56, H - 56);
  ctx.globalAlpha = 1;

  // ── زوايا زخرفية
  const corners = [
    [24, 24], [W - 24, 24], [24, H - 24], [W - 24, H - 24]
  ] as [number, number][];
  corners.forEach(([cx, cy]) => {
    ctx.strokeStyle = rankStyle.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const dx = cx < W / 2 ? 1 : -1;
    const dy = cy < H / 2 ? 1 : -1;
    ctx.moveTo(cx, cy + dy * 36);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * 36, cy);
    ctx.stroke();
  });

  // ── بسملة
  ctx.font = 'bold 26px "Traditional Arabic", serif';
  ctx.fillStyle = rankStyle.color;
  ctx.textAlign = 'center';
  ctx.fillText('﷽', W / 2, 90);

  // ── دائرة الشعار
  const cx = W / 2, logoY = 160;
  ctx.save();
  ctx.shadowColor = rankStyle.glow;
  ctx.shadowBlur  = 24;
  const grad = ctx.createRadialGradient(cx, logoY, 0, cx, logoY, 60);
  grad.addColorStop(0, rankStyle.color + 'dd');
  grad.addColorStop(1, rankStyle.color);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, logoY, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.font = '52px serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.fillText('⚖', cx, logoY + 18);

  // ── اسم المنصة
  ctx.font = 'bold 34px "Traditional Arabic", serif';
  ctx.fillStyle = rankStyle.color;
  ctx.textAlign = 'center';
  ctx.fillText('منصة الناصر', cx, 255);

  ctx.font = '15px "Traditional Arabic", serif';
  ctx.fillStyle = '#78716c';
  ctx.fillText('منصة الناصر القانونية  —  alnaseer.org', cx, 280);

  // ── خط فاصل
  const gradLine = ctx.createLinearGradient(cx - 120, 0, cx + 120, 0);
  gradLine.addColorStop(0,   'transparent');
  gradLine.addColorStop(0.5, rankStyle.color);
  gradLine.addColorStop(1,   'transparent');
  ctx.strokeStyle = gradLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 120, 298);
  ctx.lineTo(cx + 120, 298);
  ctx.stroke();

  // ── عنوان الوثيقة
  ctx.font = 'bold 54px "Traditional Arabic", serif';
  ctx.fillStyle = '#1c1917';
  ctx.textAlign = 'center';
  ctx.fillText('لوحة شرف', cx, 368);

  // ── شريط المرتبة
  ctx.save();
  ctx.shadowColor = rankStyle.glow;
  ctx.shadowBlur  = 16;
  const rankGrad = ctx.createLinearGradient(cx - 180, 0, cx + 180, 0);
  rankGrad.addColorStop(0, rankStyle.color + 'ee');
  rankGrad.addColorStop(1, rankStyle.color + 'bb');
  ctx.fillStyle = rankGrad;
  roundRect(ctx, cx - 180, 385, 360, 46, 23);
  ctx.fill();
  ctx.restore();
  ctx.font = 'bold 22px "Traditional Arabic", serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(rank, cx, 415);

  // ── نص التقديم
  ctx.font = '20px "Traditional Arabic", serif';
  ctx.fillStyle = '#44403c';
  ctx.textAlign = 'center';
  ctx.fillText('تتقدم إدارة منصة الناصر القانونية بجزيل الشكر وفائق الامتنان للزميل الفاضل:', cx, 475);

  // ── اسم الطالب
  ctx.save();
  ctx.shadowColor = rankStyle.glow;
  ctx.shadowBlur  = 20;
  ctx.font = 'bold 52px "Traditional Arabic", serif';
  ctx.fillStyle = rankStyle.color;
  ctx.textAlign = 'center';
  ctx.fillText(name, cx, 555);
  ctx.restore();

  // خط تحت الاسم
  ctx.strokeStyle = rankStyle.color + '44';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(cx - 280, 570);
  ctx.lineTo(cx + 280, 570);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── المستوى والمحافظة
  ctx.font = '22px "Traditional Arabic", serif';
  ctx.fillStyle = '#57534e';
  ctx.textAlign = 'center';
  ctx.fillText(`${levelLabel}`, cx, 610);

  // ── النص الرئيسي (سطرين)
  ctx.font = '19px "Traditional Arabic", serif';
  ctx.fillStyle = '#44403c';
  ctx.textAlign = 'center';
  wrapText(ctx, 'نُقدّر عالياً إسهاماته المتواصلة ومثابرته المتميزة خلال مسيرته التعليمية في المنصة،', cx, 668, 750, 36);
  wrapText(ctx, 'واجتيازه متطلبات هذا المستوى بشغفٍ وتفوق، مما أثرى مجتمعنا القانوني الرقمي.', cx, 704, 750, 36);
  wrapText(ctx, 'لذا، كان لزاماً علينا أن نتقدم له بجزيل الشكر والتقدير،', cx, 758, 750, 36);
  wrapText(ctx, 'متمنين له مستقبلاً مهنياً زاهراً في ميدان العدالة والقانون.', cx, 794, 750, 36);

  // ── فاصل
  const gradLine2 = ctx.createLinearGradient(cx - 200, 0, cx + 200, 0);
  gradLine2.addColorStop(0,   'transparent');
  gradLine2.addColorStop(0.5, rankStyle.color + '88');
  gradLine2.addColorStop(1,   'transparent');
  ctx.strokeStyle = gradLine2;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 200, 840);
  ctx.lineTo(cx + 200, 840);
  ctx.stroke();

  // ── التاريخ / التوقيع / رقم التحقق
  const col1 = W * 0.2, col2 = W * 0.5, col3 = W * 0.8;

  ctx.font = '14px "Traditional Arabic", serif';
  ctx.fillStyle = '#78716c';
  ctx.textAlign = 'center';
  ctx.fillText('التاريخ', col1, 876);
  ctx.fillText('مُصدَر من', col2, 876);
  ctx.fillText('رقم التحقق', col3, 876);

  ctx.font = 'bold 18px "Traditional Arabic", serif';
  ctx.fillStyle = '#1c1917';
  ctx.fillText(exportDate, col1, 906);
  ctx.font = '14px "Traditional Arabic", serif';
  ctx.fillStyle = '#78716c';
  ctx.fillText(governorate, col1, 928);

  ctx.font = 'bold 20px "Traditional Arabic", serif';
  ctx.fillStyle = rankStyle.color;
  ctx.fillText('أ / معين الناصر', col2, 906);
  ctx.font = '14px "Traditional Arabic", serif';
  ctx.fillStyle = '#78716c';
  ctx.fillText('منصة الناصر القانونية', col2, 928);

  ctx.font = 'bold 15px monospace';
  ctx.fillStyle = '#1c1917';
  ctx.fillText(verifyCode, col3, 906);

  // ── ختم دائري
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = rankStyle.color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, 1100, 44, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = '30px serif';
  ctx.fillStyle = rankStyle.color;
  ctx.textAlign = 'center';
  ctx.fillText('⚖', cx, 1112);
  ctx.restore();
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
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
}

// ─── الصفحة الرئيسية ─────────────────────────────────────────────────────────

export default function HonorCertificate() {
  const [form, setForm]     = useState({ name: '', phone: '', governorate: '', level: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep]     = useState<'form' | 'preview' | 'done'>('form');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [verifyCode] = useState(generateVerifyCode);

  const selectedLevel = LEVELS.find(l => l.value === form.level);
  const rankStyle     = selectedLevel ? RANK_STYLES[selectedLevel.rankEn] : RANK_STYLES['jadara'];
  const exportDate    = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'الاسم مطلوب';
    if (!form.governorate)  e.governorate = 'المحافظة مطلوبة';
    if (!form.level)        e.level = 'المستوى مطلوب';
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
        levelLabel: selectedLevel?.label || '',
        rank: selectedLevel?.rank || '',
        rankStyle,
        verifyCode,
        exportDate,
      });
      setPreviewUrl(canvas.toDataURL('image/png'));
      setLoading(false);
      setStep('preview');
    }, 100);
  }

  function handleDownload() {
    const link = document.createElement('a');
    link.download = `وثيقة-شرف-${form.name.trim()}-${verifyCode}.png`;
    link.href = previewUrl;
    link.click();
    setStep('done');
  }

  // ─── نموذج الإدخال ────────────────────────────────────────────────────────

  if (step === 'form') {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-600 to-yellow-700 shadow-lg mb-4">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-stone-800">لوحة شرف</h1>
            <p className="text-stone-500 mt-1">منصة الناصر القانونية</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-amber-100 p-8">

            {/* الاسم */}
            <div className="mb-5">
              <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2">
                <User className="w-4 h-4" /> الاسم الكامل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="أدخل اسمك الكامل"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* الهاتف */}
            <div className="mb-5">
              <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2">
                <Phone className="w-4 h-4" /> رقم الهاتف <span className="text-stone-400 text-xs">(اختياري)</span>
              </label>
              <input
                type="tel"
                placeholder="7XXXXXXXX"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                dir="ltr"
              />
            </div>

            {/* المحافظة */}
            <div className="mb-5">
              <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2">
                <MapPin className="w-4 h-4" /> المحافظة <span className="text-red-500">*</span>
              </label>
              <select
                value={form.governorate}
                onChange={e => setForm(f => ({ ...f, governorate: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
              >
                <option value="">— اختر المحافظة —</option>
                {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              {errors.governorate && <p className="text-red-500 text-xs mt-1">{errors.governorate}</p>}
            </div>

            {/* المستوى */}
            <div className="mb-7">
              <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2">
                <GraduationCap className="w-4 h-4" /> المستوى <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {LEVELS.map(l => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, level: l.value }))}
                    className={`px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all text-right ${
                      form.level === l.value
                        ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-md'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-amber-300'
                    }`}
                  >
                    {l.label}
                    <div className="text-xs font-normal text-stone-400 mt-1 truncate">{l.rank}</div>
                  </button>
                ))}
              </div>
              {errors.level && <p className="text-red-500 text-xs mt-1">{errors.level}</p>}
            </div>

            <button
              onClick={handlePreview}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-l from-amber-600 to-yellow-600 text-white font-bold text-lg shadow-lg hover:opacity-90 transition active:scale-95 disabled:opacity-60"
            >
              {loading ? 'جاري التحضير...' : 'معاينة الوثيقة ←'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── معاينة + تنزيل ───────────────────────────────────────────────────────

  return (
    <div dir="rtl" className="min-h-screen bg-stone-900 flex flex-col items-center p-4 gap-6">

      <div className="flex items-center gap-4 w-full max-w-3xl pt-4">
        <button
          onClick={() => setStep('form')}
          className="px-5 py-2.5 rounded-xl bg-stone-700 text-white text-sm hover:bg-stone-600 transition"
        >
          ← تعديل
        </button>
        <div className="flex-1 text-center text-stone-300 text-sm">
          {step === 'done' ? '✅ تم التنزيل بنجاح!' : 'معاينة الوثيقة'}
        </div>
        <button
          onClick={step === 'done' ? undefined : handleDownload}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition active:scale-95 ${
            step === 'done'
              ? 'bg-green-600 text-white cursor-default'
              : 'bg-gradient-to-l from-amber-500 to-yellow-500 text-white hover:opacity-90'
          }`}
        >
          {step === 'done'
            ? <><CheckCircle className="w-4 h-4" /> تم التنزيل</>
            : <><Download className="w-4 h-4" /> تنزيل الوثيقة</>
          }
        </button>
      </div>

      {previewUrl && (
        <img
          src={previewUrl}
          alt="وثيقة الشرف"
          className="shadow-2xl rounded-lg max-w-full"
          style={{ maxWidth: '800px', width: '100%' }}
        />
      )}

      {step === 'done' && (
        <div className="bg-green-900/40 border border-green-500/30 rounded-xl px-6 py-4 text-green-300 text-center text-sm max-w-lg">
          🎉 تم تنزيل وثيقة الشرف على جهازك بنجاح!<br />
          رقم التحقق: <span className="font-mono font-bold">{verifyCode}</span>
        </div>
      )}
    </div>
  );
}
