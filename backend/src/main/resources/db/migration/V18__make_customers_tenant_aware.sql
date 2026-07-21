-- V18__make_customers_tenant_aware.sql
-- Enforce multi-tenant isolation rules across CRM, inventory, logs, and billing

-- 1. Modify customers table unique phone constraint and add tenant_id
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_phone_key;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='tenant_id') THEN
        ALTER TABLE customers ADD COLUMN tenant_id bigint REFERENCES brands(id) ON DELETE CASCADE;
    END IF;
END $$;

UPDATE customers SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE customers ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_tenant_phone_key;
ALTER TABLE customers ADD CONSTRAINT customers_tenant_phone_key UNIQUE (tenant_id, phone);

-- 2. Enable & Force RLS on all related tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;

ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sessions FORCE ROW LEVEL SECURITY;

ALTER TABLE feature_toggles ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_toggles FORCE ROW LEVEL SECURITY;

ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses FORCE ROW LEVEL SECURITY;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history FORCE ROW LEVEL SECURITY;

ALTER TABLE saas_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_audit_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons FORCE ROW LEVEL SECURITY;

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients FORCE ROW LEVEL SECURITY;

ALTER TABLE ingredient_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_categories FORCE ROW LEVEL SECURITY;

ALTER TABLE terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminals FORCE ROW LEVEL SECURITY;

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;

ALTER TABLE report_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_snapshots FORCE ROW LEVEL SECURITY;

ALTER TABLE stock_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_ledger FORCE ROW LEVEL SECURITY;

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders FORCE ROW LEVEL SECURITY;

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts FORCE ROW LEVEL SECURITY;

ALTER TABLE wastage_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wastage_entries FORCE ROW LEVEL SECURITY;

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors FORCE ROW LEVEL SECURITY;

ALTER TABLE loyalty_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_wallets FORCE ROW LEVEL SECURITY;

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses FORCE ROW LEVEL SECURITY;

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items FORCE ROW LEVEL SECURITY;

ALTER TABLE kot_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kot_items FORCE ROW LEVEL SECURITY;

ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items FORCE ROW LEVEL SECURITY;

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes FORCE ROW LEVEL SECURITY;

ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants FORCE ROW LEVEL SECURITY;

ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements FORCE ROW LEVEL SECURITY;

ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts FORCE ROW LEVEL SECURITY;

ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds FORCE ROW LEVEL SECURITY;

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands FORCE ROW LEVEL SECURITY;

-- 3. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS brands_rls ON brands;
DROP POLICY IF EXISTS customers_rls ON customers;
DROP POLICY IF EXISTS device_sessions_rls ON device_sessions;
DROP POLICY IF EXISTS feature_toggles_rls ON feature_toggles;
DROP POLICY IF EXISTS licenses_rls ON licenses;
DROP POLICY IF EXISTS notifications_rls ON notifications;
DROP POLICY IF EXISTS login_history_rls ON login_history;
DROP POLICY IF EXISTS saas_audit_logs_rls ON saas_audit_logs;
DROP POLICY IF EXISTS audit_logs_rls ON audit_logs;
DROP POLICY IF EXISTS addons_rls ON addons;
DROP POLICY IF EXISTS ingredients_rls ON ingredients;
DROP POLICY IF EXISTS ingredient_categories_rls ON ingredient_categories;
DROP POLICY IF EXISTS terminals_rls ON terminals;
DROP POLICY IF EXISTS payments_rls ON payments;
DROP POLICY IF EXISTS report_snapshots_rls ON report_snapshots;
DROP POLICY IF EXISTS stock_ledger_rls ON stock_ledger;
DROP POLICY IF EXISTS purchase_orders_rls ON purchase_orders;
DROP POLICY IF EXISTS shifts_rls ON shifts;
DROP POLICY IF EXISTS wastage_entries_rls ON wastage_entries;
DROP POLICY IF EXISTS vendors_rls ON vendors;
DROP POLICY IF EXISTS loyalty_wallets_rls ON loyalty_wallets;
DROP POLICY IF EXISTS customer_addresses_rls ON customer_addresses;
DROP POLICY IF EXISTS order_items_rls ON order_items;
DROP POLICY IF EXISTS kot_items_rls ON kot_items;
DROP POLICY IF EXISTS recipe_items_rls ON recipe_items;
DROP POLICY IF EXISTS recipes_rls ON recipes;
DROP POLICY IF EXISTS variants_rls ON variants;
DROP POLICY IF EXISTS settlements_rls ON settlements;
DROP POLICY IF EXISTS discounts_rls ON discounts;
DROP POLICY IF EXISTS refunds_rls ON refunds;

