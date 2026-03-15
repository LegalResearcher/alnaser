import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Send, Lightbulb, CheckCircle2 } from 'lucide-react';

type QuestionType = 'four' | 'three' | 'two' | 'truefalse';

interface SuggestedQuestion {
  question_text: string;
  question_type: QuestionType;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  hint: string;
}

const emptyQuestion = (): SuggestedQuestion => ({
  question_text: '', question_type: 'four',
  option_a: '', option_b: '', option_c: '', option_d: '',
  correct_option: 'A', hint: '',
});

const getOptions = (type: QuestionType) => {
  if (type === 'truefalse') return [{ key: 'A', label: 'أ', ph: 'صح' }, { key: 'B', label: 'ب', ph: 'خطأ' }];
  if (type === 'two') return [{ key: 'A', label: 'أ', ph: '' }, { key: 'B', label: 'ب', ph: '' }];
  if (type === 'three') return [{ key: 'A', label: 'أ', ph: '' }, { key: 'B', label: 'ب', ph: '' }, { key: 'C', label: 'ج', ph: '' }];
  return [{ key: 'A', label: 'أ', ph: '' }, { key: 'B', label: 'ب', ph: '' }, { key: 'C', label: 'ج', ph: '' }, { key: 'D', label: 'د', ph: '' }];
};

