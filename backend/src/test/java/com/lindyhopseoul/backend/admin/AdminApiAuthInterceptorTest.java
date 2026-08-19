package com.lindyhopseoul.backend.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

class AdminApiAuthInterceptorTest {

    private final Map<String, AdminSession> sessions = new HashMap<>();
    private final Map<String, UserAccount> accounts = new HashMap<>();

    private PasswordHasher passwordHasher;
    private AdminSessionService adminSessionService;
    private AdminApiAuthInterceptor interceptor;

    @BeforeEach
    void setUp() {
        sessions.clear();
        accounts.clear();
        passwordHasher = new PasswordHasher();
        adminSessionService = new AdminSessionService(
                sessionRepository(), userAccountRepository(), directTransactionManager());
        interceptor = new AdminApiAuthInterceptor(adminSessionService);
    }

    @Test
    void blocksAnOrdinaryRequestWhileTheChangeIsPending() {
        String token = sessionFor(userWithPendingChange());

        assertThatThrownBy(() -> preHandle("GET", "/api/admin/members", token))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("PASSWORD_CHANGE_REQUIRED");
    }

    @Test
    void blocksWritesTooSoTheApiCannotBeDrivenDirectly() {
        String token = sessionFor(userWithPendingChange());

        assertThatThrownBy(() -> preHandle("POST", "/api/admin/admins", token))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void allowsReadingWhoYouAreAndSettingThePassword() {
        String token = sessionFor(userWithPendingChange());

        assertThat(preHandle("GET", "/api/admin/auth/me", token)).isTrue();
        assertThat(preHandle("POST", "/api/admin/auth/me/password", token)).isTrue();
        assertThat(preHandle("POST", "/api/admin/auth/logout", token)).isTrue();
    }

    @Test
    void allowsEverythingOnceThePasswordHasBeenSet() {
        UserAccount user = userWithPendingChange();
        user.changePassword(passwordHasher.hash("brandnewpass"));

        assertThat(preHandle("GET", "/api/admin/members", sessionFor(user))).isTrue();
    }

    /**
     * The session carries the account id, not a copy of the account, so a password
     * set through some other route unblocks the token already in the caller's
     * hands rather than waiting for it to expire.
     */
    @Test
    void picksUpAPasswordSetAfterTheSessionStarted() {
        UserAccount user = userWithPendingChange();
        String token = sessionFor(user);
        assertThatThrownBy(() -> preHandle("GET", "/api/admin/members", token))
                .isInstanceOf(ForbiddenException.class);

        user.changePassword(passwordHasher.hash("brandnewpass"));

        assertThat(preHandle("GET", "/api/admin/members", token)).isTrue();
    }

    /**
     * The guard, not the controller, is what closes an admin route. This used to
     * pass an unauthenticated caller through so the handler could answer with its
     * own 401, which meant a handler that forgot to ask was simply public.
     */
    @Test
    void rejectsACallerWithNoUsableSession() {
        assertThatThrownBy(() -> preHandle("GET", "/api/admin/members", null))
                .isInstanceOf(UnauthorizedException.class);
        assertThatThrownBy(() -> preHandle("GET", "/api/admin/members", "not-a-real-token"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void rejectsACallerWhoseAccountHasBeenDeactivated() {
        UserAccount user = userWithPendingChange();
        user.changePassword(passwordHasher.hash("brandnewpass"));
        String token = sessionFor(user);

        user.deactivate();

        assertThatThrownBy(() -> preHandle("GET", "/api/admin/members", token))
                .isInstanceOf(UnauthorizedException.class);
    }

    /**
     * Signing in is how a session is obtained, and signing out has to work with
     * one that has already expired, so neither can require a live session.
     */
    @Test
    void letsSignInAndSignOutThroughWithoutASession() {
        assertThat(preHandle("POST", "/api/admin/auth/login", null)).isTrue();
        assertThat(preHandle("POST", "/api/admin/auth/logout", null)).isTrue();
    }

    /**
     * Google sign-in is a way in, so it cannot require the admin token it hands
     * out. It is not open — the member session cookie is its credential, and the
     * handler rejects the request without a live one.
     */
    @Test
    void letsGoogleSignInThroughWithoutAnAdminToken() {
        assertThat(preHandle("POST", "/api/admin/auth/google", null)).isTrue();
    }

    /**
     * The allowlist matches a path exactly, so anything that merely resembles one
     * of the named routes is authenticated rather than waved through.
     */
    @Test
    void authenticatesPathsThatOnlyResembleTheAllowlist() {
        assertThatThrownBy(() -> preHandle("POST", "/api/admin/auth/login/", null))
                .isInstanceOf(UnauthorizedException.class);
        assertThatThrownBy(() -> preHandle("POST", "/api/admin/auth/LOGIN", null))
                .isInstanceOf(UnauthorizedException.class);
    }

    /**
     * The routes the guard covers beyond {@code /api/admin/**}. Neither closes on
     * its own: the teacher dashboard asks the session service from inside the
     * handler, and the memo controller takes no Authorization header at all.
     */
    @Test
    void guardsTheTeacherAndMemoRoutesToo() {
        assertThatThrownBy(() -> preHandle("GET", "/api/teacher/dashboard", null))
                .isInstanceOf(UnauthorizedException.class);
        assertThatThrownBy(() -> preHandle("DELETE", "/api/memos/1", null))
                .isInstanceOf(UnauthorizedException.class);
    }

    /**
     * A browser preflight carries no Authorization header by design, so rejecting
     * it would break every cross-origin admin call before it was made.
     */
    @Test
    void letsPreflightThrough() {
        assertThat(preHandle("OPTIONS", "/api/admin/members", null)).isTrue();
    }

    private UserAccount userWithPendingChange() {
        return UserAccount.create(
                "A1",
                "Super Administrator",
                "admin",
                null,
                passwordHasher.hash("handedout"),
                AdminLanguage.Kor,
                List.of(AdminRole.SUPER_ADMIN)
        );
    }

    private String sessionFor(UserAccount user) {
        accounts.put(user.getUserId(), user);
        return adminSessionService.createSession(AdminPrincipal.from(user)).accessToken();
    }

    private boolean preHandle(String method, String uri, String token) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setRequestURI(uri);
        if (token != null) {
            request.addHeader("Authorization", "Bearer " + token);
        }
        return interceptor.preHandle(request, new MockHttpServletResponse(), new Object());
    }

    private AdminSessionRepository sessionRepository() {
        AdminSessionRepository repository = mock(AdminSessionRepository.class);
        when(repository.save(any(AdminSession.class))).thenAnswer(invocation -> {
            AdminSession session = invocation.getArgument(0);
            sessions.put(session.getTokenHash(), session);
            return session;
        });
        when(repository.findById(anyString()))
                .thenAnswer(invocation -> Optional.ofNullable(sessions.get(invocation.<String>getArgument(0))));
        return repository;
    }

    private UserAccountRepository userAccountRepository() {
        UserAccountRepository repository = mock(UserAccountRepository.class);
        when(repository.findById(anyString()))
                .thenAnswer(invocation -> Optional.ofNullable(accounts.get(invocation.<String>getArgument(0))));
        return repository;
    }

    /**
     * There is no database here, so the transaction manager only has to run the
     * callback. {@link org.springframework.transaction.support.TransactionTemplate}
     * needs one to exist, not to do anything.
     */
    private PlatformTransactionManager directTransactionManager() {
        return new AbstractPlatformTransactionManager() {
            @Override
            protected Object doGetTransaction() {
                return new Object();
            }

            @Override
            protected void doBegin(Object transaction, TransactionDefinition definition) {
            }

            @Override
            protected void doCommit(DefaultTransactionStatus status) {
            }

            @Override
            protected void doRollback(DefaultTransactionStatus status) {
            }
        };
    }
}
