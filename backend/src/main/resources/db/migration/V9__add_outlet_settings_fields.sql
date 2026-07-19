-- Add restaurant settings fields to outlets table
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS fssai_number VARCHAR(20);
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS cgst_rate DOUBLE PRECISION DEFAULT 2.5;
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS sgst_rate DOUBLE PRECISION DEFAULT 2.5;
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS service_charge_rate DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS packaging_charge DOUBLE PRECISION DEFAULT 15.0;

-- Set defaults for existing rows
UPDATE outlets SET cgst_rate = 2.5 WHERE cgst_rate IS NULL;
UPDATE outlets SET sgst_rate = 2.5 WHERE sgst_rate IS NULL;
UPDATE outlets SET service_charge_rate = 0.0 WHERE service_charge_rate IS NULL;
UPDATE outlets SET packaging_charge = 15.0 WHERE packaging_charge IS NULL;
