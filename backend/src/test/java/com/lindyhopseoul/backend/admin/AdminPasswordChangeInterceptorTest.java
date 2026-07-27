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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

class AdminPasswordChangeInterceptorTest {

    private final Map<String, AdminSession> sessions = new HashMap<>();
    private final Map<String, UserAccount> accounts = new HashMap<>();

    private PasswordHasher passwordHasher;
    private AdminSessionService adminSessionService;
    private AdminPasswordChangeInterceptor interceptor;

    @BeforeEach
    void setUp() {
        sessions.clear();
        accounts.clear();
        passwordHasher = new PasswordHasher();
        adminSessionService = new AdminSessionService(
                sessionRepository(), userAccountRepository(), directTransactionManager());
        interceptor = new AdminPasswordChangeInterceptor(adminSessionService);
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

    @Test
    void defersToTheControllerWhenThereIsNoSession() {
        // An unauthenticated caller is not a password problem; the controller
        // should get to answer with its own 401.
        assertThat(preHandle("GET", "/api/admin/members", null)).isTrue();
        assertThat(preHandle("GET", "/api/admin/members", "not-a-real-token")).isTrue();
    }

    @Test
    void defersToTheControllerOnceTheAccountIsDeactivated() {
        UserAccount user = userWithPendingChange();
        user.changePassword(passwordHasher.hash("brandnewpass"));
        String token = sessionFor(user);

        user.deactivate();

        assertThat(preHandle("GET", "/api/admin/members", token)).isTrue();
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
