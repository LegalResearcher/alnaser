import { Link } from "react-router-dom";
import { Home, Scale, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { MainLayout } from "@/components/layout/MainLayout";

const NotFound = () => {
  return (
    <MainLayout>
      <SEOHead
        title="الصفحة غير موجودة | منصة الناصر"
        description="الصفحة التي تبحث عنها غير موجودة — منصة الناصر للباحث القانوني"
        noIndex={true}
      />

      <div className="flex min-h-[70vh] items-center justify-center p-6 relative overflow-hidden">
        {/* خلفية فنية */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-xl w-full text-center relative z-10">
          {/* أيقونة */}
          <div className="relative w-32 h-32 mx-auto mb-10">
            <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] rotate-12 animate-pulse" />
            <div className="relative w-32 h-32 bg-card rounded-[2.5rem] shadow-xl border border-border flex items-center justify-center">
              <Scale className="w-16 h-16 text-primary" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-destructive rounded-xl flex items-center justify-center border-4 border-background shadow-lg">
                <AlertCircle className="w-4 h-4 text-destructive-foreground" />
              </div>
            </div>
          </div>

          {/* محتوى */}
          <div className="space-y-4 mb-12">
            <h1 className="text-8xl font-black text-foreground tracking-tighter opacity-10 select-none">404</h1>
            <div className="relative -mt-16">
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4 tracking-tight">
                الصفحة غير موجودة — <span className="text-primary">404</span>
              </h2>
              <p className="text-muted-foreground text-lg font-medium max-w-sm mx-auto leading-relaxed">
                يبدو أن الصفحة التي تبحث عنها قد تم نقلها أو أنها لم تعد موجودة.
              </p>
            </div>
          </div>

          <Link to="/">
            <Button size="lg" className="h-14 rounded-2xl px-8 font-black text-lg shadow-xl gap-3">
              <Home className="w-5 h-5" />
              العودة للرئيسية
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotFound;
