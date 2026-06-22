/**
 * LegalRulingsIndex.tsx — تصميم احترافي عالمي
 * المنطق محفوظ 100%
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChevronRight, ChevronLeft, Send, Scale } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useJudicialIndexTopics, JUDICIAL_INDEX_CIRCUITS } from '@/hooks/useLegalLibrary';

const TELEGRAM_USERNAME = 'MuenAlnaser';
function buildTelegramLink(text: string) {
  return `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(text)}`;
}

export default function LegalRulingsIndex() {
  const navigate = useNavigate();
  const { data: topics = [], isLoading } = useJudicialIndexTopics();
  const [circuit, setCircuit] = useState<string>(JUDICIAL_INDEX_CIRCUITS[0]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const circuitTopics = useMemo(
    () => topics.filter((t) => t.circuit === circuit),
    [topics, circuit],
  );

  return (
    <MainLayout>

      {/* Hero Header */}
      <div
        className="sticky top-0 z-30 pt-5 pb-5 px-5"
        style={{ background: 'linear-gradient(160deg, #0f1923 0%, #162032 60%, #1a2a40 100%)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/8 border border-white/10 text-white flex-shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">Rulings Index</p>
            <h1 className="text-[17px] font-black text-white leading-tight">فهارس الأحكام</h1>
          </div>
          <Scale className="w-5 h-5 text-[#c8a84b] opacity-70" strokeWidth={1.5} />
        </div>

        {/* اختيار الدائرة */}
        <Select value={circuit} onValueChange={setCircuit}>
          <SelectTrigger
            className="h-11 rounded-xl font-bold text-[13px] justify-between [&>span]:text-right [&>span]:flex-1"
            style={{ background: 'rgba(255,255,255,0.95)', border: 'none', color: '#111827' }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {JUDICIAL_INDEX_CIRCUITS.map((c) => (
              <SelectItem key={c} value={c} className="text-right justify-end font-semibold">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* قائمة المواضيع */}
      <div className="bg-[#f4f6f9] min-h-[calc(100vh-140px)] pb-24">

        {/* عداد المواضيع */}
        <div className="px-5 pt-4 pb-2 flex items-center gap-3">
          <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">المواضيع</span>
          <div className="h-px flex-1 bg-gray-200" />
          {!isLoading && (
            <span className="text-[11px] text-gray-400 font-medium">{circuitTopics.length} موضوع</span>
          )}
        </div>

        {isLoading ? (
          <div className="px-4 space-y-2.5 pt-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded-2xl bg-white animate-pulse" style={{ opacity: 1 - i * 0.08 }} />
            ))}
          </div>
        ) : (
          <div className="px-4 space-y-2">
            {circuitTopics.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTopic(t.topic)}
                className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 text-right active:scale-[0.99] transition-transform"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.04)' }}
              >
                <div
                  className="w-1.5 h-8 rounded-full flex-shrink-0"
                  style={{ background: '#c8a84b' }}
                />
                <span className="flex-1 text-[13px] font-semibold text-gray-800 leading-snug">{t.topic}</span>
                <ChevronLeft className="w-4 h-4 text-gray-300 flex-shrink-0" strokeWidth={2.5} />
              </button>
            ))}
            {circuitTopics.length === 0 && (
              <div className="text-center py-16 text-gray-400 text-sm">لا توجد مواضيع لهذه الدائرة</div>
            )}
          </div>
        )}
      </div>

      {/* Drawer — طلب الحكم */}
      <Drawer open={!!selectedTopic} onOpenChange={(open) => !open && setSelectedTopic(null)}>
        <DrawerContent>
          <div className="px-5 pt-2 pb-8">
            {/* شريط جر */}
            <div className="flex justify-center mb-5">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* موضوع الحكم */}
            {selectedTopic && (
              <div
                className="rounded-2xl px-4 py-3 mb-5 text-right"
                style={{ background: 'rgba(200,168,75,0.08)', border: '1px solid rgba(200,168,75,0.2)' }}
              >
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">الموضوع المختار</p>
                <p className="text-[14px] font-black text-gray-900">{selectedTopic}</p>
              </div>
            )}

            <p className="text-[13px] text-gray-500 leading-relaxed text-right mb-5">
              إذا أردت الحصول على أحكام عليا حول هذا الموضوع، تواصل معنا وسنوافيك بها في أقرب وقت.
            </p>

            <button
              onClick={() => {
                if (!selectedTopic) return;
                window.open(
                  buildTelegramLink(`مرحباً، أود الحصول على أحكام عليا بخصوص موضوع: ${selectedTopic}`),
                  '_blank', 'noopener,noreferrer'
                );
                setSelectedTopic(null);
              }}
              className="w-full flex items-center gap-3 rounded-2xl px-5 active:scale-[0.98] transition-transform"
              style={{
                height: 54,
                background: 'linear-gradient(135deg, #0f1923 0%, #1a2a40 100%)',
                boxShadow: '0 4px 20px rgba(15,25,35,0.3)',
              }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(200,168,75,0.18)' }}>
                <Send className="w-4 h-4 text-[#c8a84b]" />
              </div>
              <span className="flex-1 text-right text-[14px] font-black text-white">إرسال الطلب عبر التليجرام</span>
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </MainLayout>
  );
}
