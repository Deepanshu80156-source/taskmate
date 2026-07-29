/**
 * studentService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CRUD operations for students, scoped to the authenticated teacher.
 *
 * CURRENT MODE  : AuthContext (in-memory).
 * FUTURE MODE   : Replace each stub with `apiRequest(...)` calls.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Future API contract:
 *   GET    /teachers/:teacherId/students          → Student[]
 *   POST   /teachers/:teacherId/students          { name, class, rollNumber, guardianName, guardianPhone } → Student
 *   PUT    /students/:studentId                   { ...fields } → Student
 *   DELETE /students/:studentId                   → 204
 */

export type CreateStudentPayload = {
  teacherId: string;
  name: string;
  class: string;
  rollNumber: string;
  guardianName: string;
  guardianPhone: string;
  username: string;
  password: string;
};

export type UpdateStudentPayload = Partial<Omit<CreateStudentPayload, 'teacherId' | 'username' | 'password'>>;

// Implementation is currently in AuthContext:
//   addStudent, updateStudent, removeStudent, getStudentsForTeacher
