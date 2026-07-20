package com.lindyhopseoul.backend.admin;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

@Configuration
public class AdminBootstrap {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private static final String INITIAL_ADMIN_CD = "SUPER_ADMIN";
    private static final String INITIAL_ADMIN_LOGIN_ID = "admin";

    @Bean
    ApplicationRunner seedInitialSuperAdmin(
            AdminUserRepository adminUserRepository,
            TeacherUserRepository teacherUserRepository,
            UserAccountRepository userAccountRepository,
            PasswordHasher passwordHasher,
            JdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            @Value("${app.admin.initial-password:}") String configuredInitialPassword
    ) {
        return args -> transactionTemplate.executeWithoutResult(status -> {
            migrateLegacyAdminUsers(adminUserRepository, userAccountRepository);
            migrateLegacyTeacherUsers(teacherUserRepository, userAccountRepository, passwordHasher, jdbcTemplate);

            UserAccount initialAdmin = userAccountRepository.findByLoginId(INITIAL_ADMIN_LOGIN_ID)
                    .or(() -> userAccountRepository.findById(INITIAL_ADMIN_CD))
                    .orElseGet(() -> userAccountRepository.save(UserAccount.create(
                            INITIAL_ADMIN_CD,
                            "Super Administrator",
                            INITIAL_ADMIN_LOGIN_ID,
                            null,
                            // Resolved inside the supplier so nothing is generated or
                            // logged on the usual startup, where the account exists.
                            passwordHasher.hash(resolveInitialPassword(configuredInitialPassword)),
                            AdminLanguage.Kor,
                            List.of(AdminRole.SUPER_ADMIN)
                    )));
            ensureRole(userAccountRepository, initialAdmin, AdminRole.SUPER_ADMIN);
            ensureTeacherProfilesForTeacherRoles(teacherUserRepository, userAccountRepository);
            dropLegacyTeacherLoginColumns(jdbcTemplate);
        });
    }

    private void migrateLegacyAdminUsers(
            AdminUserRepository adminUserRepository,
            UserAccountRepository userAccountRepository
    ) {
        for (AdminUser adminUser : adminUserRepository.findAll()) {
            UserAccount user = userAccountRepository.findByLoginId(adminUser.getLoginId())
                    .or(() -> userAccountRepository.findById(adminUser.getAdminUserCd()))
                    .orElseGet(() -> userAccountRepository.save(UserAccount.create(
                            adminUser.getAdminUserCd(),
                            adminUser.getAdminUserNm(),
                            adminUser.getLoginId(),
                            null,
                            adminUser.getLoginPwHash(),
                            adminUser.getLangCd(),
                            List.of(adminUser.getRole())
                    )));
            ensureRole(userAccountRepository, user, adminUser.getRole());
        }
    }

    private void migrateLegacyTeacherUsers(
            TeacherUserRepository teacherUserRepository,
            UserAccountRepository userAccountRepository,
            PasswordHasher passwordHasher,
            JdbcTemplate jdbcTemplate
    ) {
        String tableName = findActualTableName(jdbcTemplate, "TEACHER_USER_M");
        if (tableName == null || !hasColumn(jdbcTemplate, tableName, "LOGIN_ID")) {
            return;
        }

        List<Map<String, Object>> legacyTeachers = jdbcTemplate.queryForList(
                "select TEACHER_USER_CD, TEACHER_USER_NM, LOGIN_ID, LOGIN_PW_HASH, LANG_CD "
                        + "from `" + tableName + "` "
                        + "where USER_ID is null and LOGIN_ID is not null"
        );

        for (Map<String, Object> legacyTeacher : legacyTeachers) {
            String teacherUserCd = asString(legacyTeacher.get("TEACHER_USER_CD"));
            String teacherUserNm = asString(legacyTeacher.get("TEACHER_USER_NM"));
            String loginId = asString(legacyTeacher.get("LOGIN_ID"));
            String loginPwHash = asString(legacyTeacher.get("LOGIN_PW_HASH"));
            AdminLanguage langCd = toLanguage(asString(legacyTeacher.get("LANG_CD")));

            if (loginId == null || loginId.isBlank()) {
                continue;
            }

            UserAccount user = userAccountRepository.findByLoginId(loginId)
                    .orElseGet(() -> userAccountRepository.save(UserAccount.create(
                            null,
                            teacherUserNm,
                            loginId,
                            null,
                            // A legacy row with no hash gets an unusable random password
                            // rather than a shared known one. The teacher cannot sign in
                            // until a super admin sets a password for them, which is the
                            // intended path anyway.
                            loginPwHash == null || loginPwHash.isBlank()
                                    ? passwordHasher.hash(randomPassword())
                                    : loginPwHash,
                            langCd,
                            List.of(AdminRole.TEACHER)
                    )));
            ensureRole(userAccountRepository, user, AdminRole.TEACHER);
            teacherUserRepository.findById(teacherUserCd)
                    .ifPresent(teacherUser -> {
                        teacherUser.linkUserAccount(user, "SYSTEM");
                        teacherUserRepository.save(teacherUser);
                    });
        }
    }

