# SINA People Server Roadmap 🗺️

This document outlines the vision for the SINA People Backend. Whether you are an **Architect** thinking about scale or a **Backend Contributor** looking for a task, this is the place to look.

## Phase 1: Core Systems (Current)
- [x] Multi-tenant data isolation.
- [x] JWT-based auth with token rotation.
- [x] Core models: Attendance, Leaves, Teams, Users.
- [x] Basic Excel report generation.
- [x] Role-Based Access Control (RBAC).

## Phase 2: Performance & Integration (Next)
- [ ] **Redis Caching**: Cache team location data and active sessions to reduce MongoDB load.
- [ ] **Email Templates**: Dynamic HTML emails for all notifications using `Handlebars` or `EJS`.
- [ ] **Slack/Discord Integration**: Webhooks for real-time leave request alerts.
- [ ] **Advanced Logging**: Integrate middleware for audit trails on every state change.

## Phase 3: Scaling & Analytics (Future)
- [ ] **Background Processing**: Move Excel generation and email sending to `BullMQ` or `RabbitMQ`.
- [ ] **Predictive Analytics**: API endpoints to predict employee burnout based on overtime trends.
- [ ] **Public API**: Securely expose parts of the API for third-party integrations with API Keys.
- [ ] **WebSockets**: Live dashboard updates using `Socket.io`.

---
**Product Manager's Tip:**
Phase 2 features are designed for "Service Stability." If you are interested in scalability, please see the [ISSUES.md](file:///Users/sachinbalagam/Personal/SINA%20People/server/docs/ISSUES.md) list.
