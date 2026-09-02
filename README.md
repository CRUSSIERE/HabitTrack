# HabitTrack

A small habit-tracking app: a Node.js/TypeScript/Express/Prisma API backed by Neon Postgres, with a React/Vite/Tailwind dashboard.

Tracks habits (daily or weekly), computes streaks and a 30-day completion rate, and lets you check in for the day.

## Structure

- `/` — backend API (Express + Prisma)
- `/web` — frontend dashboard (React + Vite + Tailwind)

## Backend setup

```bash
npm install
```

Copy `.env.example` to `.env` and set `DATABASE_URL` to your Neon Postgres connection string, then run the migration:

```bash
npx prisma migrate dev
```

Start the API:

```bash
npm run dev
```

Runs on `http://localhost:3000`.

### Backend scripts

- `npm run dev` — start with hot reload
- `npm run build` — type-check and compile to `dist/`
- `npm start` — run the compiled build
- `npm test` — run the streak/completion-rate unit tests

## Frontend setup

```bash
cd web
npm install
npm run dev
```

Runs on `http://localhost:5173` and proxies `/api/*` to the backend on port 3000 (the backend must be running).

### Frontend scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm test` — run the Vitest suite

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/habits` | List all habits with computed streak, 30-day completion rate, and today's check-in status |
| `POST` | `/habits` | Create a habit — `{ name, frequency: "DAILY" \| "WEEKLY" }` |
| `GET` | `/habits/:id` | Get one habit |
| `DELETE` | `/habits/:id` | Delete a habit |
| `POST` | `/habits/:id/completions` | Check in — `{ date? }`, defaults to today |
| `DELETE` | `/habits/:id/completions/:date` | Remove a check-in |

## Scope

No authentication — this is a single-user, local-only tool by design.
