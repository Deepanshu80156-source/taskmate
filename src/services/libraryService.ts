/**
 * libraryService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Teacher's personal library — reusable note references saved once and
 * reused across multiple classes without re-uploading.
 *
 * CURRENT MODE  : In-memory.
 * FUTURE MODE   : Backend stores library entries linked to the teacher account.
 *                 File storage key is reused across multiple note assignments.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Future API contract:
 *   GET    /library              (as teacher) → LibraryNote[]
 *   POST   /library              { subject, chapter, filename, description? } → LibraryNote
 *   DELETE /library/:id          → 204
 */

export type CreateLibraryNotePayload = {
  teacherId: string;
  subject: string;
  chapter: string;
  filename: string;
  description?: string;
};

// Implementation is currently in AuthContext: addToLibrary, removeFromLibrary, getLibraryForTeacher
