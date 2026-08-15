/**
 * announcementsService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Class-wide or global announcements posted by a teacher.
 *
 * CURRENT MODE  : In-memory.
 * FUTURE MODE   : Backend fans out push notifications to enrolled students.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Future API contract:
 *   POST /announcements          { teacherId, class, title, content } → Announcement
 *   GET  /announcements          (as student) → Announcement[]  // scoped to student's class+teacher
 *   DELETE /announcements/:id    → 204
 */

export type CreateAnnouncementPayload = {
  teacherId: string;
  class: string;
  title: string;
  content: string;
};

// Implementation is currently in AuthContext: addAnnouncement, removeAnnouncement, announcements state
