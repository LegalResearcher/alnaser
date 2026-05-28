/**
 * Alnasser Tech Digital Solutions
 * Shared core: PDF question parsing (RTL Arabic, single OR two-column layouts)
 *
 * هذه الطبقة المشتركة (Shared/Core) خالية من أي اعتماد على المتصفح أو pdf.js،
 * لذلك يمكن اختبارها بشكل مستقل (TDD). تتلقى الكلمات مع إحداثياتها وحالة التظليل،
 * وتُعيد الأسئلة المُستخرجة.
 */

export interface ParserWord {
  text: string;
  /** إحداثي x (يسار→يمين) لبداية الكلمة بوحدات نقاط PDF */
  x: number;
  /** إحداثي الأعلى→الأسفل (top). كلما زاد كان أقرب لأسفل الصفحة */
  top: number;
  /** عرض الكلمة/المحرف بوحدات نقاط PDF (اختياري، يحسّن كشف العمودين ودمج المحارف) */
  width?: number;
  /** ارتفاع/حجم الخط بوحدات نقاط PDF (اختياري، يُستخدم كمرجع لعتبة المسافة بين الكلمات) */
  h?: number;
  /** هل الكلمة داخل تظليل (أخضر/أزرق) أو نصها أبيض على خلفية ملوّنة */
  highlighted?: boolean;
  /** عنصر مسافة صريح صادر عن pdf.js (str يحتوي فراغاً فقط) → يُستخدم كفاصل كلمات */
  space?: boolean;
}

export interface ParsedQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  hint: string;
  explanation: string;
  count: number;
}

export interface ParseOptions {
  skipRe?: RegExp;
  pageWidth?: number;
  log?: (...args: any[]) => void;
}

const DEFAULT_SKIP_RE =
  /Page \d+ of|ةداملا مسا|جذومنلا صاخلا|ةحيحصلا ةباجلاا|ةحیحصلا ةباجلاا|ةحیحصلا ةباجلإا|رتخا ةباجلاا|رتخا ةباجلإا|ةباجلإا رتخا|نوناقلاو ةعيرشلا|ةعماج ءاعنص|يللآا لورتنكلا|رابتخا ةدام|رابتخا ةداـم|تاءارجإب ةقباطم|PAT\.|اسم المادة|النموذج الخاص|الزمن|التاريخ|ورقة الاسئلة|ةلئسلاا ةقرو/;

const stripBidi = (t: string) =>
  t.replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '').trim();

/** تطبيع أشكال العرض العربية إلى Unicode القياسي */
export const normalizeArabicPresentationForms = (text: string): string =>
  text.replace(/[\uFB50-\uFDFF\uFE70-\uFEFF]/g, (ch) => {
    try {
      return ch.normalize('NFKC');
    } catch {
      return ch;
    }
  });

const cleanOpt = (t: string) =>
  stripBidi(t).replace(/[.،,\s]+$/, '').replace(/^[.،,\s]+/, '').trim();

interface RowSeg {
  top: number;
  text: string;
  highlighted: boolean;
}

/**
 * دمج عناصر سطرٍ مرتّبة بترتيب القراءة (RTL: من اليمين لليسار) إلى نص.
 *
 * تُصدِر بعض ملفات PDF كلَّ حرفٍ عربي كعنصرٍ مستقل، فيؤدي الدمج الساذج بـ join(' ')
 * إلى إدراج مسافة بين كل حرف ("م ت ى ت ج ر م"). هنا ندمج المحارف المتلاصقة بدون مسافة،
 * ولا نُدرج مسافة إلا عندما تكون الفجوة الأفقية بينها كبيرة بما يكفي لتكون حدّ كلمة،
 * أو عند وجود عنصر مسافة صريح من pdf.js.
 */
function joinReadingOrder(ordered: ParserWord[]): string {
  if (ordered.length === 0) return '';

  // مرجع حجم الخط: نُفضّل الارتفاع، وإلا فالعرض الوسيط للعناصر النصية
  const sizes = ordered
    .filter((w) => !w.space)
    .map((w) => w.h || w.width || 0)
    .filter((v) => v > 0)
    .sort((a, b) => a - b);
  const refSize = sizes.length ? sizes[Math.floor(sizes.length / 2)] : 6;
  const spaceThreshold = Math.max(0.5, refSize * 0.18);

  let out = '';
  let prev: ParserWord | null = null;   // آخر عنصر نصي (إلى اليمين، x أكبر)
  let pendingSpace = false;             // هل صادفنا عنصر مسافة صريح؟
  for (const cur of ordered) {
    // عنصر مسافة صريح من pdf.js → فاصل كلمات مؤكد
    if (cur.space) { pendingSpace = true; continue; }
    if (prev === null) {
      out = cur.text;
    } else {
      // الفجوة الموضعية = الحافة اليسرى لـ prev ناقص الحافة اليمنى لـ cur
      const gap = prev.x - (cur.x + (cur.width || 0));
      const needSpace = pendingSpace || gap > spaceThreshold;
      out += (needSpace ? ' ' : '') + cur.text;
    }
    prev = cur;
    pendingSpace = false;
  }
  return out;
}

