-- V14__increase_outlet_field_lengths.sql
-- Increase field lengths for outlets columns to prevent value truncation or too long insert errors

ALTER TABLE outlets ALTER COLUMN phone TYPE VARCHAR(50);
ALTER TABLE outlets ALTER COLUMN gst_number TYPE VARCHAR(50);
