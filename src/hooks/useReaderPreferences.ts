/**
 * useReaderPreferences.ts
 * تفضيلات قراءة نصوص القانون: حجم الخط + الوضع الليلي الخاص بصفحة القراءة فقط
 * مستقل تماماً عن Dark Mode العام للمنصة (مفتاح localStorage مختلف).
 */
import { useEffect, useState } from 'react';

const FONT_SIZE_KEY = 'legal_reader_font_size_v1';
const NIGHT_MODE_KEY = 'legal_reader_night_mode_v1';

const MIN_FONT = 14;
const MAX_FONT = 26;
const DEFAULT_FONT = 18;

export function useReaderPreferences() {
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    const parsed = saved ? parseInt(saved, 10) : DEFAULT_FONT;
    return Number.isFinite(parsed) ? Math.min(MAX_FONT, Math.max(MIN_FONT, parsed)) : DEFAULT_FONT;
  });

  const [nightMode, setNightMode] = useState<boolean>(() => {
    return localStorage.getItem(NIGHT_MODE_KEY) === '1';
  });

  useEffect(() => {
    localStorage.setItem(FONT_SIZE_KEY, String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem(NIGHT_MODE_KEY, nightMode ? '1' : '0');
  }, [nightMode]);

  const increaseFont = () => setFontSize(f => Math.min(MAX_FONT, f + 2));
  const decreaseFont = () => setFontSize(f => Math.max(MIN_FONT, f - 2));
  const toggleNightMode = () => setNightMode(n => !n);

  return { fontSize, increaseFont, decreaseFont, nightMode, toggleNightMode, MIN_FONT, MAX_FONT };
}

/** يحفظ آخر موضع قراءة (رقم المادة الظاهر) لمستند معيّن، للعودة إليه لاحقاً */
export function saveReadingPosition(documentId: number, articleRef: string) {
  try {
    localStorage.setItem(`legal_reading_pos_${documentId}`, articleRef);
  } catch { /* ignore quota errors */ }
}

export function getReadingPosition(documentId: number): string | null {
  try {
    return localStorage.getItem(`legal_reading_pos_${documentId}`);
  } catch { return null; }
}
