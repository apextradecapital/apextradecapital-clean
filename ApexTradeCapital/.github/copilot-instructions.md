This repository contains a small Vite + React frontend and a lightweight Node/Express backend that uses SQLite.

Notes for an AI coding assistant (concise, actionable):

- Big picture
  - Frontend: `frontend/` — Vite + React (TypeScript). Entry: `frontend/index.tsx`, main app in `frontend/App.tsx`.
  - Backend: `backend/` — Node/Express server implemented in `backend/server.js`. The root also has a minimal `server.js` used for simple health checks.
  - Data: lightweight SQLite DB at `data/apex.db` (created automatically by `backend/server.js`). File-based persistence is used instead of an external DB.
  - Realtime: backend exports `clients`, `broadcast`, and `logEvent` and uses `ws` (WebSocket) for events — see `backend/server.js` for broadcasting/events schema.

- How to run locally (developer workflows)
  - Frontend dev: from repo root run:
    - `cd frontend` then `npm install` (once) and `npm run dev` (starts Vite).
  - Backend dev: the backend code is plain ESM Node. Recommended quick start:
    - `cd backend` then `npm install` (once) and run `node server.js` (or use `nodemon` if available).
  - Environment: backend reads `.env` via `dotenv`. Common vars: `PORT`. Frontend expects `GEMINI_API_KEY` (see `frontend/README.md`).

- Key patterns & conventions (project-specific)
  - Single-process, file-backed DB: migrations/schema are created by SQL in `backend/server.js` — modify there when changing schema.
  - Events table + WebSocket broadcast: store via `logEvent(actor, type, payload)` which both writes to `events` table and calls `broadcast` to all `clients`.
  - Small monorepo but not using workspace tools — each folder has its own `package.json` (root lists dependencies but has no scripts). Prefer running install/start from each package folder.
  - Frontend routing/navigation is handled through `context/AppContext` (see `frontend/context/AppContext.tsx`). Many pages are lazy-loaded (`React.lazy`) — keep that pattern for large admin pages.

- Files to inspect when making changes
  - `backend/server.js` — DB schema, WebSocket, event logging, core API surface.
  - `server.js` (root) — small health-check server used in some deploy scripts.
  - `frontend/App.tsx`, `frontend/index.tsx` — app wiring, admin shortcut (Ctrl+Alt+1) triggers admin PIN flow.
  - `frontend/services/` — `geminiService.ts`, `calculationService.ts` show how external APIs and business logic are invoked.
  - `frontend/components/admin/*` — admin UI convention and toast/OTP panels; follow their prop patterns when adding admin features.

- Integration points & external dependencies
  - Gemini API: frontend uses `@google/genai` and expects `GEMINI_API_KEY` in `.env.local` for local dev.
  - Email: `nodemailer` referenced in `backend/backend/package.json` — check nested backend if adding email features.
  - WebSockets via `ws` for realtime events.

- Quick guidance for common tasks (examples)
  - Add a new backend API route: edit `backend/server.js`, export helper functions if they should be used by other modules, add tests or a small script to exercise the route.
  - Change DB schema: modify SQL in `backend/server.js` where `CREATE TABLE IF NOT EXISTS` runs, then migrate data carefully (this project relies on the local `data/apex.db`).
  - Use translations: the app uses i18n in `frontend/services/i18n.ts` and translations through `AppContext` — reuse `t('key')` pattern.

- What to avoid / watchouts
  - Don't assume a separate DB server — changes will affect local file `data/apex.db`.
  - Root `package.json` lists dependencies but not scripts; prefer per-folder commands.
  - There are nested packages (e.g., `backend/backend`) — check `package.json` in each folder before adding dependencies.

If anything here looks incomplete or you want more specifics (example API endpoints, a recommended start script for the backend, or unit test examples), tell me which area to expand and I'll update this file.
