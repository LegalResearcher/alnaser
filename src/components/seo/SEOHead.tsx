import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://alnaseer.org';
const SITE_NAME = 'منصة الناصر — الباحث القانوني';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
  keywords?: string;
  schema?: object;
}

export function SEOHead({
  title,
  description,
  image = DEFAULT_IMAGE,
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
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:locale" content="ar_YE" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@AlnasserTech" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
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
    title="منصة الناصر | الباحث القانوني المتخصص"
    description="المنصة الأولى لتدريب وتأهيل الباحثين القانونيين في اليمن — بنك أسئلة يضم أكثر من 5000 سؤال في 43 مادة قانونية موزعة على 4 مستويات دراسية."
    keywords="باحث قانوني، اختبارات قانونية، قانون يمني، امتحانات قانون، منصة الناصر، كلية الشريعة والقانون"
    schema={{
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'منصة الناصر — الباحث القانوني',
      alternateName: 'Alnasser Legal Researcher',
      url: 'https://alnaser.vercel.app/',
      logo: 'https://alnaser.vercel.app/icon-512.png',
      description: 'المنصة الأولى لتدريب وتأهيل الباحثين القانونيين في اليمن',
      foundingLocation: { '@type': 'Place', name: 'صنعاء، الجمهورية اليمنية' },
      sameAs: ['https://twitter.com/AlnasserTech', 'https://www.facebook.com/AlnasserTech'],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'info@alnasser-tech.com',
        contactType: 'customer support',
        availableLanguage: 'Arabic',
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'اختبارات قانونية مجانية — أكثر من 5000 سؤال',
      },
    }}
  />
);

export const LevelsSEO = () => (
  <SEOHead
    title="المستويات الدراسية | منصة الناصر"
    description="اختر مستواك الدراسي وابدأ رحلتك القانونية — 4 مستويات من المبتدئ إلى الاحترافي، تغطي 43 مادة قانونية متخصصة."
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
      provider: { '@type': 'Organization', name: 'منصة الناصر', url: 'https://alnaser.vercel.app' },
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
    description="سياسة الخصوصية وحماية البيانات لمنصة الناصر — الباحث القانوني."
  />
);

export const AdminSEO = ({ pageName }: { pageName: string }) => (
  <SEOHead
    title={`${pageName} — لوحة التحكم`}
    description="لوحة تحكم إدارية — منصة الناصر"
    noIndex={true}
  />
);
