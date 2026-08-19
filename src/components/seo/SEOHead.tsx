import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://alnaseer.org';
const SITE_NAME = 'منصة الناصر — الباحث القانوني';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const TELEGRAM_BOT_SOCIAL_IMAGE = `${BASE_URL}/images/alnaser-bot-social-logo.png`;

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAlt?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
  keywords?: string;
  schema?: object;
}

export function SEOHead({
  title,
  description,
  image = DEFAULT_IMAGE,
  imageWidth = 1200,
  imageHeight = 630,
  imageAlt,
  type = 'website',
  noIndex = false,
  keywords,
  schema,
}: SEOHeadProps) {
  const { pathname } = useLocation();
  const canonicalUrl = `${BASE_URL}${pathname}`;
  const fullTitle = title.includes('الناصر') ? title : `${title} | ${SITE_NAME}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:secure_url" content={image} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content={String(imageWidth)} />
      <meta property="og:image:height" content={String(imageHeight)} />
      <meta property="og:image:alt" content={imageAlt || title} />
      <meta property="og:locale" content="ar_YE" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@AlnasserTech" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={imageAlt || title} />
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}

export const HomeSEO = () => (
  <SEOHead
    title="منصة الناصر القانونية | +25,000 سؤال لطلاب الشريعة والقانون والمحامين"
    description="منصة الناصر القانونية هي منصة رقمية مستقلة، تم تأسيسها وتطويرها برؤية وإشراف أ. معين الناصر. تضم المنصة أكثر من ٢٥٬٠٢٨+ سؤال مؤتمت ومكتبة قانونية متكاملة، جرى تصميمها خصيصاً لخدمة وتدريب طلاب الشريعة والقانون، ودعم المحامين والباحثين في تطوير ملكتهم المعرفية والقضائية."
    keywords="باحث قانوني، اختبارات قانونية، قانون يمني، امتحانات قانون، منصة الناصر، كلية الشريعة والقانون"
    schema={{
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'منصة الناصر القانونية',
      alternateName: 'Alnasser Legal Researcher',
      url: 'https://alnaseer.org/',
      logo: 'https://alnaseer.org/icon-512.png',
      description: 'المنصة الأولى لتدريب وتأهيل الباحثين القانونيين في اليمن',
      foundingLocation: { '@type': 'Place', name: 'صنعاء، الجمهورية اليمنية' },
      sameAs: ['https://twitter.com/AlnasserTech', 'https://www.facebook.com/AlnasserTech'],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'info@alnaseer.org',
        contactType: 'customer support',
        availableLanguage: 'Arabic',
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'أكثر من 25,000 سؤال قانوني مؤتمت — لطلاب الشريعة والقانون والمحامين والباحثين',
      },
    }}
  />
);

export const LevelsSEO = () => (
  <SEOHead
    title="المستويات الدراسية | منصة الناصر"
    description="اختر مستواك الدراسي وابدأ رحلتك القانونية — 4 مستويات دراسية تغطي كافة فروع الشريعة والقانون."
    keywords="مستويات قانون، دراسة قانون يمن، اختبارات قانونية مستوى أول ثاني ثالث رابع"
    schema={{
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'المستويات الدراسية — منصة الناصر',
      description: '4 مستويات دراسية للباحثين القانونيين',
      numberOfItems: 4,
    }}
  />
);

export const LevelSubjectsSEO = ({
  levelName,
  levelNumber,
  subjectsCount,
}: {
  levelName: string;
  levelNumber: number;
  subjectsCount: number;
}) => (
  <SEOHead
    title={`${levelName} | منصة الناصر`}
    description={`مواد المستوى ${levelNumber} — ${subjectsCount} مادة قانونية متخصصة. اختر المادة وابدأ الاختبار الآن.`}
    keywords={`${levelName}، مواد قانونية، اختبارات قانون اليمن`}
    schema={{
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: levelName,
      provider: { '@type': 'Organization', name: 'منصة الناصر', url: 'https://alnaseer.org' },
      educationalLevel: `المستوى ${levelNumber}`,
    }}
  />
);

export const ExamStartSEO = ({
  subjectName,
  questionsCount,
}: {
  subjectName: string;
  questionsCount?: number;
}) => (
  <SEOHead
    title={`اختبار ${subjectName} | منصة الناصر`}
    description={`اختبر معرفتك في مادة ${subjectName}${questionsCount ? ` — ${questionsCount} سؤال` : ''}. اختبارات قانونية احترافية على منصة الناصر.`}
    keywords={`اختبار ${subjectName}، أسئلة ${subjectName}، قانون يمني`}
    schema={{
      '@context': 'https://schema.org',
      '@type': 'Quiz',
      name: `اختبار ${subjectName}`,
      educationalUse: 'assessment',
      inLanguage: 'ar',
      provider: { '@type': 'Organization', name: 'منصة الناصر' },
    }}
  />
);

export const PrivacySEO = () => (
  <SEOHead
    title="سياسة الخصوصية | منصة الناصر"
    description="سياسة الخصوصية وحماية البيانات لمنصة الناصر القانونية."
  />
);

export const AboutSEO = () => (
  <SEOHead
    title="عن منصة الناصر القانونية"
    description="تعرف على منصة الناصر القانونية: منصة رقمية عربية لتدريب طلاب الشريعة والقانون والباحثين والمحامين عبر اختبارات تفاعلية ومكتبة قانونية منظمة."
    keywords="عن منصة الناصر، منصة قانونية يمنية، تدريب قانوني، اختبارات الشريعة والقانون"
    schema={{
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'عن منصة الناصر القانونية',
      url: 'https://alnaseer.org/about',
      inLanguage: 'ar',
      mainEntity: { '@type': 'Organization', name: 'منصة الناصر القانونية', url: 'https://alnaseer.org' },
    }}
  />
);

export const FeaturesSEO = () => (
  <SEOHead
    title="مزايا منصة الناصر القانونية"
    description="استكشف مزايا منصة الناصر القانونية: اختبارات تفاعلية، بنك أسئلة قانوني، مكتبة رقمية، تتبع للتقدم، وغرف منافسة جماعية."
    keywords="مزايا منصة الناصر، بنك أسئلة قانوني، اختبارات تفاعلية، مكتبة قانونية يمنية"
    schema={{
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'مزايا منصة الناصر القانونية',
      url: 'https://alnaseer.org/features',
      inLanguage: 'ar',
      isPartOf: { '@type': 'WebSite', name: 'منصة الناصر القانونية', url: 'https://alnaseer.org' },
    }}
  />
);

export const TelegramBotSEO = () => (
  <SEOHead
    title="بوت الناصر القانوني على تيليغرام | مكتبة واختبارات قانونية عربية"
    description="بوت الناصر القانوني على تيليغرام يسهّل تصفح المصادر القانونية والبحث فيها وخوض اختبارات الشريعة والقانون والثانوية العامة من محادثة عربية منظمة."
    keywords="بوت قانوني تيليغرام، بوت الناصر القانوني، اختبارات قانونية تيليغرام، مكتبة قانونية يمنية، اختبارات الثانوية العامة"
    image={TELEGRAM_BOT_SOCIAL_IMAGE}
    imageWidth={1408}
    imageHeight={768}
    imageAlt="شعار بوت الناصر القانوني — المرجع الرقمي الشامل للتشريعات والاختبارات"
    schema={{
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          name: 'بوت الناصر القانوني على تيليغرام',
          description: 'صفحة تعريفية لبوت الناصر القانوني لخدمات المصادر القانونية والاختبارات التفاعلية.',
          url: 'https://alnaseer.org/bot',
          inLanguage: 'ar',
          isPartOf: { '@type': 'WebSite', name: 'منصة الناصر القانونية', url: 'https://alnaseer.org' },
        },
        {
          '@type': 'SoftwareApplication',
          name: 'بوت الناصر القانوني',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Telegram',
          url: 'https://t.me/Moieen2025Bot',
          inLanguage: 'ar',
          description: 'بوت تيليغرام عربي لتصفح المصادر القانونية والبحث فيها وخوض الاختبارات التفاعلية.',
          provider: { '@type': 'Organization', name: 'منصة الناصر القانونية', url: 'https://alnaseer.org' },
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
      ],
    }}
  />
);

export const AdminSEO = ({ pageName }: { pageName: string }) => (
  <SEOHead
    title={`${pageName} — لوحة التحكم`}
    description="لوحة تحكم إدارية — منصة الناصر"
    noIndex={true}
  />
);

export const LibraryHomeSEO = () => (
  <SEOHead
    title="المكتبة القانونية الرقمية | منصة الناصر القانونية"
    description="المكتبة القانونية اليمنية الرقمية الشاملة للتشريعات، تعليمات النيابة، وأكثر من 1997 قاعدة قضائية للمحكمة العليا، بتأسيس وإشراف أ. معين الناصر. تصفح وحمّل الصيغ واللوائح بسهولة."
    keywords="مكتبة قانونية يمنية، قوانين يمن، قواعد قضائية، تعليمات النيابة، تشريعات، لوائح، منصة الناصر"
    schema={{
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'المكتبة القانونية الرقمية — منصة الناصر',
      description: 'مكتبة قانونية يمنية رقمية شاملة للتشريعات والقواعد القضائية',
      url: 'https://alnaseer.org/library',
      inLanguage: 'ar',
      provider: { '@type': 'Organization', name: 'منصة الناصر', url: 'https://alnaseer.org' },
    }}
  />
);

export const LibraryJudicialSEO = () => (
  <SEOHead
    title="القواعد القضائية للمحكمة العليا | المكتبة القانونية | منصة الناصر"
    description="أكثر من 1997 قاعدة قضائية ومبدأ صادر عن المحكمة العليا اليمنية — مصنّفة ومفهرسة بدوائر قضائية متخصصة على منصة الناصر."
    keywords="قواعد قضائية، مبادئ المحكمة العليا، اجتهادات قضائية، قانون يمني، منصة الناصر"
    schema={{
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'القواعد القضائية للمحكمة العليا اليمنية',
      description: 'أكثر من 1997 قاعدة قضائية ومبدأ — المحكمة العليا اليمنية',
      url: 'https://alnaseer.org/library/judicial',
      inLanguage: 'ar',
      provider: { '@type': 'Organization', name: 'منصة الناصر', url: 'https://alnaseer.org' },
    }}
  />
);

export const LibraryLegislationSEO = () => (
  <SEOHead
    title="القوانين اليمنية | المكتبة القانونية | منصة الناصر"
    description="القوانين والتشريعات اليمنية بآخر التعديلات الرسمية — مكتبة قانونية رقمية شاملة على منصة الناصر."
    keywords="قوانين يمنية، تشريعات يمن، قانون مدني، قانون تجاري، قانون جزائي، منصة الناصر"
  />
);

export const LibraryProsecutionSEO = () => (
  <SEOHead
    title="تعليمات النيابة العامة | المكتبة القانونية | منصة الناصر"
    description="تعليمات النيابة العامة والملفات والتعليمات الجزائية الرسمية — منصة الناصر القانونية اليمنية."
    keywords="تعليمات النيابة، النيابة العامة، تعليمات جزائية، قانون يمني، منصة الناصر"
  />
);

export const LibraryRegulationsSEO = () => (
  <SEOHead
    title="اللوائح والأنظمة | المكتبة القانونية | منصة الناصر"
    description="اللوائح التنفيذية والأنظمة الإدارية اليمنية — منصة الناصر القانونية."
    keywords="لوائح تنفيذية، أنظمة إدارية، قانون يمني، منصة الناصر"
  />
);

export const LibraryTemplatesSEO = () => (
  <SEOHead
    title="صيغ وعقود قانونية | المكتبة القانونية | منصة الناصر"
    description="أكثر من ٧٠ نموذج جاهز لصيغ العقود والإقرارات والتوكيلات اليمنية — مكتبة قانونية رقمية على منصة الناصر."
    keywords="صيغ عقود، نماذج عقود يمنية، عقد بيع، عقد إيجار، توكيل، إقرار بدين، منصة الناصر"
  />
);

export const LibrarySearchSEO = () => (
  <SEOHead
    title="البحث القانوني الشامل | المكتبة القانونية | منصة الناصر"
    description="ابحث في جميع أقسام المكتبة القانونية الرقمية — القوانين، القواعد القضائية، تعليمات النيابة، واللوائح اليمنية في مكان واحد."
    keywords="بحث قانوني، بحث في القوانين، بحث قواعد قضائية، منصة الناصر"
  />
);

export const LibrarySubscriptionSEO = () => (
  <SEOHead
    title="الاشتراك في المكتبة القانونية | منصة الناصر"
    description="اشترك في المكتبة القانونية الرقمية للوصول الكامل لجميع الوثائق والتشريعات والقواعد القضائية — منصة الناصر."
    keywords="اشتراك مكتبة قانونية، عضوية منصة الناصر، وصول قانوني"
    schema={{
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'اشتراك المكتبة القانونية — منصة الناصر',
      description: 'وصول كامل لجميع وثائق المكتبة القانونية الرقمية',
      url: 'https://alnaseer.org/library/subscription',
      provider: { '@type': 'Organization', name: 'منصة الناصر', url: 'https://alnaseer.org' },
    }}
  />
);

export const LibraryOtherServicesSEO = () => (
  <SEOHead
    title="الخدمات الأخرى | المكتبة القانونية | منصة الناصر"
    description="خدمات إضافية في المكتبة القانونية — فهرس المحكمة العليا والمراجع القانونية على منصة الناصر."
    keywords="فهرس المحكمة العليا، مراجع قانونية، خدمات قانونية، منصة الناصر"
  />
);
