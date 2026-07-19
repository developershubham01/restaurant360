package com.abwcurious.restaurant.tenant;

import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import com.zaxxer.hikari.HikariDataSource;
import javax.sql.DataSource;

@Configuration
public class TenantDataSourceConfig {

    @org.springframework.beans.factory.annotation.Autowired
    private DataSourceProperties properties;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariDataSource hikariDataSource = properties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
        return new TenantAwareDataSource(hikariDataSource);
    }
}
