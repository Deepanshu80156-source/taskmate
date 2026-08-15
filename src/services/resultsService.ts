/**
 * resultsService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Exam results publishing and retrieval.
 * Students only receive their own results — never classmates'.
 *
 * CURRENT MODE  : In-memory.
 * FUTURE MODE   : Backend enforces per-student isolation before returning data.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Future API contract:
 *   POST /results            { teacherId, studentId, class, subject, examName, obtainedMarks, totalMarks } → ExamResult
 *   GET  /results            (as student, authenticated) → ExamResult[]  // own results only
 *   DELETE /results/:id      → 204
 */

export type CreateResultPayload = {
  teacherId: string;
  studentId: string;
  class: string;
  subject: string;
  examName: string;
  obtainedMarks: number;
  totalMarks: number;
};

// Implementation is currently in AuthContext: addResult, getResultsForStudent