-- 4. Create Policies for Tenant-direct tables
CREATE POLICY customers_rls ON customers FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint
);
CREATE POLICY device_sessions_rls ON device_sessions FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint
);
CREATE POLICY feature_toggles_rls ON feature_toggles FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint
);
CREATE POLICY licenses_rls ON licenses FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint
);
CREATE POLICY notifications_rls ON notifications FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint
);
CREATE POLICY login_history_rls ON login_history FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint
);
CREATE POLICY saas_audit_logs_rls ON saas_audit_logs FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint
);

-- 5. Create Policies for Outlet-linked tables (via subquery on outlets)
CREATE POLICY audit_logs_rls ON audit_logs FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR outlet_id IN (SELECT id FROM outlets WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY addons_rls ON addons FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR outlet_id IN (SELECT id FROM outlets WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY ingredients_rls ON ingredients FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR outlet_id IN (SELECT id FROM outlets WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY ingredient_categories_rls ON ingredient_categories FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR outlet_id IN (SELECT id FROM outlets WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY terminals_rls ON terminals FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR outlet_id IN (SELECT id FROM outlets WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY payments_rls ON payments FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR outlet_id IN (SELECT id FROM outlets WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY report_snapshots_rls ON report_snapshots FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR outlet_id IN (SELECT id FROM outlets WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY stock_ledger_rls ON stock_ledger FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR outlet_id IN (SELECT id FROM outlets WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY purchase_orders_rls ON purchase_orders FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR outlet_id IN (SELECT id FROM outlets WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY shifts_rls ON shifts FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR outlet_id IN (SELECT id FROM outlets WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY wastage_entries_rls ON wastage_entries FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR outlet_id IN (SELECT id FROM outlets WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY vendors_rls ON vendors FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR outlet_id IN (SELECT id FROM outlets WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);

-- 6. Create Policies for Child-related tables (via parent join)
CREATE POLICY loyalty_wallets_rls ON loyalty_wallets FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR customer_id IN (SELECT id FROM customers WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY customer_addresses_rls ON customer_addresses FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR customer_id IN (SELECT id FROM customers WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY order_items_rls ON order_items FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR order_id IN (SELECT id FROM orders WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY kot_items_rls ON kot_items FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR kot_ticket_id IN (SELECT id FROM kot_tickets WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY recipe_items_rls ON recipe_items FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR recipe_id IN (SELECT r.id FROM recipes r JOIN menu_items m ON r.menu_item_id = m.id WHERE m.tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY recipes_rls ON recipes FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR menu_item_id IN (SELECT id FROM menu_items WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY variants_rls ON variants FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR menu_item_id IN (SELECT id FROM menu_items WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY settlements_rls ON settlements FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR shift_id IN (SELECT s.id FROM shifts s JOIN outlets o ON s.outlet_id = o.id WHERE o.tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY discounts_rls ON discounts FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR order_id IN (SELECT id FROM orders WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint)
);
CREATE POLICY refunds_rls ON refunds FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR payment_id IN (SELECT id FROM payments WHERE outlet_id IN (SELECT id FROM outlets WHERE tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint))
);
CREATE POLICY brands_rls ON brands FOR ALL USING (
    current_setting('app.bypass_rls', true) = 'true' 
    OR id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint
);
