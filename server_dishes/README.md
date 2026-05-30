# server_dishes

TypeScript + Express API for dish CRUD, backed by PostgreSQL.

## Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/health` | Liveness check |
| `POST` | `/dishes` | Create a dish |
| `GET` | `/dishes/:id` | Get one dish |
| `PUT` | `/dishes/:id` | Update a dish |
| `DELETE` | `/dishes/:id` | Delete a dish |

Stall menus (`GET /stall/:id`) live in **server_stalls** (port 4002).

## Setup

1. Copy the env file and fill in your DB credentials:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

## Scripts

| Command             | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start in watch mode with `tsx` (TS, auto-reload) |
| `npm run build`     | Compile TS to `dist/`                            |
| `npm start`         | Run the compiled JS (`dist/index.js`)            |
| `npm run typecheck` | Type-check without emitting                      |
| `npm test`          | Run Vitest                                       |
