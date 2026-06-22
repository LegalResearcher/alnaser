/**
 * legalLibraryKeys.ts
 * مفاتيح localStorage الخاصة بمكتبة القوانين (الترحيب + التجربة المجانية)
 * ومدة التجربة بالأيام — مُركَّزة في ملف واحد يستورده كل من
 * LegalWelcomeOnboarding.tsx و useLegalLibrary.ts، لمنع تكرار/تعارض
 * القيم بينهما (وتفادي أي حلقة استيراد دائرية بين الملفين).
 *
 * v3 (2026-06-22): رفع نسخة مفتاحي الترحيب وبداية التجربة معاً
 * (v2/v1 → v3) بطلب من معين، بحيث:
 *  - تُعرض الشاشات الثلاث من جديد لكل المستخدمين الحاليين مرة واحدة.
 *  - تبدأ تجربة مجانية جديدة (3 أيام) لكل من كان في تجربة نشطة أو منتهية،
 *    ويُسجَّل الجميع في جدول legal_trial_starts الجديد لحساب الإحصائية.
 */
export const LEGAL_ONBOARDING_KEY = 'legal_library_onboarding_seen_v3';
export const LEGAL_TRIAL_START_KEY = 'legal_library_trial_start_v3';
export const TRIAL_DAYS = 3;