    private void dropLegacyTeacherLoginColumns(JdbcTemplate jdbcTemplate) {
        String tableName = findActualTableName(jdbcTemplate, "TEACHER_USER_M");
        if (tableName == null) {
            return;
        }

        dropIndexIfExists(jdbcTemplate, tableName, "UK_TEACHER_USER_M_LOGIN_ID");
        dropColumnIfExists(jdbcTemplate, tableName, "LOGIN_ID");
        dropColumnIfExists(jdbcTemplate, tableName, "LOGIN_PW_HASH");
        dropColumnIfExists(jdbcTemplate, tableName, "LANG_CD");
    }

    private void ensureRole(UserAccountRepository userAccountRepository, UserAccount user, AdminRole role) {
        if (!user.hasRole(role)) {
            user.addRole(role);
            userAccountRepository.save(user);
        }
    }

    private void ensureTeacherProfilesForTeacherRoles(
            TeacherUserRepository teacherUserRepository,
            UserAccountRepository userAccountRepository
    ) {
        for (UserAccount user : userAccountRepository.findAll()) {
            Optional<TeacherUser> teacherProfile = teacherUserRepository
                    .findFirstByUserAccount_UserIdOrderByTeacherUserNmAsc(user.getUserId());
            if (user.hasRole(AdminRole.TEACHER) && user.isActive()) {
                teacherProfile.ifPresentOrElse(
                        profile -> profile.updateProfile(user.getName(), user, "Y", "SYSTEM"),
                        () -> teacherUserRepository.save(TeacherUser.createProfile(
                                null,
                                user.getName(),
                                user,
                                "SYSTEM"
                        ))
                );
            } else {
                teacherProfile.ifPresent(profile -> profile.updateProfile(user.getName(), user, "N", "SYSTEM"));
            }
        }
    }

    private String findActualTableName(JdbcTemplate jdbcTemplate, String tableName) {
        List<Map<String, Object>> tables = jdbcTemplate.queryForList(
                """
                        select table_name
                        from information_schema.tables
                        where table_schema = database()
                          and lower(table_name) = lower(?)
                        """,
                tableName
        );
        if (tables.isEmpty()) {
            return null;
        }
        return String.valueOf(tables.get(0).get("table_name"));
    }

    private boolean hasColumn(JdbcTemplate jdbcTemplate, String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                        select count(*)
                        from information_schema.columns
                        where table_schema = database()
                          and lower(table_name) = lower(?)
                          and lower(column_name) = lower(?)
                        """,
                Integer.class,
                tableName,
                columnName
        );
        return count != null && count > 0;
    }

    private void dropIndexIfExists(JdbcTemplate jdbcTemplate, String tableName, String indexName) {
        List<Map<String, Object>> indexes = jdbcTemplate.queryForList(
                """
                        select index_name
                        from information_schema.statistics
                        where table_schema = database()
                          and lower(table_name) = lower(?)
                          and lower(index_name) = lower(?)
                        limit 1
                        """,
                tableName,
                indexName
        );
        if (!indexes.isEmpty()) {
            jdbcTemplate.execute("alter table `" + tableName + "` drop index `" + indexes.get(0).get("index_name") + "`");
        }
    }

    private void dropColumnIfExists(JdbcTemplate jdbcTemplate, String tableName, String columnName) {
        List<Map<String, Object>> columns = jdbcTemplate.queryForList(
                """
                        select column_name
                        from information_schema.columns
                        where table_schema = database()
                          and lower(table_name) = lower(?)
                          and lower(column_name) = lower(?)
                        limit 1
                        """,
                tableName,
                columnName
        );
        if (!columns.isEmpty()) {
            jdbcTemplate.execute("alter table `" + tableName + "` drop column `" + columns.get(0).get("column_name") + "`");
        }
    }

    /**
     * The seed password for a brand new database. It is never a constant in this
     * file: this repository is public, so anything written here would be a
     * published credential for whatever instance is running it.
     */
    private String resolveInitialPassword(String configured) {
        if (configured != null && !configured.isBlank()) {
            return configured;
        }

        String generated = randomPassword();
        // Only reached while creating the account, so this prints once on a fresh
        // database and never again. Set app.admin.initial-password to avoid it.
        log.warn(
                "Seeded the '{}' account with a generated password: {} — change it after signing in.",
                INITIAL_ADMIN_LOGIN_ID,
                generated
        );
        return generated;
    }

    private static String randomPassword() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private AdminLanguage toLanguage(String value) {
        if (value == null || value.isBlank()) {
            return AdminLanguage.Kor;
        }
        try {
            return AdminLanguage.valueOf(value);
        } catch (IllegalArgumentException exception) {
            return AdminLanguage.Kor;
        }
    }
}
