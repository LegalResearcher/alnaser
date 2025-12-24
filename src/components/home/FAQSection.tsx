import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'ما هي منصة الباحث القانوني؟',
    answer: 'منصة تعليمية إلكترونية متخصصة في تقديم اختبارات تفاعلية للباحثين القانونيين، تضم أكثر من 1000 سؤال في مختلف المجالات القانونية موزعة على 4 مستويات و43 مادة.',
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
    <section className="py-20 bg-muted/30" id="faq">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            الأسئلة <span className="text-gradient-primary">الشائعة</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            إجابات على الأسئلة الأكثر شيوعاً حول منصتنا
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-xl border px-6 data-[state=open]:shadow-lg transition-shadow"
              >
                <AccordionTrigger className="text-right hover:no-underline py-5">
                  <span className="font-semibold text-foreground">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
