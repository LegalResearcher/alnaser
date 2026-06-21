/**
 * LegalJudicialRulesList.tsx
 * قائمة قواعد دائرة معيّنة — بطاقات قابلة للتوسيع (الموجز) + نص القاعدة الكامل
 *
 * ⚠️ إصلاح أمني: القائمة الآن تُجلب بدون عمود content (راجع useJudicialRulesByCircuit
 * في useLegalLibrary.ts). نص القاعدة الكامل يُجلب فقط عند توسعة البطاقة، وفقط إن لم
 * تكن القاعدة مدفوعة (is_premium) أو كان المستخدم متحقَّقاً منه فعلاً — بنفس آلية
 * is_premium المطبَّقة على عارض القوانين (LegalDocumentViewer.tsx). قبل هذا الإصلاح
 * كانت كل القواعد تُجلب بنصها الكامل دفعة واحدة بصرف النظر عن is_premium.
 * ملاحظة: بحث الصفحة الحالي أصبح على الموجز/الأرقام فقط (لا نص القاعدة) لأن النص
 * لم يعد متوفراً على العميل قبل التوسعة — البحث داخل نص كل القواعد متوفر عبر
 * "البحث الشامل" (LegalGlobalSearch.tsx) الذي يستخدم RPC على الخادم.
 */
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChevronRight, ChevronDown, ChevronUp, Search, Copy, Check, Heart, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useJudicialRulesByCircuit, useJudicialRuleContent, useLegalFavorites, useIsPremiumUnlocked,
  JudicialRuleMeta,
} from '@/hooks/useLegalLibrary';
import {
  LibraryPasswordModal, LibrarySubscriptionModal,
} from '@/components/shared/LibrarySubscriptionModals';

function RuleCard({
  rule, isPremiumUnlocked, onRequestUnlock,
}: {
  rule: JudicialRuleMeta;
  isPremiumUnlocked: boolean;
  onRequestUnlock: (rule: JudicialRuleMeta) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [copied, setCopied] = useState(false);
  const { isFavorite, toggleFavorite } = useLegalFavorites();
  const ruleRef = String(rule.id);
  const fav = isFavorite('rule', ruleRef);

  const isLocked = rule.is_premium && !isPremiumUnlocked;
  const { data: content, isLoading: contentLoading } = useJudicialRuleContent(rule.id, expanded && !isLocked);

  const handleToggle = () => {
    if (isLocked) {
      onRequestUnlock(rule);
      return;
    }
    setExpanded(e => !e);
  };

  const copy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-border overflow-hidden">
      <button onClick={handleToggle} className="w-full text-right p-4">
        <div className="flex items-start gap-2">
          {isLocked ? (
            <Lock className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
          ) : expanded ? (
            <ChevronUp className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
          ) : (
            <ChevronDown className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
          )}
          <p className={cn('text-sm font-semibold flex-1', !expanded && 'line-clamp-2')}>
            <span className="text-red-600 font-black">الموجز: </span>
            {rule.subject}
          </p>
        </div>
        <div className="flex items-center justify-between mt-3 bg-muted/50 rounded-xl px-3 py-2 text-[11px]">
          <div className="text-center">
            <p className="font-black text-foreground">{rule.rule_number}</p>
            <p className="text-muted-foreground">القاعدة</p>
          </div>
          <div className="text-center">
            <p className="font-black text-foreground">{rule.case_number || '—'}</p>
            <p className="text-muted-foreground">الطعن</p>
          </div>
          <div className="text-center">
            <p className="font-black text-foreground">{rule.issue_number || '—'}</p>
            <p className="text-muted-foreground">العدد</p>
          </div>
          <div className="text-center">
            <p className="font-black text-foreground">{rule.page || '—'}</p>
            <p className="text-muted-foreground">الصفحة</p>
          </div>
        </div>
      </button>

      {expanded && !isLocked && (
        <div className="px-4 pb-4 border-t border-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-red-600">نص القاعدة القضائية:</span>
            <div className="flex items-center gap-3">
              <button onClick={copy} disabled={!content}>
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground/50" />}
              </button>
              <button onClick={() => toggleFavorite('rule', ruleRef)}>
                <Heart className={cn('w-4 h-4', fav ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground/50')} />
              </button>
            </div>
          </div>
          {contentLoading || !content ? (
            <div className="space-y-2">
              <div className="h-3 rounded bg-muted animate-pulse w-full" />
              <div className="h-3 rounded bg-muted animate-pulse w-5/6" />
              <div className="h-3 rounded bg-muted animate-pulse w-2/3" />
            </div>
          ) : (
            <>
              <p className="text-sm leading-loose whitespace-pre-line">
                {showFull || content.length <= 500 ? content : content.slice(0, 500) + '…'}
              </p>
              {content.length > 500 && (
                <button onClick={() => setShowFull(s => !s)} className="text-xs font-black text-emerald-600 mt-2">
                  {showFull ? 'عرض أقل' : 'عرض المزيد'}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function LegalJudicialRulesList() {
  const { circuit } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const decodedCircuit = circuit ? decodeURIComponent(circuit) : null;

  const { data: rules = [], isLoading } = useJudicialRulesByCircuit(decodedCircuit);
  const { isPremiumUnlocked, setIsPremiumUnlocked } = useIsPremiumUnlocked();

  const [pendingRule, setPendingRule] = useState<JudicialRuleMeta | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const requestUnlock = (rule: JudicialRuleMeta) => {
    setPendingRule(rule);
    setShowPasswordModal(true);
  };

  // بحث على الموجز/الأرقام المتوفرة على العميل فقط (لا نص القاعدة الكامل — راجع الملاحظة أعلى الملف)
  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return rules;
    return rules.filter(r =>
      r.subject.includes(q) || r.case_number?.includes(q) || r.rule_number.includes(q) || r.issue_number?.includes(q)
    );
  }, [rules, search]);

  return (
    <MainLayout>
      <div className="bg-[#c8e6c9] sticky top-0 z-30">
        <div className="container max-w-3xl flex items-center gap-3 py-4">
          <button onClick={() => navigate(-1)} className="text-[#1a2744] p-1 -m-1">
            <ChevronRight className="w-5 h-5" />
          </button>
          <h1 className="text-base font-black text-[#1a2744]">القواعد القضائية {decodedCircuit}</h1>
        </div>
        <div className="container max-w-3xl pb-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالموجز أو رقم الطعن..."
              className="w-full h-10 pr-9 pl-4 rounded-xl bg-white text-sm text-right outline-none"
            />
          </div>
        </div>
      </div>

      <div className="container max-w-3xl py-4 pb-16 space-y-2.5">
        {isLoading && (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-16">لا توجد نتائج</p>
        )}
        {!isLoading && filtered.map((rule) => (
          <RuleCard
            key={rule.id}
            rule={rule}
            isPremiumUnlocked={isPremiumUnlocked}
            onRequestUnlock={requestUnlock}
          />
        ))}
      </div>

      {showPasswordModal && (
        <LibraryPasswordModal
          onSuccess={() => { setIsPremiumUnlocked(true); setShowPasswordModal(false); setPendingRule(null); }}
          onSubscribe={() => { setShowPasswordModal(false); setShowSubscriptionModal(true); }}
          onClose={() => { setShowPasswordModal(false); setPendingRule(null); }}
        />
      )}
      {showSubscriptionModal && pendingRule && (
        <LibrarySubscriptionModal
          fileName={pendingRule.subject}
          onClose={() => { setShowSubscriptionModal(false); setPendingRule(null); }}
        />
      )}
    </MainLayout>
  );
}
