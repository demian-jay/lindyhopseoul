package com.lindyhopseoul.backend.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import com.lindyhopseoul.backend.exception.ForbiddenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class AdminPasswordChangeInterceptorTest {

    private PasswordHasher passwordHasher;
    private AdminSessionService adminSessionService;
    private AdminPasswordChangeInterceptor interceptor;

    @BeforeEach
    void setUp() {
        passwordHasher = new PasswordHasher();
        adminSessionService = new AdminSessionService();
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

    @Test
    void defersToTheControllerWhenThereIsNoSession() {
        // An unauthenticated caller is not a password problem; the controller
        // should get to answer with its own 401.
        assertThat(preHandle("GET", "/api/admin/members", null)).isTrue();
        assertThat(preHandle("GET", "/api/admin/members", "not-a-real-token")).isTrue();
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
}
