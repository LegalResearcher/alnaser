import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, Plus, Sparkles } from 'lucide-react';

const faqs = [
  {
    question: 'ما هي منصة الباحث القانوني؟',
    answer: 'منصة تعليمية إلكترونية متخصصة في تقديم اختبارات تفاعلية للباحثين القانونيين، تضم أكثر من 10000 سؤال في مختلف المجالات القانونية موزعة على 4 مستويات و43 مادة.',
  },
  {
    question: 'كيف أبدأ الاختبار؟',
    answer: 'يمكنك البدء بسهولة من خلال اختيار المستوى المناسب، ثم اختيار المادة التي تريد اختبارها، وإدخال اسمك لبدء الاختبار. ستحصل على نتيجتك فور انتهاء الاختبار.',
  },
  {
    question: 'هل الاختبارات مجانية؟',
    answer: 'نعم، جميع الاختبارات متاحة مجاناً لجميع المستخدمين. نهدف إلى توفير أفضل المصادر التعليمية للباحثين القانونيين.',
  },
  {
    question: 'كيف يتم تحديد درجة النجاح؟',
    answer: 'تختلف درجة النجاح حسب كل مادة، وعادة ما تكون 60% من إجمالي الأسئلة. يمكنك معرفة درجة النجاح المطلوبة قبل بدء كل اختبار.',
  },
  {
    question: 'هل يمكنني مراجعة إجاباتي بعد الاختبار؟',
    answer: 'نعم، بعد انتهاء الاختبار يمكنك مراجعة جميع إجاباتك مع عرض الإجابات الصحيحة والملاحظات الإرشادية لكل سؤال.',
  },
  {
    question: 'ما هي نماذج سنوات الاختبار؟',
    answer: 'نوفر نماذج اختبارات من سنوات مختلفة (2020-2026) لكل مادة، مما يتيح لك التدرب على أسئلة متنوعة وفهم أنماط الأسئلة المختلفة.',
  },
];

export function FAQSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-slate-50/50" id="faq">
      {/* لمسات فنية للخلفية لتعزيز المظهر العالمي */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        
        {/* Section Header - تصميم احترافي مركز */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-primary text-xs font-black uppercase tracking-widest animate-fade-in">
            <HelpCircle className="w-4 h-4" />
            مركز المساعدة
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            لديك <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">تساؤلات؟</span>
          </h2>
          <p className="text-slate-500 text-lg md:text-xl leading-relaxed">
            لقد جمعنا لك أكثر الأسئلة شيوعاً لمساعدتك في فهم كيفية تحقيق أقصى استفادة من منصة الباحث القانوني.
          </p>
        </div>

        {/* FAQ Accordion - تصميم بطاقات متطورة */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="group border-none bg-white rounded-[2rem] px-2 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                <AccordionTrigger className="text-right hover:no-underline py-6 px-6 group-data-[state=open]:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4 w-full">
                    {/* أيقونة جانبية تعطي طابعاً بصرياً قوياً */}
                    <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0 group-data-[state=open]:bg-primary group-data-[state=open]:text-white transition-all">
                      <Plus className="w-4 h-4 group-data-[state=open]:rotate-45 transition-transform duration-300" />
                    </div>
                    <span className="font-bold text-slate-700 text-lg md:text-xl group-data-[state=open]:text-primary transition-colors tracking-tight">
                      {faq.question}
                    </span>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-12 pb-8 text-slate-500 text-lg leading-relaxed border-t border-slate-50 bg-slate-50/30 animate-in slide-in-from-top-2 duration-300">
                  <div className="pt-4 relative">
                    {/* خط ديكوري جانبي يظهر عند الفتح */}
                    <div className="absolute right-[-24px] top-4 bottom-0 w-1 bg-gradient-to-b from-primary/40 to-transparent rounded-full" />
                    {faq.answer}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* ذيل القسم - دعوة للتواصل في حال عدم وجود إجابة */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-slate-500 font-medium">لم تجد إجابتك؟</span>
            <a href="#contact" className="text-primary font-black hover:underline flex items-center gap-1">
              تواصل مع الدعم الفني
              <Sparkles className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
