-- TICKET-0002: add structured payload column to vc.posts
-- Additive only — no existing data is touched.
-- All new system posts (fuel, exchange, menu, locksmith, barbershop) will
-- write a typed JSONB payload alongside the human-readable text field.
-- Legacy posts (payload IS NULL) continue to parse via existing text regex.

ALTER TABLE vc.posts ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT NULL;