/**
 * يقرّر تقسيم سطرٍ إلى عمودين فقط عند وجود فجوة (gutter) فعلية تفصل بين المجموعتين.
 * السطور الممتدة بعرض الصفحة (سؤال/تعليمات/خيار طويل) تبقى مقطعاً واحداً ولا تُقص في المنتصف.
 */
function splitRowAtGutter(ws: ParserWord[], gutterX: number, pageW: number): ParserWord[][] {
  const right = ws.filter((w) => w.x > gutterX);
  const left = ws.filter((w) => w.x <= gutterX);
  if (!right.length || !left.length) return [ws];
  const leftMaxRight = Math.max(...left.map((w) => w.x + (w.width || 0)));
  const rightMinLeft = Math.min(...right.map((w) => w.x));
  const gap = rightMinLeft - leftMaxRight;
  // فجوة واضحة عند المنتصف → عمودان
  if (gap >= pageW * 0.05) return [right, left];
  // حتى بدون فجوة: إذا كان أول كلمة في الجهة اليسرى علامة خيار (.N أو N.) فهذا فصل حقيقي
  const leftFirst = [...left].sort((a, b) => b.x - a.x)[0];
  if (leftFirst && /^\.[1-4]$|^[1-4][.،)]$/.test(leftFirst.text)) return [right, left];
  return [ws];
}

/** كشف تخطيط عمودين (خياران جنباً لجنب) أم عمود واحد */
function detectColumns(
  rows: ParserWord[][],
  pageW: number,
): { twoColumn: boolean; gutterX: number } {
  const GAP_MIN = pageW * 0.12;
  const CENTER_LO = pageW * 0.2;
  const CENTER_HI = pageW * 0.8;
  const gutterMids: number[] = [];
  let contentRows = 0;

  for (const ws of rows) {
    if (ws.length < 2) continue;
    contentRows++;
    const sorted = [...ws].sort((a, b) => a.x - b.x);
    let maxGap = 0;
    let gapMid = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      const end = sorted[i].x + (sorted[i].width || 0);
      const gap = sorted[i + 1].x - end;
      if (gap > maxGap) {
        maxGap = gap;
        gapMid = (end + sorted[i + 1].x) / 2;
      }
    }
    if (maxGap >= GAP_MIN && gapMid >= CENTER_LO && gapMid <= CENTER_HI) {
      gutterMids.push(gapMid);
    }
  }

  const splitRows = gutterMids.length;
  const twoColumn = splitRows >= Math.max(3, contentRows * 0.2);
  let gutterX = pageW * 0.50;
  if (twoColumn && gutterMids.length) {
    const s = [...gutterMids].sort((a, b) => a - b);
    const median = s[Math.floor(s.length / 2)];
    gutterX = Math.min(Math.max(median, pageW * 0.35), pageW * 0.55);
  }
  return { twoColumn, gutterX };
}

/** بناء أسطر منطقية من الكلمات (مع مراعاة عمود/عمودين) */
function buildSegments(words: ParserWord[], opts: ParseOptions): RowSeg[] {
  const skipRe = opts.skipRe ?? DEFAULT_SKIP_RE;
  const pageW =
    opts.pageWidth ??
    (words.length ? Math.max(...words.map((w) => w.x + (w.width || 0))) : 600);

  const byTop = new Map<number, ParserWord[]>();
  for (const w of words) {
    const key = Math.round(w.top / 3) * 3;
    if (!byTop.has(key)) byTop.set(key, []);
    byTop.get(key)!.push(w);
  }

  const sortedKeys = Array.from(byTop.keys()).sort((a, b) => a - b);
  const rows = sortedKeys.map((k) => byTop.get(k)!);

  const { twoColumn, gutterX } = detectColumns(rows, pageW);
  opts.log?.('[v0] parser: pageW', Math.round(pageW), 'twoColumn', twoColumn, 'gutterX', Math.round(gutterX));

  const segs: RowSeg[] = [];
  for (let i = 0; i < sortedKeys.length; i++) {
    const top = sortedKeys[i];
    const ws = rows[i];

    // في وضع العمودين نقسّم السطر فقط إن وُجدت فجوة فعلية عند المنتصف،
    // كي لا تُقص سطور الأسئلة/التعليمات الممتدة بعرض الصفحة في منتصفها.
    const groups: ParserWord[][] = twoColumn
      ? splitRowAtGutter(ws, gutterX, pageW)
      : [ws];

    for (const g of groups) {
      if (!g.length) continue;
      // ترتيب RTL: من اليمين (x كبير) إلى اليسار (x صغير)
      const ordered = [...g].sort((a, b) => b.x - a.x);
      const text = stripBidi(joinReadingOrder(ordered));
      if (!text || skipRe.test(text)) continue;
      const highlighted = g.some((w) => w.highlighted);
      segs.push({ top, text, highlighted });
    }
  }
  return segs;
}

