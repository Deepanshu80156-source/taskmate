/**
 * notesService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Upload and retrieval of class notes.
 * Files are stored in secure cloud storage; only signed URLs are returned.
 *
 * CURRENT MODE  : In-memory text metadata (no actual file storage).
 * FUTURE MODE   :
 *   1. Upload the file to an object-storage bucket via a pre-signed URL
 *      obtained from POST /notes/upload-url.
 *   2. Confirm the upload by calling POST /notes with the returned storage key.
 *   3. GET  /notes?studentId=X returns only notes the backend authorises.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Future API contract:
 *   POST /notes/upload-url  { filename, contentType } → { uploadUrl, storageKey }
 *   POST /notes             { teacherId, class, subject, chapter, storageKey } → Note
 *   GET  /notes             (as student, authenticated)  → Note[]
 *   DELETE /notes/:noteId   → 204
 */

export type CreateNotePayload = {
  teacherId: string;
  class: string;
  subject: string;
  chapter: string;
  filename: string;
  description?: string;
};

// Implementation is currently in AuthContext: addNote, getNotesForStudent
