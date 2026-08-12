# SINA People Learning Lab: Backend Edition 🧠

Welcome to the SINA People Backend Learning Lab! This document is designed for **Students** and **Junior Backend Developers** to help you understand the architectural "Why" behind the "What".

## 🔐 Security & Auth
1. **The Secret**: Why do we store the `JWT_ACCESS_SECRET` in a `.env` file instead of directly in the code? *Search for "Environment Variables and Security".*
2. **Double Tokens**: We use both an Access Token and a Refresh Token. Why? Could we just use one long-lived Access Token? What is the risk?

## 📊 Performance & Scaling
3. **Report Generation**: When generating Excel reports, we use the `ExcelJS` library. If we have 10,000 employees, how would the memory usage of our server change? *Search for "Streams in Node.js".*
4. **Indexing**: We query attendance logs by `date` and `userId`. How can we speed up these queries as the database grows from 1,000 to 1,000,000 records?

## 🏗 Modular Code
5. **Services vs Controllers**: Why do we have a separate `services/` folder? What happens if we decide to move from a Web API to a Mobile API, or even just a CLI tool? How does the Service layer help?

## 🚀 Improvement Ideas (Project Proposals)
- **Rate Limiting**: Currently, we have basic rate limiting. How would you implement a "Bucket Token" algorithm to allow bursts of traffic during peak attendance hours but limit average traffic?
- **Audit Logs**: How would you design a system that tracks every change an HR manager makes to an employee's attendance record?

---
**Learning Tip:**
Look at `src/services/` and try to write a new service that calculates "Average Work Hours" for a user. Notice how you don't need to touch any Express/API code to do it!