/**
 * الدالة الأساسية: تحويل الكلمات إلى أسئلة.
 * تدعم: السؤال "N - نص"، الخيار المدمج ".1 نص"، والخيار المنفصل (".1" وحده ثم نصه لاحقاً) ← الإصلاح.
 */
export function parseQuestionsFromWords(
  words: ParserWord[],
  opts: ParseOptions = {},
): ParsedQuestion[] {
  const segments = buildSegments(words, opts);
  const questions: ParsedQuestion[] = [];

  let curQ: string | null = null;
  const optsText: Record<number, string> = {};
  const optHighlight: Record<number, boolean> = {};
  let lastType: 'Q' | ['OPT', number] | null = null;

  const reset = () => {
    curQ = null;
    Object.keys(optsText).forEach((k) => delete optsText[+k]);
    Object.keys(optHighlight).forEach((k) => delete optHighlight[+k]);
    lastType = null;
  };

  const saveQ = () => {
    if (curQ && Object.keys(optsText).length >= 2) {
      const L: Record<number, 'A' | 'B' | 'C' | 'D'> = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
      let correctNum = 1;
      for (const n of [1, 2, 3, 4]) {
        if (optHighlight[n]) {
          correctNum = n;
          break;
        }
      }
      questions.push({
        id: Math.random().toString(36).substr(2, 9),
        question_text: stripBidi(curQ),
        option_a: cleanOpt(optsText[1] || ''),
        option_b: cleanOpt(optsText[2] || ''),
        option_c: cleanOpt(optsText[3] || ''),
        option_d: cleanOpt(optsText[4] || ''),
        correct_option: L[correctNum] || 'A',
        hint: '',
        explanation: '',
        count: Object.keys(optsText).length,
      });
    }
    reset();
  };

  for (const seg of segments) {
    const text = seg.text;

    const qm = text.match(/^(\d{1,2})\s*[-–]\s+(.*)/);
    const om = !qm && (
      text.match(/^\.([1-4])\s+(.+)/)           ||  // .1 نص
      text.match(/^([1-4])[.،)]\s+(.+)/)         ||  // 1. أو 1) نص
      text.match(/^([1-4])\s{2,}(.+)/)           ||  // 1   نص (مسافتان+)
      text.match(/^([1-4])\s+(?![-–])(.{3,})/)       // 1 نص (مسافة واحدة، ليست شرطة سؤال)
    );
    // علامة خيار منفصلة: ".1" أو "1." أو "1)" أو "1" وحدها ← الإصلاح الأساسي
    const sm = !qm && !om ? text.match(/^\.?([1-4])\s*[.)،]?\s*$/) : null;

    if (qm) {
      saveQ();
      curQ = (qm[2] || '').trim();
      lastType = 'Q';
    } else if (om && curQ !== null) {
      const n = parseInt(om[1], 10);
      optsText[n] = (om[2] || '').trim();
      if (seg.highlighted) optHighlight[n] = true;
      lastType = ['OPT', n];
    } else if (sm && curQ !== null) {
      const n = parseInt(sm[1], 10);
      if (!(n in optsText)) optsText[n] = '';
      if (seg.highlighted) optHighlight[n] = true;
      lastType = ['OPT', n];
    } else if (curQ !== null) {
      // فحص إضافي: هل هذا CONT يبدأ فعلياً بنمط خيار لم يُكتشف؟
      const hiddenOm = (
        text.match(/^\.([1-4])\s+(.+)/)         ||
        text.match(/^([1-4])[.،)]\s+(.+)/)       ||
        text.match(/^([1-4])\s{2,}(.+)/)         ||
        text.match(/^([1-4])\s+(?![-–])(.{3,})/)
      );
      if (hiddenOm) {
        const n = parseInt(hiddenOm[1], 10);
        optsText[n] = (hiddenOm[2] || '').trim();
        if (seg.highlighted) optHighlight[n] = true;
        lastType = ['OPT', n];
      } else if (lastType === 'Q') {
        // أضف للسؤال فقط إذا لم يبدأ بنمط رقمي (يحمي من اندماج نصوص الخيارات)
        const looksLikeOption = /^\d[.)،\s]/.test(text) || /^\.\d/.test(text);
        if (!looksLikeOption) {
          curQ += ' ' + text;
        }
      } else if (Array.isArray(lastType) && lastType[0] === 'OPT') {
        const n = lastType[1];
        optsText[n] = (optsText[n] ? optsText[n] + ' ' : '') + text;
        if (seg.highlighted) optHighlight[n] = true;
      }
    }
  }
  saveQ();

  opts.log?.('[v0] parser: extracted', questions.length, 'questions');
  return questions;
}
