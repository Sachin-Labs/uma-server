const dotenv = require("dotenv");
dotenv.config();

const provider = (process.env.EMAIL_PROVIDER || process.env.MAIL_PROVIDER || "console")
  .toLowerCase()
  .replace("_api", "");

const missing = [];

function required(name) {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    missing.push(name);
    return undefined;
  }
  return value.trim();
}

// Always required — no hardcoded fallbacks for secrets or the database.
const MONGODB_URI = required("MONGODB_URI");
const JWT_ACCESS_SECRET = required("JWT_ACCESS_SECRET");
const JWT_REFRESH_SECRET = required("JWT_REFRESH_SECRET");

// Provider-conditional requirements
const SMTP_HOST = provider === "smtp" ? required("SMTP_HOST") : (process.env.SMTP_HOST || "");
const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 587;
const SMTP_USER = provider === "smtp" ? required("SMTP_USER") : (process.env.SMTP_USER || "");
const SMTP_PASS = provider === "smtp" ? required("SMTP_PASS") : (process.env.SMTP_PASS || "");

const BREVO_API_KEY = provider === "brevo" ? required("BREVO_API_KEY") : (process.env.BREVO_PASSKEY || process.env.BREVO_API_KEY || "");
const SENDGRID_API_KEY = provider === "sendgrid" ? required("SENDGRID_API_KEY") : (process.env.SENDGRID_API_KEY || "");

// EMAIL_FROM is only needed when actually delivering mail
const EMAIL_FROM = provider === "console" || provider === "ethereal"
  ? (process.env.EMAIL_FROM || "noreply@localhost")
  : required("EMAIL_FROM");

// Fail fast at boot — report every missing variable at once.
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(", ")}. ` +
    "Refer to .env.example and set them before starting the server."
  );
}

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  MONGODB_URI,

  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || "15m",
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d",

  EMAIL_PROVIDER: provider,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  EMAIL_SENDER_NAME: process.env.EMAIL_SENDER_NAME || "SINA People",

  BREVO_API_KEY,
  SENDGRID_API_KEY,

  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  OFFICE_START_TIME: process.env.OFFICE_START_TIME || "09:00",
};

module.exports = env;
