/**
 * authService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles login, logout, registration, and password management.
 *
 * CURRENT MODE  : Thin wrapper — delegates to AuthContext (mock/in-memory).
 * FUTURE MODE   : Call `apiRequest` from ./api.ts, store the returned JWT with
 *                 `setToken()`, and return a typed response. The UI never needs
 *                 to change; only this file and the context provider do.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Future API contract (reference for backend implementation):
 *   POST /auth/login          { username, password, role } → { token, user }
 *   POST /auth/register       { name, username, password } → { token, user }
 *   POST /auth/change-password { oldPassword, newPassword } → { success }
 *   POST /auth/reset-student  { studentId, newPassword }   → { success }
 *   POST /auth/logout         (header: Authorization: Bearer <token>) → 200
 */

export type LoginPayload = { username: string; password: string; role: 'teacher' | 'student' };
export type RegisterPayload = { name: string; username: string; password: string };
export type ChangePasswordPayload = { userId: string; oldPassword: string; newPassword: string };
export type ResetStudentPasswordPayload = { studentId: string; newPassword: string };

// NOTE: The actual logic currently lives in AuthContext.
// When a real backend exists:
//   1. Import `apiRequest` and `setToken` from './api'
//   2. Replace each function body with the corresponding apiRequest call
//   3. Remove the AuthContext method for that operation (or keep it as a local cache layer)
