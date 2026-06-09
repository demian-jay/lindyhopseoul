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
    private AdminUserRepository adminUserRepository;

    @Mock
    private TeacherUserRepository teacherUserRepository;

    private PasswordHasher passwordHasher;
    private AdminAuthService adminAuthService;

    @BeforeEach
    void setUp() {
        passwordHasher = new PasswordHasher();
        adminAuthService = new AdminAuthService(
                adminUserRepository,
                teacherUserRepository,
                passwordHasher,
                new AdminSessionService()
        );
    }

    @Test
    void loginReturnsSuperAdminSessionWhenPasswordMatches() {
        AdminUser adminUser = AdminUser.create(
                "A1",
                "Super Administrator",
                "admin",
                passwordHasher.hash("1234"),
                AdminRole.SUPER_ADMIN,
                AdminLanguage.Kor,
                "SYSTEM"
        );
        when(adminUserRepository.findByLoginId("admin")).thenReturn(Optional.of(adminUser));

        AdminAuthResponse response = adminAuthService.login(new AdminLoginRequest("admin", "1234"));

        assertThat(response.accessToken()).isNotBlank();
        assertThat(response.user().role()).isEqualTo(AdminRole.SUPER_ADMIN);
        assertThat(response.user().langCd()).isEqualTo(AdminLanguage.Kor);
        assertThat(response.menus()).containsExactly(AdminMenu.DASHBOARD, AdminMenu.ADMIN_USERS, AdminMenu.TEACHER_USERS);
    }

    @Test
    void loginReturnsTeacherSessionWhenTeacherPasswordMatches() {
        TeacherUser teacherUser = TeacherUser.create(
                "T1",
                "Teacher",
                "teacher",
                passwordHasher.hash("pass1234"),
                AdminLanguage.Eng,
                "SYSTEM"
        );
        when(adminUserRepository.findByLoginId("teacher")).thenReturn(Optional.empty());
        when(teacherUserRepository.findByLoginId("teacher")).thenReturn(Optional.of(teacherUser));

        AdminAuthResponse response = adminAuthService.login(new AdminLoginRequest("teacher", "pass1234"));

        assertThat(response.user().role()).isEqualTo(AdminRole.TEACHER);
        assertThat(response.user().langCd()).isEqualTo(AdminLanguage.Eng);
        assertThat(response.menus()).containsExactly(AdminMenu.DASHBOARD);
    }

    @Test
    void loginThrowsWhenPasswordDoesNotMatch() {
        AdminUser adminUser = AdminUser.create(
                "A1",
                "Super Administrator",
                "admin",
                passwordHasher.hash("1234"),
                AdminRole.SUPER_ADMIN,
                AdminLanguage.Kor,
                "SYSTEM"
        );
        when(adminUserRepository.findByLoginId("admin")).thenReturn(Optional.of(adminUser));

        assertThatThrownBy(() -> adminAuthService.login(new AdminLoginRequest("admin", "wrong")))
                .isInstanceOf(UnauthorizedException.class);
    }
}
