package com.lindyhopseoul.backend.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

/**
 * The profile tests are the point of this file. A dev sign-in shortcut is only
 * safe while production cannot create it, and a comment saying so does not stay
 * true on its own.
 */
@ExtendWith(MockitoExtension.class)
class DevAdminSessionBootstrapTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withBean(UserAccountRepository.class, () -> mock(UserAccountRepository.class))
            .withBean(AdminSessionService.class, () -> mock(AdminSessionService.class))
            .withUserConfiguration(DevAdminSessionBootstrap.class);

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private AdminSessionService adminSessionService;

    @Test
    void beanExistsOnTheLocalProfile() {
        contextRunner.withPropertyValues("spring.profiles.active=local")
                .run(context -> assertThat(context).hasSingleBean(DevAdminSessionBootstrap.class));
    }

    @Test
    void beanIsAbsentOnTheProductionProfile() {
        contextRunner.withPropertyValues("spring.profiles.active=prod")
                .run(context -> assertThat(context).doesNotHaveBean(DevAdminSessionBootstrap.class));
    }

    @Test
    void beanIsAbsentWithoutAnActiveProfile() {
        contextRunner.run(context -> assertThat(context).doesNotHaveBean(DevAdminSessionBootstrap.class));
    }

    @Test
    void issuesASessionForTheAdminAccount() {
        UserAccount admin = adminAccount();
        when(userAccountRepository.findByLoginId("admin")).thenReturn(Optional.of(admin));
        when(adminSessionService.createSession(any()))
                .thenReturn(AdminAuthResponse.from("dev-token", AdminPrincipal.from(admin)));

        bootstrap().issueDevAdminToken();

        ArgumentCaptor<AdminPrincipal> principal = ArgumentCaptor.forClass(AdminPrincipal.class);
        verify(adminSessionService).createSession(principal.capture());
        assertThat(principal.getValue().loginId()).isEqualTo("admin");
        assertThat(principal.getValue().roles()).containsExactly(AdminRole.SUPER_ADMIN);
    }

    @Test
    void issuesNothingWhenTheAdminAccountIsMissing() {
        when(userAccountRepository.findByLoginId("admin")).thenReturn(Optional.empty());

        bootstrap().issueDevAdminToken();

        verify(adminSessionService, never()).createSession(any());
    }

    private DevAdminSessionBootstrap bootstrap() {
        return new DevAdminSessionBootstrap(userAccountRepository, adminSessionService);
    }

    private UserAccount adminAccount() {
        return UserAccount.create(
                "SUPER_ADMIN",
                "Super Administrator",
                "admin",
                null,
                new PasswordHasher().hash("local-only"),
                AdminLanguage.Kor,
                List.of(AdminRole.SUPER_ADMIN)
        );
    }
}
