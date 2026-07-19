-- V13__increase_brand_field_lengths.sql
-- Increase field lengths for brands columns to prevent value truncation or too long insert errors

ALTER TABLE brands ALTER COLUMN owner_mobile TYPE VARCHAR(50);
ALTER TABLE brands ALTER COLUMN gst_number TYPE VARCHAR(50);
ALTER TABLE brands ALTER COLUMN pan_number TYPE VARCHAR(50);
