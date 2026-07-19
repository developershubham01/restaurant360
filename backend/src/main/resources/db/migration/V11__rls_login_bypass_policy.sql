-- V11__rls_login_bypass_policy.sql
-- Drop old strict RLS policies on outlets and users
DROP POLICY IF EXISTS outlets_rls ON outlets;
DROP POLICY IF EXISTS users_rls ON users;

-- Re-create RLS policies with unauthenticated bypass
-- This permits login lookup queries (when app.current_tenant_id is empty) while strictly isolating data once logged in.
CREATE POLICY outlets_rls ON outlets FOR ALL 
    USING (NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL 
           OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint);

CREATE POLICY users_rls ON users FOR ALL 
    USING (NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL 
           OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint);
