package com.lindyhopseoul.backend.admin;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Issues an admin session token on local startup and prints it, so local work
 * can reach the admin API and the admin UI without anyone typing a password.
 *
 * <p>Gated on the {@code local} profile rather than on a property. A boolean
 * could be switched on from {@code /etc/lindyhop/backend.env}; a profile the
 * production unit never activates means this bean is not created there at all.
 * {@code DevAdminSessionBootstrapTest} is what keeps that true as the code
 * moves.
 *
 * <p>This repository is public, so the token is generated fresh on every start
 * and only ever written to the log. A constant here would be a published
 * credential for whatever instance ran it — the same reason
 * {@link AdminBootstrap} never hard-codes the seed password.
 *
 * <p>It grants nothing the sign-in path would not. The token comes from
 * {@link AdminSessionService#createSession}, so roles, account status and
 * pending password changes are still read off the account on every request.
 */
@Component
@Profile("local")
public class DevAdminSessionBootstrap {

    private static final Logger log = LoggerFactory.getLogger(DevAdminSessionBootstrap.class);

    private static final String DEV_LOGIN_ID = "admin";

    /** Matches TOKEN_STORAGE_KEY in {@code src/AdminApp.jsx}. */
    private static final String TOKEN_STORAGE_KEY = "swingpop-admin-token";

    private final UserAccountRepository userAccountRepository;
    private final AdminSessionService adminSessionService;

    public DevAdminSessionBootstrap(
            UserAccountRepository userAccountRepository,
            AdminSessionService adminSessionService
    ) {
        this.userAccountRepository = userAccountRepository;
        this.adminSessionService = adminSessionService;
    }

    /**
     * On {@link ApplicationReadyEvent} rather than as an {@code
     * ApplicationRunner}, which would race the runner in {@link AdminBootstrap}
     * that seeds the account this reads. Every runner finishes before this event
     * is published, so the ordering is not left to bean discovery.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void issueDevAdminToken() {
        userAccountRepository.findByLoginId(DEV_LOGIN_ID)
                .filter(UserAccount::isActive)
                .ifPresentOrElse(
                        this::logToken,
                        () -> log.warn("No active '{}' account, so no local admin token was issued.", DEV_LOGIN_ID)
                );
    }

    private void logToken(UserAccount user) {
        String token = adminSessionService.createSession(AdminPrincipal.from(user)).accessToken();
        log.warn(
                """

                        Local admin token for '{}' (profile 'local' only):
                          Authorization: Bearer {}
                          Admin UI: localStorage.setItem('{}', '{}') then reload
                        """,
                DEV_LOGIN_ID,
                token,
                TOKEN_STORAGE_KEY,
                token
        );

        if (user.mustChangePassword()) {
            // Read live off the account on every request, so the token cannot skip
            // it. Said here because the resulting 403 is otherwise a puzzle.
            log.warn(
                    "'{}' still owes a password change, so {} rejects this token everywhere except"
                            + " /api/admin/auth/me and /api/admin/auth/me/password.",
                    DEV_LOGIN_ID,
                    AdminPasswordChangeInterceptor.class.getSimpleName()
            );
        }
    }
}
