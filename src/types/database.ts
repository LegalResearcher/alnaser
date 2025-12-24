export type AppRole = 'admin' | 'editor';
export type DeletionStatus = 'active' | 'pending_deletion' | 'deleted';

export interface Level {
  id: string;
  name: string;
  description: string | null;
  color: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  level_id: string;
  name: string;
  description: string | null;
  order_index: number;
  default_time_minutes: number;
  allow_time_modification: boolean;
  min_time_minutes: number | null;
  max_time_minutes: number | null;
  questions_per_exam: number;
  passing_score: number;
  password: string | null;
  author_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  subject_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  hint: string | null;
  exam_year: number | null;
  status: DeletionStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamResult {
  id: string;
  subject_id: string;
  student_name: string;
  score: number;
  total_questions: number;
  passing_score: number;
  passed: boolean;
  exam_year: number | null;
  time_taken_seconds: number | null;
  answers: Record<string, string> | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface DeletionRequest {
  id: string;
  question_id: string;
  requested_by: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface SiteAnalytics {
  id: string;
  page_path: string;
  visitor_id: string | null;
  created_at: string;
}

export const EXAM_YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026] as const;
export type ExamYear = typeof EXAM_YEARS[number];
