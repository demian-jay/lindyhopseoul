package com.lindyhopseoul.backend.admin;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AdminWebMvcConfig implements WebMvcConfigurer {

    private final AdminApiAuthInterceptor adminApiAuthInterceptor;

    public AdminWebMvcConfig(AdminApiAuthInterceptor adminApiAuthInterceptor) {
        this.adminApiAuthInterceptor = adminApiAuthInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Whole path prefixes rather than named routes, so a controller added later
        // inherits the guard rather than needing to opt in. The interceptor keeps
        // its own allowlist for the few routes that must stay reachable.
        //
        // /api/teacher/** is here because it authenticates the same way, with an
        // AdminPrincipal off the same bearer token.
        //
        // /api/memos/** is here because it authenticates no other way: the
        // controller takes no Authorization header at all. It backs an operations
        // scratchpad whose UI is no longer reachable, and until this it was open
        // to the internet for read, write and delete.
        registry.addInterceptor(adminApiAuthInterceptor)
                .addPathPatterns("/api/admin/**", "/api/teacher/**", "/api/memos/**");
    }
}
