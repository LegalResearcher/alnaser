/**
 * LegalRulingsIndex.tsx — "فهارس الأحكام"
 * /library/other-services/supreme-court/index
 *
 * يعرض قائمة منسدلة لاختيار الدائرة، ثم قائمة مواضيع تلك الدائرة.
 * عند الضغط على موضوع تُفتح نافذة سفلية (Drawer) لتوجيه المستخدم
 * للتواصل عبر التليجرام بطلب أحكام عليا بخصوص ذلك الموضوع تحديداً.
 * لا تُعرض نصوص الأحكام نفسها هنا — الخدمة توجيهية بالكامل.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChevronRight, Send } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import {
  useJudicialIndexTopics,
  JUDICIAL_INDEX_CIRCUITS,
} from '@/hooks/useLegalLibrary';

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
      <div className="bg-[#1a2744] sticky top-0 z-30">
        <div className="container max-w-5xl flex items-center gap-3 py-4">
          <button onClick={() => navigate(-1)} className="text-white p-1 -m-1">
            <ChevronRight className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-white tracking-wide">فهارس الأحكام</h1>
        </div>
      </div>

      <div className="container max-w-5xl pt-4 pb-2">
        <Select value={circuit} onValueChange={setCircuit}>
          <SelectTrigger className="h-12 rounded-xl border-border bg-card text-foreground font-bold justify-between [&>span]:text-right [&>span]:flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {JUDICIAL_INDEX_CIRCUITS.map((c) => (
              <SelectItem key={c} value={c} className="text-right justify-end font-semibold">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="container max-w-5xl pb-24">
        {isLoading ? (
          <div className="flex flex-col gap-3 pt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {circuitTopics.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTopic(t.topic)}
                className="flex items-center justify-between py-4 border-b border-border text-right hover:bg-muted/40 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-[#b8923f] rotate-180" />
                <span className="text-[15px] text-foreground flex-1 text-right">{t.topic}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Drawer open={!!selectedTopic} onOpenChange={(open) => !open && setSelectedTopic(null)}>
        <DrawerContent>
          <div className="px-6 pt-2 pb-8 flex flex-col items-center text-center gap-5">
            <p className="text-base font-bold text-foreground leading-7">
              إذا أردت الحصول على أحكام عليا حول هذا الموضوع، يرجى التواصل بنا
            </p>
            <button
              type="button"
              onClick={() => {
                if (!selectedTopic) return;
                const link = buildTelegramLink(
                  `مرحباً، أود الحصول على أحكام عليا بخصوص موضوع: ${selectedTopic}`,
                );
                window.open(link, '_blank', 'noopener,noreferrer');
                setSelectedTopic(null);
              }}
              className="flex flex-col items-center gap-2"
            >
              <span className="w-12 h-12 rounded-full bg-[#b8923f]/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-[#b8923f]" />
              </span>
              <span className="text-sm font-bold text-[#b8923f]">إرسال طلب</span>
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </MainLayout>
  );
}
