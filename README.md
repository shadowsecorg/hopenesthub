## HopeNest Hub

An Express.js + Sequelize (PostgreSQL) backend with EJS-powered Admin and Caregiver panels for the HopeNest platform. Includes JWT auth, REST APIs, database migrations/seeders, and demo UIs.

### Contents
- Quick start (local, Docker)
- Environment variables
- Database (migrations, seeders)
- Scripts
- API overview
- UI routes (Admin, Caregiver)
- File structure
- Troubleshooting

---

## Quick start

### Local (Node.js)
1) Install dependencies:

```bash
npm install
```

2) Set environment variables (see Env section). Minimum required: `DATABASE_URL`, `JWT_SECRET`.

3) Apply migrations and seed demo data:

```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

4) Start the server:

```bash
npm run dev   # with nodemon
# or
npm start
```

Server listens on `http://localhost:${PORT||3000}`.

### Docker (PostgreSQL only)
A compose file is provided for Postgres:

```bash
docker compose up -d postgres
```

Then set `DATABASE_URL=postgres://hopenest:hopenest_password@localhost:5433/hopenest` and run migrations/seeders locally as above.

---

## Environment variables
Create `.env` in the project root. Required:

- `DATABASE_URL` Postgres connection string, e.g. `postgres://user:pass@localhost:5432/hopenest`
- `JWT_SECRET` Long random string for JWT signing
- `PORT` Optional, default `3000`

The app also creates a `pg` Pool from `DATABASE_URL` and initializes Sequelize with the same URL.

---

## Database
Sequelize is configured for Postgres via `config/config.js` (uses `DATABASE_URL`).

Run migrations and seeders:

```bash
npm run db:migrate
npm run db:seed
```

Undo if needed:

```bash
npm run db:migrate:undo
npm run db:seed:undo
```

Seeded demo accounts (password: `ChangeMe123!`):
- Admin: `admin@hopenest.local`
- Doctor: `doctor@hopenest.local`
- Patient: `patient@hopenest.local`
- Caregiver: `caregiver@hopenest.local`

Schema reference: see `DATABASE.md`. A raw SQL schema also exists in `hopenest_schema.sql` (optional).

---

## Scripts

```json
{
  "start": "node server.js",
  "dev": "nodemon server.js",
  "db:migrate": "sequelize-cli db:migrate",
  "db:migrate:undo": "sequelize-cli db:migrate:undo:all",
  "db:seed": "sequelize-cli db:seed:all",
  "db:seed:undo": "sequelize-cli db:seed:undo:all"
}
```

---

## API overview
Base path: `/api`

Auth and profile (`routes/users.js`):
- `POST /api/register`
- `POST /api/login`
- `POST /api/logout` (JWT required)
- `GET /api/profile` (JWT)
- `PUT /api/profile` (JWT)
- `POST /api/profile/avatar` multipart/form-data, field `avatar` (JWT)

Patients (`routes/patients.js`, JWT):
- `GET /api/patients`
- `GET /api/patients/:id`
- `POST /api/patients`
- `PUT /api/patients/:id`
- `DELETE /api/patients/:id`
- `POST /api/patients/:id/symptoms`, `GET /api/patients/:id/symptoms`
- `POST /api/patients/:id/emotions`, `GET /api/patients/:id/emotions`
- `POST /api/patients/:id/metrics`, `GET /api/patients/:id/metrics`, `GET /api/patients/:id/metrics/latest`
- `POST /api/patients/:id/reminders`, `GET /api/patients/:id/reminders`
- `POST /api/patients/:id/medications`, `GET /api/patients/:id/medications`

Caregivers (`routes/caregivers.js`, JWT):
- `GET /api/caregivers/:id/patients`
- `POST /api/caregivers/:id/assign`
- `DELETE /api/caregivers/:id/patients/:pid`

Doctors (`routes/doctors.js`, JWT):
- `GET /api/doctors/:id/patients`
- `GET /api/doctors/:id/patients/:pid/report`
- `POST /api/doctors/:id/patients/:pid/notes`
- `POST /api/doctors/:id/patients/:pid/prescriptions`
- `POST /api/doctors/:id/alerts`
- `GET /api/doctors/:id/analytics`

AI (`routes/ai.js`, JWT):
- `POST /api/ai/analyze`
- `GET /api/ai/patients/:id/alerts`
- `POST /api/ai/recommendations`
- `GET /api/ai/patients/:id/predictions`

Chat and messages (`routes/chat.js`, JWT):
- `POST /api/chatbot/message`
- `GET /api/chatbot/history`
- `POST /api/messages/:id_receiver`
- `GET /api/messages`

Devices (`routes/devices.js`, JWT):
- `POST /api/devices/register`
- `GET /api/devices/:id`
- `POST /api/devices/:id/sync`
- `GET /api/devices/:id/metrics`

Admin (`routes/admin.js`, JWT):
- `GET /api/admin/users`
- `GET /api/admin/reports`
- `GET /api/admin/logs`
- `POST /api/admin/settings`

Notifications (`routes/notifications.js`, JWT):
- `POST /api/notifications/send`
- `GET /api/notifications/:id`
- `DELETE /api/notifications/:id`

Auth header for protected routes:

```http
Authorization: Bearer <jwt>
```

---

## UI routes (server-rendered)
Base pages live under `web/pages.js` and `views/` using EJS layouts.

Admin panel:
- `GET /admin` (dashboard)
- `GET /admin/users`
- `GET /admin/alerts`
- `GET /admin/patients`
- `POST /admin/users`, `POST /admin/users/:id/update`, `POST /admin/users/:id/delete`, `POST /admin/users/:id/reset-password`, `POST /admin/users/:id/verify`
- `POST /admin/alerts/:id/confirm`, `POST /admin/alerts/:id/reject`
- `POST /admin/alert-settings`
- `GET /admin/messages`, `POST /admin/messages/send`
- `GET /admin/reports`
- `GET /admin/settings`
- `GET /admin/advanced-analytics`
- `GET /admin/wearable-management`

Caregiver panel:
- `GET /caregiver/dashboard`
- `GET /caregiver/patient-list`
- `GET /caregiver/under-care`
- `GET /caregiver/api/metrics?patientId=...&days=7` (JSON)
- `GET /caregiver/messages`, `POST /caregiver/messages/send`
- `GET /caregiver/reports`, `GET /caregiver/reports/export`
- `GET /caregiver/recommendations`, `POST /caregiver/recommendations`
- `GET /caregiver/settings`, `POST /caregiver/settings`
- `POST /caregiver/assign`, `POST /caregiver/patients` (demo create)
- `POST /caregiver/alerts/:id/ack`, `POST /caregiver/alerts/:id/dismiss`

Static assets:
- Served from `/public` and `/frontend`.

---

## File structure (key paths)
- `server.js` Express app, EJS setup, pg Pool, routes mount
- `routes/` API route modules
- `controllers/` Business logic handlers
- `models/` Sequelize models and associations
- `migrations/` + `seeders/` Database evolution and demo data
- `web/pages.js` Server-rendered page routes
- `views/` EJS templates and layouts
- `public/`, `frontend/` Static assets and prototype UIs
- `docker-compose.yml` Postgres service

---

## Troubleshooting
- DB connection fails on start: confirm `DATABASE_URL`, Postgres is up, and run migrations.
- Login returns 401/403: ensure you seeded users and are using the correct password (`ChangeMe123!`).
- `sequelize-cli` not found: use `npx` or add as devDependency (already included).
- Port conflicts: set `PORT` in `.env`.

---

## License
MIT
