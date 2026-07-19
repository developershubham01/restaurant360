package com.abwcurious.restaurant.tenant;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class TenantContext {
    private static final ThreadLocal<Long> currentTenant = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> bypassRls = ThreadLocal.withInitial(() -> false);

    public static void setCurrentTenant(Long tenantId) {
        log.debug("Setting current tenant thread context to: {}", tenantId);
        currentTenant.set(tenantId);
    }

    public static Long getCurrentTenant() {
        return currentTenant.get();
    }

    public static void setBypassRls(boolean bypass) {
        log.debug("Setting RLS bypass flag to: {}", bypass);
        bypassRls.set(bypass);
    }

    public static boolean isBypassRls() {
        return bypassRls.get();
    }

    public static void clear() {
        log.debug("Clearing tenant context");
        currentTenant.remove();
        bypassRls.remove();
    }
}
