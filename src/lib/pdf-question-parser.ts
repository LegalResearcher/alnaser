/**
 * Alnasser Tech Digital Solutions
 * Shared core: PDF question parsing (RTL Arabic, single OR two-column layouts)
 */

export interface ParserWord {
  text: string;
  x: number;
  top: number;        // الأعلى→الأسفل: كلما زاد كان أقرب لأسفل الصفحة
  width?: number;
  h?: number;         // ارتفاع الحرف/الكلمة (حجم الخط) — لتحديد عتبة الفجوة بين الكلمات
  highlighted?: boolean;
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
 * دمج كلمات السطر الواحد بترتيب RTL مع مراعاة الفجوات:
 * - إذا كانت الفجوة بين عنصرين أصغر من العتبة → لصقهما بلا مسافة (حروف كلمة واحدة).
 * - إذا كانت الفجوة أكبر أو تساوي العتبة → مسافة (حدّ كلمة).
 * العتبة = max(0.8 وحدة, refSize * 0.28) حيث refSize = متوسط h أو عرض العناصر.
 */
function joinReadingOrder(ordered: ParserWord[]): string {
  if (ordered.length === 0) return '';
  if (ordered.length === 1) return ordered[0].text;

  // حساب حجم مرجعي من h أو width أو ثابت افتراضي
  const sizes = ordered.map(w => w.h || w.width || 0).filter(v => v > 0);
  const refSize = sizes.length ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 10;
  const threshold = Math.max(0.8, refSize * 0.28);

  // الترتيب: من أكبر x (يمين) إلى أصغر x (يسار) — مرتّب مسبقاً
  let result = ordered[0].text;
  for (let i = 1; i < ordered.length; i++) {
    const prev = ordered[i - 1];
    const curr = ordered[i];
    // الحافة اليسرى للعنصر السابق = x - width (لأن x هو بداية العنصر من اليسار في PDF)
    const prevLeft = prev.x;
    const currRight = curr.x + (curr.width || 0);
    const gap = prevLeft - currRight;   // فجوة أفقية بين نهاية العنصر الحالي وبداية السابق (RTL)
    result += (gap >= threshold ? ' ' : '') + curr.text;
  }
  return result;
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
  let gutterX = pageW * 0.45;
  if (twoColumn && gutterMids.length) {
    const s = [...gutterMids].sort((a, b) => a - b);
    gutterX = s[Math.floor(s.length / 2)];
  }
  return { twoColumn, gutterX };
}

/** بناء أسطر منطقية من الكلمات (مع مراعاة عمود/عمودين) */
function buildSegments(words: ParserWord[], opts: ParseOptions): RowSeg[] {
  const skipRe = opts.skipRe ?? DEFAULT_SKIP_RE;
  const pageW =
    opts.pageWidth ?? (words.length ? Math.max(...words.map((w) => w.x)) : 600);

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

    const groups: ParserWord[][] = twoColumn
      ? [ws.filter((w) => w.x > gutterX), ws.filter((w) => w.x <= gutterX)]
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
    const om =
      text.match(/^\.([1-4])\s+(.+)/) ||
      text.match(/^([1-4])[.،)]\s+(.+)/) ||
      text.match(/^([1-4])\s{2,}(.+)/);
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
      if (lastType === 'Q') {
        curQ += ' ' + text;
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
