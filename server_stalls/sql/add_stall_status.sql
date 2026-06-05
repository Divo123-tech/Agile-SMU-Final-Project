-- Stall approval workflow: pending → approved or rejected.
-- Run on the same database as stalls / dishes.

ALTER TABLE stalls
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending';

ALTER TABLE stalls
  ADD CONSTRAINT stalls_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE INDEX idx_stalls_status ON stalls (status);

-- Existing stalls were live before moderation: treat them as approved.
-- New rows still default to 'pending' via the column default above.
UPDATE stalls SET status = 'approved' WHERE status = 'pending';
