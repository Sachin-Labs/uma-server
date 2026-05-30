const dotenv = require("dotenv");
dotenv.config();

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "dev_access_secret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret",
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || "15m",
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d",

  EMAIL_PROVIDER: (
    process.env.EMAIL_PROVIDER ||
    process.env.MAIL_PROVIDER ||
    "console"
  )
    .toLowerCase()
    .replace("_api", ""),
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "balagamsachin337y@gmail.com",
  EMAIL_SENDER_NAME: process.env.EMAIL_SENDER_NAME || "UMA",

  // HTTP REST API configuration
  BREVO_API_KEY: process.env.BREVO_PASSKEY || process.env.BREVO_API_KEY || "",
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || "",

  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  OFFICE_START_TIME: process.env.OFFICE_START_TIME || "09:00",
};

module.exports = env;
