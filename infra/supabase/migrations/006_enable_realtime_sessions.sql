-- Enable Supabase Realtime for the sessions table.
-- This adds it to the supabase_realtime publication so that
-- the client-side subscription on postgres_changes receives
-- INSERT / UPDATE / DELETE events.
--
-- We publish only the sessions table (not * from all tables)
-- to minimize replication overhead.

alter publication supabase_realtime add table sessions;
