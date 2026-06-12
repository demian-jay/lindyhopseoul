package com.lindyhopseoul.backend.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;

import com.lindyhopseoul.backend.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminAuthServiceTest {

    @Mock
    private UserAccountRepository userAccountRepository;

    private PasswordHasher passwordHasher;
    private AdminAuthService adminAuthService;

    @BeforeEach
    void setUp() {
        passwordHasher = new PasswordHasher();
        adminAuthService = new AdminAuthService(
                userAccountRepository,
                passwordHasher,
                new AdminSessionService()
        );
    }

    @Test
    void loginReturnsSuperAdminSessionWhenPasswordMatches() {
        UserAccount adminUser = UserAccount.create(
                "A1",
                "Super Administrator",
                "admin",
                null,
                passwordHasher.hash("1234"),
                AdminLanguage.Kor,
                java.util.List.of(AdminRole.SUPER_ADMIN)
        );
        when(userAccountRepository.findByLoginId("admin")).thenReturn(Optional.of(adminUser));

        AdminAuthResponse response = adminAuthService.login(new AdminLoginRequest("admin", "1234"));

        assertThat(response.accessToken()).isNotBlank();
        assertThat(response.user().role()).isEqualTo(AdminRole.SUPER_ADMIN);
        assertThat(response.user().roles()).containsExactly(AdminRole.SUPER_ADMIN);
        assertThat(response.user().langCd()).isEqualTo(AdminLanguage.Kor);
        assertThat(response.menus()).containsExactly(
                AdminMenu.DASHBOARD,
                AdminMenu.EVENT_MANAGEMENT,
                AdminMenu.KNOWLEDGE_BASE,
                AdminMenu.MESSAGE_TEMPLATES,
                AdminMenu.ADMIN_USERS,
                AdminMenu.TEACHER_USERS
        );
    }

    @Test
    void loginReturnsTeacherSessionWhenTeacherPasswordMatches() {
        UserAccount teacherUser = UserAccount.create(
                "T1",
                "Teacher",
                "teacher",
                null,
                passwordHasher.hash("pass1234"),
                AdminLanguage.Eng,
                java.util.List.of(AdminRole.TEACHER)
        );
        when(userAccountRepository.findByLoginId("teacher")).thenReturn(Optional.of(teacherUser));

        AdminAuthResponse response = adminAuthService.login(new AdminLoginRequest("teacher", "pass1234"));

        assertThat(response.user().role()).isEqualTo(AdminRole.TEACHER);
        assertThat(response.user().roles()).containsExactly(AdminRole.TEACHER);
        assertThat(response.user().langCd()).isEqualTo(AdminLanguage.Eng);
        assertThat(response.menus()).containsExactly(AdminMenu.DASHBOARD);
    }

    @Test
    void loginReturnsAllRolesForMultiRoleUser() {
        UserAccount user = UserAccount.create(
                "U1",
                "Staff Teacher",
                "staffteacher",
                null,
                passwordHasher.hash("pass1234"),
                AdminLanguage.Eng,
                java.util.List.of(AdminRole.STAFF, AdminRole.TEACHER)
        );
        when(userAccountRepository.findByLoginId("staffteacher")).thenReturn(Optional.of(user));

        AdminAuthResponse response = adminAuthService.login(new AdminLoginRequest("staffteacher", "pass1234"));

        assertThat(response.user().role()).isEqualTo(AdminRole.STAFF);
        assertThat(response.user().roles()).containsExactly(AdminRole.STAFF, AdminRole.TEACHER);
        assertThat(response.menus()).contains(
                AdminMenu.DASHBOARD,
                AdminMenu.EVENT_MANAGEMENT,
                AdminMenu.KNOWLEDGE_BASE,
                AdminMenu.ADMIN_USERS,
                AdminMenu.TEACHER_USERS
        );
    }

    @Test
    void loginThrowsWhenPasswordDoesNotMatch() {
        UserAccount adminUser = UserAccount.create(
                "A1",
                "Super Administrator",
                "admin",
                null,
                passwordHasher.hash("1234"),
                AdminLanguage.Kor,
                java.util.List.of(AdminRole.SUPER_ADMIN)
        );
        when(userAccountRepository.findByLoginId("admin")).thenReturn(Optional.of(adminUser));

        assertThatThrownBy(() -> adminAuthService.login(new AdminLoginRequest("admin", "wrong")))
                .isInstanceOf(UnauthorizedException.class);
    }
}
