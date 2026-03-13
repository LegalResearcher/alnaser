import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search, Copy, List, Info, Play, BookOpen, ChevronLeft, AlertCircle, CheckCircle2, Hash, Calendar, FileText, Layers, Loader2, PlayCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Question, Subject, EXAM_YEARS } from '@/types/database';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SubjectSettingsModalProps {
  subject: Subject & { levelName?: string };
  onClose: () => void;
}

type Tab = 'search' | 'duplicates' | 'list' | 'exam';

const EXAM_FORMS = [
  { id: 'General', name: 'نموذج العام' },
  { id: 'Parallel', name: 'نموذج الموازي' },
  { id: 'Mixed', name: 'نموذج مختلط' },
  { id: 'Trial', name: 'أسئلة تجريبية' },
];

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((p, i) => p.toLowerCase() === query.toLowerCase() ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{p}</mark> : p);
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all', active ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-muted')}>
      {icon}{label}
    </button>
  );
}

const SubjectSettingsModal = ({ subject, onClose }: SubjectSettingsModalProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchByNumber, setSearchByNumber] = useState(false);
  const [examMode, setExamMode] = useState<'single' | 'all'>('single');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedForm, setSelectedForm] = useState('General');
  const [studentName, setStudentName] = useState('');
  const [examCount, setExamCount] = useState(0);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('questions').select('*').eq('subject_id', subject.id).eq('status', 'active').order('exam_year', { ascending: true });
      if (!error && data) setQuestions(data as Question[]);
      setLoading(false);
    };
    fetchQuestions();
  }, [subject.id]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    return questions.filter((question, index) => searchByNumber ? String(index + 1) === q || String(index + 1).startsWith(q) : question.question_text.toLowerCase().includes(q));
  }, [questions, searchQuery, searchByNumber]);

  const duplicates = useMemo(() => {
    const seen = new Map<string, Question[]>();
    questions.forEach(q => { const key = q.question_text.trim().toLowerCase(); if (!seen.has(key)) seen.set(key, []); seen.get(key)!.push(q); });
    return Array.from(seen.values()).filter(group => group.length > 1);
  }, [questions]);

  useEffect(() => {
    const count = async () => {
      if (examMode === 'all') { setExamCount(questions.length); return; }
      if (selectedForm === 'Trial') {
        const { count } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('subject_id', subject.id).eq('status', 'active').is('exam_year', null);
        setExamCount(count || 0);
        return;
      }
      if (!selectedYear) { setExamCount(0); return; }
      let q = supabase.from('questions').select('*', { count: 'exact', head: true }).eq('subject_id', subject.id).eq('status', 'active').eq('exam_year', parseInt(selectedYear));
      if (selectedForm && selectedForm !== 'Mixed') q = q.eq('exam_form', selectedForm);
      const { count } = await q;
      setExamCount(count || 0);
    };
    count();
  }, [examMode, selectedYear, selectedForm, questions, subject.id]);

  const handleStartExam = () => {
    if (!studentName.trim()) return;
    if (examMode === 'all') {
      navigate(`/exam/${subject.id}/start`, { state: { studentName, examYear: 0, examForm: 'Mixed', examTime: subject.default_time_minutes, questionsCount: questions.length, subjectName: subject.name, levelName: subject.levelName, allQuestions: true } });
    } else {
      if (selectedForm !== 'Trial' && !selectedYear) return;
      navigate(`/exam/${subject.id}/start`, { state: { studentName, examYear: selectedForm === 'Trial' ? 0 : parseInt(selectedYear), examForm: selectedForm, examTime: subject.default_time_minutes, questionsCount: examCount, subjectName: subject.name, levelName: subject.levelName, isTrial: selectedForm === 'Trial' } });
    }
    onClose();
  };

  const renderSearch = () => (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder={searchByNumber ? 'رقم السؤال...' : 'ابحث في الأسئلة...'} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9 h-12 rounded-xl font-bold bg-muted/50 border-border focus:border-primary" autoFocus />
        </div>
        <button onClick={() => setSearchByNumber(!searchByNumber)} className={cn('h-12 px-4 rounded-xl text-xs font-black border transition-all', searchByNumber ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary')}>
          {searchByNumber ? <Hash className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-[10px] font-bold text-muted-foreground">{searchByNumber ? 'البحث برقم السؤال' : 'البحث بالنص'}{searchQuery && ` · ${searchResults.length} نتيجة`}</p>
      <div className="max-h-[50vh] overflow-y-auto space-y-2">
        {loading ? <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
          : !searchQuery.trim() ? <p className="text-center text-sm text-muted-foreground py-8 font-bold">اكتب للبحث في {questions.length} سؤال</p>
          : searchResults.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">لا توجد نتائج</p>
          : searchResults.map(q => {
            const globalIdx = questions.indexOf(q) + 1;
            return (
              <div key={q.id} className="bg-muted/50 rounded-xl p-3 border border-border">
                <div className="flex items-start gap-2">
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black">{globalIdx}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground leading-relaxed">{highlight(q.question_text, searchByNumber ? '' : searchQuery)}</p>
                    {q.exam_year && <span className="text-[10px] text-muted-foreground font-black mt-1 inline-block">{q.exam_year}</span>}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  const renderDuplicates = () => (
    <div className="space-y-3">
      <p className={cn('text-xs font-black px-3 py-2 rounded-xl', duplicates.length > 0 ? 'bg-destructive/10 border border-destructive/20 text-destructive' : 'bg-emerald-50 border border-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-400')}>
        {duplicates.length > 0 ? <>تم اكتشاف {duplicates.length} مجموعة أسئلة مكررة</> : <>لا توجد أسئلة مكررة في هذه المادة</>}
      </p>
      <div className="max-h-[50vh] overflow-y-auto space-y-3">
        {loading ? <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
          : duplicates.map((group, gi) => (
            <div key={gi} className="bg-destructive/5 rounded-xl p-3 border border-destructive/10">
              <p className="text-[10px] font-black text-destructive mb-2">يتكرر {group.length} مرات</p>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">{group[0].question_text}</p>
                <div className="flex gap-1 flex-wrap">{group.map(q => <span key={q.id} className="text-[9px] bg-muted px-2 py-0.5 rounded-full font-black text-muted-foreground">{q.exam_year || '—'}</span>)}</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const renderList = () => (
    <div className="space-y-3">
      <p className="text-xs font-black text-muted-foreground">إجمالي الأسئلة: {questions.length}</p>
      <div className="max-h-[50vh] overflow-y-auto space-y-2">
        {loading ? <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
          : questions.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">لا توجد أسئلة بعد</p>
          : questions.map((q, idx) => (
            <div key={q.id} className="bg-muted/30 rounded-xl p-3 border border-border">
              <div className="flex items-start gap-2">
                <span className="shrink-0 w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground leading-relaxed line-clamp-2">{q.question_text}</p>
                  <div className="flex gap-2 mt-1">
                    {q.exam_year && <span className="text-[9px] bg-muted px-2 py-0.5 rounded-full font-black text-muted-foreground">{q.exam_year}</span>}
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-black text-emerald-700 dark:text-emerald-400">إجابة: {q.correct_option}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const renderExam = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {[{ mode: 'single' as const, icon: <PlayCircle className="w-5 h-5" />, label: 'اختبار فردي', sub: 'نموذج بعينه' }, { mode: 'all' as const, icon: <Layers className="w-5 h-5" />, label: 'اختبار الكل', sub: 'جميع الأسئلة' }].map(item => (
          <button key={item.mode} onClick={() => setExamMode(item.mode)} className={cn('rounded-2xl p-4 text-right border-2 transition-all', examMode === item.mode ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/40')}>
            {item.icon}<p className="font-black text-sm mt-1">{item.label}</p><p className="text-[10px]">{item.sub}</p>
          </button>
        ))}
      </div>
      <div>
        <label className="text-xs font-black text-muted-foreground mb-1 block">اسم المختبر</label>
        <Input placeholder="أدخل اسمك" value={studentName} onChange={e => setStudentName(e.target.value)} className="h-12 rounded-xl font-bold bg-muted/50 border-border focus:border-primary" />
      </div>
      {examMode === 'single' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-black text-muted-foreground mb-1 block">السنة</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-border"><SelectValue placeholder="اختر السنة" /></SelectTrigger>
              <SelectContent className="z-[10001] bg-popover">{EXAM_YEARS.map(y => <SelectItem key={y} value={y.toString()}>دورة {y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-black text-muted-foreground mb-1 block">النموذج</label>
            <Select value={selectedForm} onValueChange={setSelectedForm}>
              <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-border"><SelectValue /></SelectTrigger>
              <SelectContent className="z-[10001] bg-popover">{EXAM_FORMS.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-3 border border-border">
        <span className="text-xs font-black text-muted-foreground">الأسئلة المتوفرة</span>
        <span className="font-black text-lg text-foreground">{examCount}</span>
      </div>
      <Button onClick={handleStartExam} disabled={!studentName.trim() || (examMode === 'single' && selectedForm !== 'Trial' && !selectedYear) || examCount === 0} className="w-full h-13 rounded-2xl font-black">
        <Play className="w-5 h-5 ml-2" /> ابدأ الاختبار
      </Button>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-[5vh] bottom-[5vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[520px] md:max-h-[90vh] bg-card rounded-3xl border border-border shadow-2xl z-50 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div>
            <h2 className="font-black text-foreground text-lg">إعدادات المادة</h2>
            <p className="text-xs text-muted-foreground font-bold">{subject.name}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-all"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex gap-1 p-3 border-b border-border shrink-0 overflow-x-auto">
          <TabBtn active={activeTab === 'search'} onClick={() => setActiveTab('search')} icon={<Search className="w-3.5 h-3.5" />} label="بحث" />
          <TabBtn active={activeTab === 'duplicates'} onClick={() => setActiveTab('duplicates')} icon={<Copy className="w-3.5 h-3.5" />} label="مكرر" />
          <TabBtn active={activeTab === 'list'} onClick={() => setActiveTab('list')} icon={<List className="w-3.5 h-3.5" />} label="قائمة" />
          <TabBtn active={activeTab === 'exam'} onClick={() => setActiveTab('exam')} icon={<Play className="w-3.5 h-3.5" />} label="اختبار" />
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'search' && renderSearch()}
          {activeTab === 'duplicates' && renderDuplicates()}
          {activeTab === 'list' && renderList()}
          {activeTab === 'exam' && renderExam()}
        </div>
      </div>
    </>
  );
};

export default SubjectSettingsModal;
