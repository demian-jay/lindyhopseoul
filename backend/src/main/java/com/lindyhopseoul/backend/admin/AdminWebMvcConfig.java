package com.lindyhopseoul.backend.admin;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AdminWebMvcConfig implements WebMvcConfigurer {

    private final AdminPasswordChangeInterceptor adminPasswordChangeInterceptor;

    public AdminWebMvcConfig(AdminPasswordChangeInterceptor adminPasswordChangeInterceptor) {
        this.adminPasswordChangeInterceptor = adminPasswordChangeInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Every admin route, so a controller added later inherits the block rather
        // than needing to opt in. The interceptor keeps its own allowlist.
        registry.addInterceptor(adminPasswordChangeInterceptor)
                .addPathPatterns("/api/admin/**");
    }
}
