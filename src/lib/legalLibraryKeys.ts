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
 *
 * v4 (2026-06-25): مدة التجربة أصبحت متحكَّماً بها من لوحة الإدارة
 *  - تُحفظ الإعدادات في platform_settings بمفتاح 'library_trial_settings'
 *  - القيمة: { trialDays: number, trialEnabled: boolean, libraryFree: boolean }
 *  - إذا lم تُضبط القيمة في قاعدة البيانات، يُستخدم الافتراضي: 3 أيام، مفعّل.
 */
export const LEGAL_ONBOARDING_KEY = 'legal_library_onboarding_seen_v3';
export const LEGAL_TRIAL_START_KEY = 'legal_library_trial_start_v3';

/**
 * القيمة الاحتياطية المستخدمة إذا لم تُضبط الإعدادات في قاعدة البيانات بعد.
 * الملفات الأخرى (useLegalLibrary.ts) تجلب القيمة الفعلية من platform_settings.
 */
export const TRIAL_DAYS_DEFAULT = 3;

/**
 * @deprecated استخدم useLibraryTrialSettings() بدلاً من هذا لقراءة القيمة الديناميكية.
 * هذا الثابت يبقى للتوافق مع الكود القديم فقط.
 */
export const TRIAL_DAYS = TRIAL_DAYS_DEFAULT;
