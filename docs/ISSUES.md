# SINA People Server: Guided Issues 🚀

This is a reference list of issues for the SINA People Backend API. Use these to find a task that matches your skill level.

## 🟢 Beginner (Good First Issues)
1. **[DX] Add JSDoc to Controllers**: Add clear JSDoc comments to all functions in `src/controllers/auth.controller.js`.
2. **[Validation] Input Sanitization**: Ensure all string inputs in the registration flow are "trimmed" of whitespace.
3. **[Logs] Custom Message Levels**: Update the error logging in `src/middleware/errorMiddleware.js` to include the `organisationId` where available.
4. **[Docs] Update README**: Add a "Prerequisites" section to `server/README.md` (e.g., mention Node 18+ and MongoDB 6.0+).
5. **[Cleanup] Consistency**: Standardize the response objects in `src/controllers/user.controller.js` to sempre follow the `{ success, data, message }` pattern.

## 🟡 Intermediate (Backend Logic & Security)
6. **[Security] Rate Limiting**: Implement a 15-minute lockout after 5 failed login attempts for a single email address.
7. **[Feature] Email Reminders**: Build a service that sends an email to HR when a leave request has been pending for more than 48 hours.
8. **[API] organisation Settings**: Create endpoints to allow an Admin to update the organisation's name and default `OFFICE_START_TIME`.
9. **[Logic] team Boundary Validation**: Implement a check that prevents creating two teams with the exact same coordinates and radius.
10. **[Security] Password Complexity**: Update the registration validator to require at least one uppercase letter and one special character in the password.

## 🔴 Advanced (Architecture & Performance)
11. **[Performance] Redis Integration**: Set up a Redis layer to cache the results of the "All Teams" query, which is called frequently by the frontend.
12. **[Performance] Indexing Audit**: Perform an audit of the `Attendance` collection and create compound indexes for `{ organisationId: 1, userId: 1, date: -1 }`.
13. **[Architecture] custom Error Classes**: Refactor the error handling to use custom classes (e.g., `AppError`, `ValidationError`) for more granular API responses.
14. **[Testing] Integration Tests**: Expand the `supertest` coverage to include a full "Mark Attendance" flow with coordinate validation.
15. **[Perf] Worker Threads**: For large Excel exports, move the workbook building logic to a Worker Thread to prevent blocking the main event loop.

---
**How to start:**
If you want to work on one of these, please open an issue on GitHub with the title from this list and wait for a maintainer to assign it to you!
