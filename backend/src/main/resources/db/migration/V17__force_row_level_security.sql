-- V17__force_row_level_security.sql
-- Enforce Row Level Security even for table owners (e.g. the app's default postgres user)
-- to ensure tenant isolation works as expected when using standard database poolers.

ALTER TABLE outlets FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE dining_floors FORCE ROW LEVEL SECURITY;
ALTER TABLE dining_tables FORCE ROW LEVEL SECURITY;
ALTER TABLE categories FORCE ROW LEVEL SECURITY;
ALTER TABLE menu_items FORCE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
ALTER TABLE kot_tickets FORCE ROW LEVEL SECURITY;
