package com.abwcurious.restaurant.tenant;

import org.springframework.jdbc.datasource.DelegatingDataSource;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

public class TenantAwareDataSource extends DelegatingDataSource {

    public TenantAwareDataSource(DataSource delegate) {
        super(delegate);
    }

    @Override
    public Connection getConnection() throws SQLException {
        Connection connection = super.getConnection();
        setTenantContext(connection);
        return connection;
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        Connection connection = super.getConnection(username, password);
        setTenantContext(connection);
        return connection;
    }

    private void setTenantContext(Connection connection) throws SQLException {
        Long tenantId = TenantContext.getCurrentTenant();
        boolean bypass = TenantContext.isBypassRls();
        try (Statement stmt = connection.createStatement()) {
            String sql1 = "SET app.current_tenant_id = '" + (tenantId != null ? tenantId : "") + "'";
            String sql2 = "SET app.bypass_rls = '" + (bypass ? "true" : "false") + "'";
            stmt.execute(sql1);
            stmt.execute(sql2);
        }
    }
}
