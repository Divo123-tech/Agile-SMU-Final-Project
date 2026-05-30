# server_accounts

A small TypeScript + Node.js (Express) API for account sign-up and login, backed by PostgreSQL.

## Endpoints

### `POST /sign-up`

Creates a new account.

Request body:

```json
{
  "email": "user@example.com",
  "password": "yourPassword"
}
```

Response (`201`):

```json
{
  "id": 1,
  "email": "user@example.com"
}
```

### `POST /login`

Signs in with email and password. Returns a JWT access token.

Request body:

```json
{
  "email": "user@example.com",
  "password": "yourPassword"
}
```

Response (`200`):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "account": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

Invalid credentials return `401` with `{ "error": "Invalid email or password" }`.

There is also `GET /health` for a simple liveness check.

## Setup

1. Copy your PostgreSQL env vars into `.env`:

   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/AgileSMU
   PGHOST=localhost
   PGPORT=5432
   PGUSER=postgres
   PGPASSWORD=password
   PGDATABASE=AgileSMU
   PGSSL=false
   PORT=4001
   JWT_SECRET=change-this-to-a-long-random-string
   JWT_EXPIRES_IN=7d
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Ensure the `accounts` table exists:

   ```sql
   CREATE TABLE accounts (
     id            SERIAL PRIMARY KEY,
     email         VARCHAR(255) NOT NULL,
     password_hash VARCHAR(255) NOT NULL,

     CONSTRAINT accounts_email_unique UNIQUE (email),
     CONSTRAINT accounts_email_lowercase CHECK (email = LOWER(email)),
     CONSTRAINT accounts_email_format CHECK (
       email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
     )
   );

   CREATE INDEX idx_accounts_email ON accounts (email);
   ```

## Scripts

| Command             | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start in watch mode with `tsx` (TS, auto-reload) |
| `npm run build`     | Compile TS to `dist/`                            |
| `npm start`         | Run the compiled JS (`dist/index.js`)            |
| `npm run typecheck` | Type-check without emitting                      |
| `npm test`          | Run unit and integration tests                   |

## Example requests

```bash
curl -X POST http://localhost:4001/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securePassword123"}'

curl -X POST http://localhost:4001/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securePassword123"}'
```
