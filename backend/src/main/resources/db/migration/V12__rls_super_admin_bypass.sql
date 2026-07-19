-- V12__rls_super_admin_bypass.sql
-- Drop old strict or partial policies
DROP POLICY IF EXISTS outlets_rls ON outlets;
DROP POLICY IF EXISTS users_rls ON users;
DROP POLICY IF EXISTS dining_floors_rls ON dining_floors;
DROP POLICY IF EXISTS dining_tables_rls ON dining_tables;
DROP POLICY IF EXISTS categories_rls ON categories;
DROP POLICY IF EXISTS menu_items_rls ON menu_items;
DROP POLICY IF EXISTS orders_rls ON orders;
DROP POLICY IF EXISTS kot_tickets_rls ON kot_tickets;

-- Re-create all RLS policies to check for app.bypass_rls = 'true' (for Super Admin dashboard controls)
CREATE POLICY outlets_rls ON outlets FOR ALL 
    USING (current_setting('app.bypass_rls', true) = 'true' 
           OR NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL 
           OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint);

CREATE POLICY users_rls ON users FOR ALL 
    USING (current_setting('app.bypass_rls', true) = 'true' 
           OR NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL 
           OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint);

CREATE POLICY dining_floors_rls ON dining_floors FOR ALL 
    USING (current_setting('app.bypass_rls', true) = 'true' 
           OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint);

CREATE POLICY dining_tables_rls ON dining_tables FOR ALL 
    USING (current_setting('app.bypass_rls', true) = 'true' 
           OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint);

CREATE POLICY categories_rls ON categories FOR ALL 
    USING (current_setting('app.bypass_rls', true) = 'true' 
           OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint);

CREATE POLICY menu_items_rls ON menu_items FOR ALL 
    USING (current_setting('app.bypass_rls', true) = 'true' 
           OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint);

CREATE POLICY orders_rls ON orders FOR ALL 
    USING (current_setting('app.bypass_rls', true) = 'true' 
           OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint);

CREATE POLICY kot_tickets_rls ON kot_tickets FOR ALL 
    USING (current_setting('app.bypass_rls', true) = 'true' 
           OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint);
