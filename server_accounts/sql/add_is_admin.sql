-- Admin flag on accounts (run on your shared PostgreSQL database).

ALTER TABLE accounts
  ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- Optional: promote an existing account to admin (replace email).
-- UPDATE accounts SET is_admin = true WHERE email = 'admin@example.com';
