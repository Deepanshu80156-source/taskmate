/**
 * messageService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * One-to-one messaging between a teacher and a student.
 * Students NEVER communicate directly with each other or with the teacher's
 * device — all messages pass through the backend.
 *
 * CURRENT MODE  : In-memory conversations object.
 * FUTURE MODE   : WebSocket or long-polling through the backend.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Future API contract:
 *   GET  /messages/:studentId        → Message[]   (teacher or student, scoped)
 *   POST /messages/:studentId        { content }   → Message
 *   WS   /ws/messages                              (optional real-time channel)
 */

export type SendMessagePayload = {
  fromId: string;
  toId: string;
  content: string;
};

// Implementation is currently in AuthContext: sendMessage, conversations state
