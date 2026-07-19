package com.lindyhopseoul.backend.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import com.lindyhopseoul.backend.exception.ForbiddenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminAccountServiceTest {

    @Mock
    private UserAccountRepository userAccountRepository;
    @Mock
    private TeacherUserRepository teacherUserRepository;

    private PasswordHasher passwordHasher;
    private AdminAccountService adminAccountService;

    @BeforeEach
    void setUp() {
        passwordHasher = new PasswordHasher();
        adminAccountService = new AdminAccountService(
                userAccountRepository, teacherUserRepository, passwordHasher);
    }

    private UserAccount account(String id, String loginId, AdminRole... roles) {
        return UserAccount.create(
                id, "Name " + id, loginId, null,
                passwordHasher.hash("pass1234"), AdminLanguage.Kor, List.of(roles));
    }

    @Test
    void staffCannotCreateAdminAccounts() {
        AdminPrincipal staff = AdminPrincipal.from(account("S1", "staff", AdminRole.STAFF));
        AdminAccountCreateRequest request = new AdminAccountCreateRequest(
                "New", "newlogin", "pass1234", AdminRole.STAFF, List.of(AdminRole.STAFF), AdminLanguage.Kor);

        assertThatThrownBy(() -> adminAccountService.createAdminUser(staff, request))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void staffCannotEditAnotherAccount() {
        AdminPrincipal staff = AdminPrincipal.from(account("S1", "staff", AdminRole.STAFF));
        UserAccount other = account("S2", "other", AdminRole.STAFF);
        when(userAccountRepository.findById("S2")).thenReturn(Optional.of(other));
        AdminAccountUpdateRequest request = new AdminAccountUpdateRequest(
                "Other", "other", null, AdminRole.STAFF, List.of(AdminRole.STAFF), AdminLanguage.Kor, "Y");

        assertThatThrownBy(() -> adminAccountService.updateAdminUser(staff, "S2", request))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void staffCannotDeactivateAccounts() {
        AdminPrincipal staff = AdminPrincipal.from(account("S1", "staff", AdminRole.STAFF));

        assertThatThrownBy(() -> adminAccountService.deactivateAdminUser(staff, "S2"))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void staffCanEditOwnAccount() {
        UserAccount self = account("S1", "staff", AdminRole.STAFF);
        AdminPrincipal staff = AdminPrincipal.from(self);
        when(userAccountRepository.findById("S1")).thenReturn(Optional.of(self));
        when(userAccountRepository.findByLoginId("staff")).thenReturn(Optional.of(self));
        when(teacherUserRepository.findFirstByUserAccount_UserIdOrderByTeacherUserNmAsc(any()))
                .thenReturn(Optional.empty());
        AdminAccountUpdateRequest request = new AdminAccountUpdateRequest(
                "Renamed", "staff", "newpass12", AdminRole.STAFF, List.of(AdminRole.STAFF), AdminLanguage.Kor, "Y");

        AdminAccountResponse response = adminAccountService.updateAdminUser(staff, "S1", request);

        assertThat(response.adminUserNm()).isEqualTo("Renamed");
    }

    @Test
    void superAdminCanCreateAdminAccounts() {
        AdminPrincipal superAdmin = AdminPrincipal.from(account("A1", "admin", AdminRole.SUPER_ADMIN));
        when(userAccountRepository.findByLoginId("newlogin")).thenReturn(Optional.empty());
        when(userAccountRepository.save(any(UserAccount.class))).thenAnswer(inv -> inv.getArgument(0));
        when(teacherUserRepository.findFirstByUserAccount_UserIdOrderByTeacherUserNmAsc(any()))
                .thenReturn(Optional.empty());
        AdminAccountCreateRequest request = new AdminAccountCreateRequest(
                "New", "newlogin", "pass1234", AdminRole.STAFF, List.of(AdminRole.STAFF), AdminLanguage.Kor);

        AdminAccountResponse response = adminAccountService.createAdminUser(superAdmin, request);

        assertThat(response.loginId()).isEqualTo("newlogin");
    }
}
