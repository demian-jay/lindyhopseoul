package com.lindyhopseoul.backend.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;

import com.lindyhopseoul.backend.exception.ConflictException;
import com.lindyhopseoul.backend.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;

@ExtendWith(MockitoExtension.class)
class AdminAuthServiceTest {

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private AdminSessionRepository adminSessionRepository;

    private PasswordHasher passwordHasher;
    private AdminAuthService adminAuthService;

    @BeforeEach
    void setUp() {
        passwordHasher = new PasswordHasher();
        adminAuthService = new AdminAuthService(
                userAccountRepository,
                passwordHasher,
                new AdminSessionService(
                        adminSessionRepository,
                        userAccountRepository,
                        mock(PlatformTransactionManager.class)
                )
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
                AdminMenu.OPERATION_CHECK,
                AdminMenu.MEMBER_MESSAGES,
                AdminMenu.KNOWLEDGE_BASE,
                AdminMenu.MEMBERS,
                AdminMenu.EVENT_VIEW,
                AdminMenu.MESSAGE_TEMPLATE_VIEW,
                AdminMenu.CORKBOARD,
                AdminMenu.ADMIN_USERS,
                AdminMenu.EVENT_REGISTRATION,
                AdminMenu.MEMBER_ACTION_LOGS,
                AdminMenu.MESSAGE_TEMPLATE_REGISTRATION,
                AdminMenu.KNOWLEDGE_BASE_REGISTRATION,
                AdminMenu.EVENT_DEFAULTS,
                AdminMenu.GOOGLE_LINKS
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
        assertThat(response.menus()).containsExactly(
                AdminMenu.DASHBOARD,
                AdminMenu.EVENT_VIEW,
                AdminMenu.MESSAGE_TEMPLATE_VIEW
        );
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
        assertThat(response.menus()).containsExactly(
                AdminMenu.DASHBOARD,
                AdminMenu.OPERATION_CHECK,
                AdminMenu.MEMBER_MESSAGES,
                AdminMenu.KNOWLEDGE_BASE,
                AdminMenu.MEMBERS,
                AdminMenu.EVENT_VIEW,
                AdminMenu.MESSAGE_TEMPLATE_VIEW,
                AdminMenu.CORKBOARD,
                AdminMenu.ADMIN_USERS,
                AdminMenu.EVENT_REGISTRATION,
                AdminMenu.MESSAGE_TEMPLATE_REGISTRATION,
                AdminMenu.KNOWLEDGE_BASE_REGISTRATION
        );
    }

    @Test
    void loginFlagsAnAccountThatHasNeverSetItsOwnPassword() {
        UserAccount user = newUser("pass1234");
        when(userAccountRepository.findByLoginId("admin")).thenReturn(Optional.of(user));

        AdminAuthResponse response = adminAuthService.login(new AdminLoginRequest("admin", "pass1234"));

        assertThat(response.user().mustChangePassword()).isTrue();
    }

    @Test
    void changingOwnPasswordClearsTheFlag() {
        UserAccount user = newUser("pass1234");
        when(userAccountRepository.findById("A1")).thenReturn(Optional.of(user));

        AdminPrincipal updated = adminAuthService.changeOwnPassword(
                AdminPrincipal.from(user),
                new AdminPasswordChangeRequest("pass1234", "brandnewpass")
        );

        assertThat(updated.mustChangePassword()).isFalse();
        assertThat(passwordHasher.matches("brandnewpass", user.getPassword())).isTrue();
    }

    @Test
    void changingOwnPasswordRequiresTheCurrentOne() {
        UserAccount user = newUser("pass1234");
        when(userAccountRepository.findById("A1")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> adminAuthService.changeOwnPassword(
                AdminPrincipal.from(user),
                new AdminPasswordChangeRequest("wrong", "brandnewpass")
        )).isInstanceOf(UnauthorizedException.class);

        assertThat(user.mustChangePassword()).isTrue();
    }

    @Test
    void changingOwnPasswordRejectsReusingTheSameOne() {
        UserAccount user = newUser("pass1234");
        when(userAccountRepository.findById("A1")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> adminAuthService.changeOwnPassword(
                AdminPrincipal.from(user),
                new AdminPasswordChangeRequest("pass1234", "pass1234")
        )).isInstanceOf(ConflictException.class);

        assertThat(user.mustChangePassword()).isTrue();
    }

    @Test
    void anAdminResettingSomeoneElsesPasswordLeavesItPending() {
        UserAccount user = newUser("pass1234");
        user.changePassword(passwordHasher.hash("chosenbyme"));
        assertThat(user.mustChangePassword()).isFalse();

        user.resetPassword(passwordHasher.hash("handedout"));

        assertThat(user.mustChangePassword()).isTrue();
    }

    private UserAccount newUser(String rawPassword) {
        return UserAccount.create(
                "A1",
                "Super Administrator",
                "admin",
                null,
                passwordHasher.hash(rawPassword),
                AdminLanguage.Kor,
                java.util.List.of(AdminRole.SUPER_ADMIN)
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
