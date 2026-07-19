ALTER TABLE ingredients ADD COLUMN category varchar(100) DEFAULT 'General';

SELECT setval(pg_get_serial_sequence('ingredients', 'id'), COALESCE(max(id), 1)) FROM ingredients;
SELECT setval(pg_get_serial_sequence('vendors', 'id'), COALESCE(max(id), 1)) FROM vendors;
SELECT setval(pg_get_serial_sequence('wastage_entries', 'id'), COALESCE(max(id), 1)) FROM wastage_entries;
