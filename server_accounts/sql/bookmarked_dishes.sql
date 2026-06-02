-- Saved dishes per account (bookmarks).
-- Run against the same PostgreSQL database used by server_accounts, server_dishes, and server_stalls.

CREATE TABLE bookmarked_dishes (
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  dish_id    INTEGER NOT NULL REFERENCES dishes(dish_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (account_id, dish_id)
);

CREATE INDEX idx_bookmarked_dishes_account_id ON bookmarked_dishes (account_id);
