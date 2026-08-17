# TaskMate — Service Layer

This directory contains the **service layer** — the boundary between the UI and the data source.

---

## Purpose

The service layer separates the frontend from the backend so the application can switch from local storage to a real server without changing the UI.

The design goals are:

- The frontend never accesses the database directly.
- All business logic passes through the backend.
- Authentication and authorization are handled by the server.
- The UI remains unchanged when the backend is upgraded.

---

## Current vs Future

| File | Current | Future |
|------|---------|--------|
| api.ts | Base HTTP client | Connect to your backend |
| authService.ts | Local AuthContext | Login API + JWT |
| studentService.ts | Local data | Student API |
| notesService.ts | Local data | Notes API |
| resultsService.ts | Local data | Results API |
| announcementsService.ts | Local data | Announcement API |
| messageService.ts | Local data | Chat / Messaging API |
| libraryService.ts | Local data | Library API |

---

## Backend Migration

When the backend is ready:

1. Configure `VITE_API_URL` inside your `.env` file.
2. Implement JWT authentication in `api.ts`.
3. Replace the temporary local methods with HTTP API calls.
4. No changes should be required in the UI because all communication happens through the service layer.

---

## Security

- Users should only access their own data.
- Authentication should use secure JWT tokens.
- File uploads should use authenticated endpoints.
- All write operations should be verified by the backend.