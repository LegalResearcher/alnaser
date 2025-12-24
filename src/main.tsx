import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeCache } from "./hooks/useCachedQuery";

/**
 * تهيئة نظام التخزين المؤقت (Cache System)
 * يقوم بفحص إصدار المنصة وتنظيف الذاكرة القديمة لضمان وصول 
 * أحدث التحديثات القانونية والميزات للطلاب والباحثين فوراً.
 */
try {
  initializeCache();
  
  // لمسة احترافية في سجلات المتصفح لسهولة التتبع والصيانة
  if (import.meta.env.DEV) {
    console.log(
      "%c🚀 Alnaser Legal Platform %c\nالنظام مفعل وجاهز للعمل بأفضل أداء.",
      "color: #3b82f6; font-size: 20px; font-weight: bold;",
      "color: #64748b; font-size: 14px;"
    );
  }
} catch (error) {
  console.error("⚠️ Cache Initialization Failed:", error);
}

/**
 * ربط التطبيق بواجهة المستخدم (DOM Mounting)
 * يتم استخدام StrictMode في بيئة التطوير للمساعدة في اكتشاف 
 * المشاكل البرمجية مبكراً وضمان جودة الكود.
 */
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("فشل العثور على عنصر الجذر (Root Element). تأكد من وجود <div id='root'> في ملف HTML.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
