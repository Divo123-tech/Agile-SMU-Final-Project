-- Optional message from admin when rejecting a stall (shown to the owner on My Stalls).

ALTER TABLE stalls
  ADD COLUMN admin_notes TEXT;
