import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, ArrowRight, Scale, AlertCircle, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // الحفاظ على منطق التتبع الخاص بك لمراقبة الروابط المكسورة
    console.error("🚀 404 Log [Alnaser Platform]:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50/50 p-6 relative overflow-hidden">
      
      {/* لمسات خلفية فنية */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-xl w-full text-center relative z-10">
        
        {/* أيقونة تعبيرية بتصميم "Layered" */}
        <div className="relative w-32 h-32 mx-auto mb-10">
          <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] rotate-12 animate-pulse" />
          <div className="relative w-32 h-32 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center justify-center">
            <Scale className="w-16 h-16 text-primary" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center border-4 border-white shadow-lg">
               <AlertCircle className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* محتوى الصفحة */}
        <div className="space-y-4 mb-12">
          <h1 className="text-8xl font-black text-slate-900 tracking-tighter opacity-10 select-none">404</h1>
          <div className="relative -mt-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 tracking-tight">
              عذراً، تاه المسار <span className="text-primary">القانوني!</span>
            </h2>
            <p className="text-slate-500 text-lg font-medium max-w-sm mx-auto leading-relaxed">
              يبدو أن الصفحة التي تبحث عنها قد تم نقلها أو أنها لم تعد موجودة في أرشيفنا.
            </p>
          </div>
        </div>

        {/* روابط المساعدة - توجيه المستخدم للاقسام الهامة */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
          <Link to="/" className="w-full">
            <Button size="lg" className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-primary text-white font-black shadow-xl shadow-slate-200 transition-all gap-3">
              <Home className="w-5 h-5" />
              الرئيسية
            </Button>
          </Link>
          <Link to="/levels" className="w-full">
            <Button size="lg" variant="outline" className="w-full h-16 rounded-2xl border-slate-200 font-bold hover:bg-slate-50 hover:text-primary gap-3">
              <GraduationCap className="w-5 h-5" />
              المستويات
            </Button>
          </Link>
        </div>

        {/* Footer بسيط */}
        <div className="mt-16 flex items-center justify-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
           <Search className="w-3.5 h-3.5" />
           <span>نظام البحث الذكي مفعل لإرشادك</span>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
