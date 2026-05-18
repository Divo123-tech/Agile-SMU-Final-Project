# server_dishes

A small TypeScript + Node.js (Express) API for stall dishes, backed by PostgreSQL.

## Endpoint

`GET /stall/:id` — returns all dishes for the given stall id.

Response shape:

```json
{
  "stallId": 1,
  "count": 3,
  "dishes": [{ "id": 1, "stall_id": 1, "name": "Chicken Rice", "price": "4.50" }]
}
```

There is also `GET /health` for a simple liveness check.

## Setup

1. Copy the env file and fill in your DB credentials:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies (already done if you cloned with `node_modules`):

   ```bash
   npm install
   ```

3. Make sure your PostgreSQL database has a `dishes` table, e.g.:

   ```sql
   CREATE TABLE dishes (
     id        SERIAL PRIMARY KEY,
     stall_id  INTEGER NOT NULL,
     name      TEXT    NOT NULL,
     price     NUMERIC(10, 2) NOT NULL
   );
   ```

## Scripts

| Command             | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start in watch mode with `tsx` (TS, auto-reload) |
| `npm run build`     | Compile TS to `dist/`                            |
| `npm start`         | Run the compiled JS (`dist/index.js`)            |
| `npm run typecheck` | Type-check without emitting                      |

## Example request

```bash
curl http://localhost:4000/stall/1
```
