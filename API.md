# SINA People Backend API Documentation 📡

All requests should be made to the base URL: `http://localhost:5000` (Development).
All endpoints are prefixed with `/api`.
Content-Type: `application/json`

## Authentication

### POST `/api/auth/register` (Public)
Register a new organisation and admin.
- **Request Body**: `{ organisationName, name, email, password }`
- **Response**: `200 OK` (Initiates OTP flow)

### POST `/api/auth/login` (Public)
Authenticates a user and returns tokens.
- **Request Body**: `{ email, password }`
- **Response**: `{ accessToken, refreshToken, user: { ... } }`

---

## Attendance Management

### GET `/api/attendance/my` (Authenticated)
Get personal attendance logs for the current user.
- **Query Params**: `startDate`, `endDate` (ISO 8601)
- **Response**: `[ { date, checkIn, checkOut, status, ... } ]`

### POST `/api/attendance/mark` (Authenticated)
Mark attendance for the current user.
- **Request Body**: `{ type: "checkin" | "checkout", latitude, longitude, locationName }`
- **Response**: `200 OK` or `400 Bad Request` (if outside geofence).

---

## Leave Management

### GET `/api/leaves/my` (Authenticated)
Get my leave request history.
- **Response**: `[ { leaveType, startDate, endDate, status, ... } ]`

### POST `/api/leaves/request` (Authenticated)
Submit a new leave request.
- **Request Body**: `{ leaveType, startDate, endDate, reason }`
- **Response**: `{ message: "Request submitted", leaveId: "..." }`

---

## Organisational (Admin/HR Only)

### GET `/api/teams`
List all teams in the organisation.
- **Response**: `[ { name, location: { lat, lng, radius }, ... } ]`

### POST `/api/teams`
Create a new team/office location.
- **Request Body**: `{ name, location: { lat, lng, radius } }`

---
**Developer Note:**
For a full list of endpoints and schema details, please check the routes defined in `src/routes/`.
