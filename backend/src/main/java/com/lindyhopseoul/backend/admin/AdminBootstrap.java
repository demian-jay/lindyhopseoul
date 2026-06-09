package com.lindyhopseoul.backend.admin;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AdminBootstrap {

    private static final String INITIAL_ADMIN_CD = "SUPER_ADMIN";
    private static final String INITIAL_ADMIN_LOGIN_ID = "admin";
    private static final String INITIAL_ADMIN_PASSWORD = "1234";

    @Bean
    ApplicationRunner seedInitialSuperAdmin(
            AdminUserRepository adminUserRepository,
            PasswordHasher passwordHasher
    ) {
        return args -> {
            if (adminUserRepository.findById(INITIAL_ADMIN_CD).isPresent()
                    || adminUserRepository.findByLoginId(INITIAL_ADMIN_LOGIN_ID).isPresent()) {
                return;
            }

            adminUserRepository.save(AdminUser.create(
                    INITIAL_ADMIN_CD,
                    "Super Administrator",
                    INITIAL_ADMIN_LOGIN_ID,
                    passwordHasher.hash(INITIAL_ADMIN_PASSWORD),
                    AdminRole.SUPER_ADMIN,
                    AdminLanguage.Kor,
                    "SYSTEM"
            ));
        };
    }
}
