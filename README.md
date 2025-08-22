# HopeNest Hub - API Skeleton
This repository contains a minimal Express.js API skeleton for the HopeNest Hub platform. It includes a PostgreSQL `pg` connection and JWT-based route protection. All endpoints requested are available as route stubs returning JSON responses.
Files:
# HopeNest Hub - API Skeleton

This repository contains a minimal Express.js API skeleton for the HopeNest Hub platform. It includes a PostgreSQL `pg` connection and JWT-based route protection. All endpoints requested are available as route stubs returning JSON responses.

Files:
- `server.js` - app entrypoint, config, connects to PostgreSQL using `pg` Pool, exposes `/api` routes.
- `routes.js` - all API routes and a small JWT middleware. Each route is currently a stub returning JSON; replace with real DB logic as needed.
- `hopenest_schema.sql` - SQL schema file for your database (create DB objects from this file).
Quick start:
1. Copy `.env.example` to `.env` and fill values.
2. npm install
3. npm run dev (requires nodemon) or npm start
Notes:
- Registration and login are implemented without enforced JWT/OAuth2 for credentials creation — login issues a JWT. All other routes require a valid JWT in `Authorization: Bearer <token>`.
- Endpoints currently return basic JSON; implement database queries and business logic as needed.

## Prerequisites
- Node.js (16+ recommended)
- npm (comes with Node.js)
- PostgreSQL server (local or remote)
- PowerShell (Windows) or another shell
There is a SQL schema file in this repository: `hopenest_schema.sql`. Use it to create the required tables in your PostgreSQL database before running the server.
## Setup
1. Open a PowerShell terminal in the project folder.
2. Copy the example env and edit it:

```powershell
cp .env.example .env
# then open .env in an editor and set DATABASE_URL and JWT_SECRET
Edit `.env` and set these values as a minimum:
- `DATABASE_URL` — a PostgreSQL connection string, for example:
	postgresql://db_user:db_password@localhost:5432/hopenest
- `JWT_SECRET` — a long random string used to sign JWT tokens.
Example `.env` (do not commit `.env` to source control):
```
## Initialize the database using `hopenest_schema.sql`
1. Create the database (if not exists). Replace `postgres`/`yourpassword` and `hopenest` as appropriate.

```powershell
# create database (login as postgres superuser or a user with create DB privilege)
psql -U postgres -c "CREATE DATABASE hopenest;"
```
2. Run the provided schema file to create tables and sample objects. From the project root (PowerShell):

```powershell
# Adjust -U, -h, -p if required. If your psql uses password auth, you may be prompted for one.
psql -U postgres -d hopenest -f .\hopenest_schema.sql
```
If you use a remote or different user, specify the proper host/port/user, or use the full `DATABASE_URL` connection string with a tool like `pg_restore` or via psql connection options.
## Install dependencies

```powershell
npm install
```
## Start the server

```powershell
# production
npm start

# development (requires nodemon)
npm run dev
```
On startup the server tests a DB connection; if the database is not reachable the process will exit with an error. Make sure `DATABASE_URL` points to a live PostgreSQL instance and that `hopenest_schema.sql` has been applied.
## Authentication and testing endpoints
- `POST /api/register` — create a user (stub). Provide JSON with at least `email` and `password`.
- `POST /api/login` — provide `{ "email": "...", "password": "..." }` and you will receive a JWT in the response `{ token: "..." }` in this skeleton.

Use the returned token to call protected routes by including the HTTP header:

```
Authorization: Bearer <token>
```

Example using PowerShell's curl (Invoke-WebRequest alias) or `curl` if available:

```powershell
curl -Method POST -ContentType 'application/json' -Body '{"email":"test@example.com","password":"secret"}' http://localhost:3000/api/login

# call protected route with token (replace <token>)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/patients
```

All routes listed in the project specification exist in `routes.js` as stubs (returning JSON). Replace the stub responses with actual DB queries using the `pg` pool available via `req.app.locals.pool`.
## Notes for development
- The server uses a `pg` Pool instance created in `server.js`. You can access the pool in route handlers as `const pool = req.app.locals.pool;` and run queries: `await pool.query(...)`.
- File uploads (avatar) are handled with `multer` and stored in the local `uploads/` directory by default.
- Logout is stateless in this skeleton: it returns a success message. To fully invalidate tokens implement a blacklist or short token lifetimes + refresh tokens.

## Next steps (suggested)
1. Implement real user table queries and password validation in `/api/register` and `/api/login`.
2. Replace each stub in `routes.js` with database interactions and validation.
3. Add migrations (e.g., with a migration tool) and seeders for test data.
4. Add tests (Jest + Supertest) to cover endpoints.

If you want, I can:
- Add a `SKIP_DB_CHECK` environment variable to allow running the server without a DB for fast local front-end work.
- Implement a couple of endpoints fully (user registration/login and patients CRUD) using the provided schema.

Tell me which of the above you'd like next and I'll implement it.

Quick start:
1. Copy `.env.example` to `.env` and fill values.
2. npm install
3. npm run dev (requires nodemon) or npm start

Notes:
- Registration and login are implemented without enforced JWT/OAuth2 for credentials creation — login issues a JWT. All other routes require a valid JWT in `Authorization: Bearer <token>`.
- Endpoints currently return basic JSON; implement database queries and business logic as needed.
