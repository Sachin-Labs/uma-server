# SINA People Backend — User Management & Attendance System API

SINA People (User Management & Attendance System) is a robust, production-ready Node.js + Express backend designed for the Multi-Tenant SINA People platform.

---

## 🚀 Live Demo
- **Backend API URL:** [https://sina-people-server.onrender.com](https://sina-people-server.onrender.com) *(Replace with your URL)*

---

## 💻 Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose (ODM)
- **Auth:** JWT with Access/Refresh token rotation
- **Security:** Helmet, CORS, Rate Limiter, Bcrypt
- **Reporting:** ExcelJS (Dynamic report generation)
- **Logging:** Winston + Morgan
- **Email:** Nodemailer (Console / SMTP / SendGrid support)

---

## ✨ Main Features
- **Multi-Tenant Architecture:** Secure data isolation between different organisations.
- **RESTful API:** clean and documented endpoints for all resources.
- **Geofencing Logic:** Server-side validation for office locations and attendance marking.
- **Role-Based Access Control (RBAC):** Permissions for Admin, HR, and Employee roles.
- **Excel Report Exports:** Auto-generated performance and attendance reports.
- **Automated Emails:** verification OTPs, invite links, and leave status updates.

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local or Atlas Atlas)

### 1. Installation
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

### 2. Environment Variables
Create a `.env` file in the `server` directory (copy from `.env.example`):
```bash
cp .env.example .env
```
Configure your MongoDB URI, JWT secrets, and Email provider settings.

### 3. Run Development Server
```bash
npm run dev
```

---

## 🔑 Environment Variables Section
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Port for the express server | `5000` |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_ACCESS_SECRET` | Secret key for access tokens | - |
| `JWT_REFRESH_SECRET`| Secret key for refresh tokens | - |
| `EMAIL_PROVIDER` | `console`, `ethereal`, or `smtp` | `console` |
| `EMAIL_FROM` | Sender email address | `noreply@sina-people.com` |
| `CLIENT_URL` | Frontend application URL | `http://localhost:5173` |

---

## 🤝 Contribution
Contributions are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---
Built with ❤️ by [Sachin Balagam](https://github.com/sachinbalagam)