export default function SuggestQuestion() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [suggesterName, setSuggesterName] = useState('');
  const [suggesterLevel, setSuggesterLevel] = useState('');
  const [suggesterBatch, setSuggesterBatch] = useState('');
  const [suggesterContact, setSuggesterContact] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState(searchParams.get('level') || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState(searchParams.get('subject') || '');
  const [questions, setQuestions] = useState<SuggestedQuestion[]>([emptyQuestion()]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const { data: levels = [] } = useQuery({
    queryKey: ['levels-suggest'],
    queryFn: async () => {
      const { data } = await supabase.from('levels').select('id,name').order('order_index');
      return data || [];
    },
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects-suggest', selectedLevelId],
    queryFn: async () => {
      if (!selectedLevelId) return [];
      const { data } = await supabase.from('subjects').select('id,name').eq('level_id', selectedLevelId).order('order_index');
      return data || [];
    },
    enabled: !!selectedLevelId,
  });

  const upd = (idx: number, field: keyof SuggestedQuestion, val: string) =>
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: val } : q));

  const handleSubmit = async () => {
    if (!selectedLevelId || !selectedSubjectId) {
      toast({ title: 'يرجى اختيار المستوى والمادة', variant: 'destructive' });
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        toast({ title: `يرجى كتابة نص السؤال ${i + 1}`, variant: 'destructive' });
        return;
      }
      const opts = getOptions(q.question_type);
      for (const opt of opts) {
        const val = q[`option_${opt.key.toLowerCase()}` as keyof SuggestedQuestion] as string;
        if (q.question_type !== 'truefalse' && !val.trim()) {
          toast({ title: `يرجى تعبئة الخيار ${opt.label} في السؤال ${i + 1}`, variant: 'destructive' });
          return;
        }
      }
    }
    setSubmitting(true);
    const rows = questions.map(q => ({
      level_id: selectedLevelId,
      subject_id: selectedSubjectId,
      question_text: q.question_text.trim(),
      question_type: q.question_type,
      option_a: q.question_type === 'truefalse' ? 'صح' : q.option_a.trim(),
      option_b: q.question_type === 'truefalse' ? 'خطأ' : q.option_b.trim(),
      option_c: q.option_c.trim() || null,
      option_d: q.option_d.trim() || null,
      correct_option: q.correct_option,
      hint: q.hint.trim() || null,
      suggester_name: suggesterName.trim() || null,
      suggester_level: suggesterLevel || null,
      suggester_batch: suggesterBatch.trim() || null,
      suggester_contact: suggesterContact.trim() || null,
    }));
    const { error } = await (supabase.from('question_suggestions' as any).insert(rows) as any);
    setSubmitting(false);
    if (error) {
      toast({ title: 'حدث خطأ، حاول مجدداً', variant: 'destructive' });
      return;
    }
    setDone(true);
  };

  if (done) return (
    <MainLayout>
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black">شكراً على مساهمتك! 🎉</h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            سيتم مراجعة أسئلتك من قِبل الإدارة ونشرها عند الموافقة.
          </p>
          <button
            onClick={() => { setDone(false); setQuestions([emptyQuestion()]); }}
            className="mt-4 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-sm"
          >
            إضافة أسئلة جديدة
          </button>
        </div>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 pb-32" dir="rtl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Lightbulb className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-black">أضف سؤالاً</h1>
          <p className="text-sm font-bold text-muted-foreground">ساهم في إثراء المنصة</p>
          <p className="text-xs text-muted-foreground">أسئلتك ستُراجع من الإدارة وتُنشر عند الموافقة</p>
        </div>

        {/* Suggester Info */}
        <div className="bg-card rounded-2xl border p-4 space-y-3">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">بياناتك (اختياري)</p>
          <input value={suggesterName} onChange={e => setSuggesterName(e.target.value)} placeholder="الاسم الكامل"
            className="w-full rounded-xl border border-border bg-muted p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <div className="grid grid-cols-2 gap-2">
            <select value={suggesterLevel} onChange={e => setSuggesterLevel(e.target.value)}
              className="rounded-xl border border-border bg-muted p-2.5 text-sm text-muted-foreground">
              <option value="">المستوى</option>
              {['الأول', 'الثاني', 'الثالث', 'الرابع'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <input value={suggesterBatch} onChange={e => setSuggesterBatch(e.target.value)} placeholder="رقم الدفعة (مثال: 50)"
              className="rounded-xl border border-border bg-muted p-2.5 text-sm" />
          </div>
          <input value={suggesterContact} onChange={e => setSuggesterContact(e.target.value)} placeholder="رقم الجوال أو الإيميل (اختياري)"
            className="w-full rounded-xl border border-border bg-muted p-2.5 text-sm" />
        </div>

        {/* Level & Subject */}
        <div className="bg-card rounded-2xl border p-4 space-y-3">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">المستوى والمادة *</p>
          <select value={selectedLevelId} onChange={e => { setSelectedLevelId(e.target.value); setSelectedSubjectId(''); }}
            className="w-full rounded-xl border border-border bg-muted p-2.5 text-sm">
            <option value="">اختر المستوى</option>
            {levels.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          {selectedLevelId && (
            <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted p-2.5 text-sm">
              <option value="">اختر المادة</option>
              {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>

        {/* Questions */}
        {questions.map((q, idx) => {
          const opts = getOptions(q.question_type);
          return (
            <div key={idx} className="bg-card rounded-2xl border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black">السؤال {idx + 1}</p>
                {questions.length > 1 && (
                  <button onClick={() => setQuestions(p => p.filter((_, i) => i !== idx))}
                    className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Question Type */}
              <div className="grid grid-cols-4 gap-1.5">
                {([['four', '4 خيارات'], ['three', '3 خيارات'], ['two', 'خياران'], ['truefalse', 'صح/خطأ']] as const).map(([val, lbl]) => (
                  <button key={val} onClick={() => { upd(idx, 'question_type', val); upd(idx, 'correct_option', 'A'); }}
                    className={cn('py-2 rounded-xl text-[11px] font-black border transition-all',
                      q.question_type === val ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/50')}>
                    {lbl}
                  </button>
                ))}
              </div>

              {/* Question Text */}
              <div className="space-y-1.5">
                <p className="text-xs font-black text-muted-foreground">نص السؤال *</p>
                <textarea value={q.question_text} onChange={e => upd(idx, 'question_text', e.target.value)}
                  placeholder="اكتب السؤال هنا..." rows={3}
                  className="w-full rounded-xl border border-border bg-muted p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <p className="text-xs font-black text-muted-foreground">الخيارات — اضغط الحرف لتحديد الإجابة الصحيحة ✅</p>
                {opts.map(opt => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <button onClick={() => upd(idx, 'correct_option', opt.key)}
                      className={cn('w-8 h-8 rounded-full text-xs font-black shrink-0 border-2 transition-all',
                        q.correct_option === opt.key ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/30 text-muted-foreground hover:border-emerald-400')}>
                      {opt.label}
                    </button>
                    <input
                      value={q[`option_${opt.key.toLowerCase()}` as keyof SuggestedQuestion] as string}
                      onChange={e => upd(idx, `option_${opt.key.toLowerCase()}` as keyof SuggestedQuestion, e.target.value)}
                      placeholder={q.question_type === 'truefalse' ? opt.ph : `الخيار ${opt.label}`}
                      readOnly={q.question_type === 'truefalse'}
                      className={cn('flex-1 rounded-xl border p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all',
                        q.correct_option === opt.key ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 font-bold' : 'border-border bg-muted',
                        q.question_type === 'truefalse' && 'opacity-60 cursor-default')}
                    />
                  </div>
                ))}
              </div>

              {/* Hint */}
              <div className="space-y-1.5">
                <p className="text-xs font-black text-amber-600 flex items-center gap-1.5">
                  💡 ملاحظة / تلميح <span className="text-muted-foreground font-normal">(اختياري — تظهر عند الإجابة الخاطئة)</span>
                </p>
                <textarea value={q.hint} onChange={e => upd(idx, 'hint', e.target.value)}
                  placeholder="أضف شرحاً أو مرجعاً للإجابة الصحيحة..." rows={2}
                  className="w-full rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/10 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/30" />
              </div>
            </div>
          );
        })}

        {/* Add Question */}
        <button onClick={() => setQuestions(p => [...p, emptyQuestion()])}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-border text-muted-foreground font-black text-sm flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-all">
          <Plus className="w-4 h-4" /> إضافة سؤال آخر
        </button>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={submitting}
          className="w-full h-14 rounded-2xl bg-gradient-to-l from-primary to-blue-600 text-primary-foreground font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-60">
          {submitting
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Send className="w-5 h-5" /> إرسال {questions.length > 1 ? `${questions.length} أسئلة` : 'السؤال'}</>}
        </button>
      </div>
    </MainLayout>
  );
}
