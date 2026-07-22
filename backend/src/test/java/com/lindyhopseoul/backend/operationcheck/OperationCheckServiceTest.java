package com.lindyhopseoul.backend.operationcheck;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import com.lindyhopseoul.backend.admin.AdminLanguage;
import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminRole;
import com.lindyhopseoul.backend.admin.UserAccount;
import com.lindyhopseoul.backend.admin.UserAccountRepository;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OperationCheckServiceTest {

    @Mock
    private OperationCheckItemRepository operationCheckItemRepository;

    @Mock
    private OperationCheckCommentRepository operationCheckCommentRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    private OperationCheckService operationCheckService;

    @BeforeEach
    void setUp() {
        operationCheckService = new OperationCheckService(
                operationCheckItemRepository,
                operationCheckCommentRepository,
                userAccountRepository,
                eventPublisher
        );
    }

    @Test
    void createStoresOpenItemWithOptionalAssignee() {
        AdminPrincipal actor = principal("S1", "Staff A", AdminRole.STAFF);
        UserAccount assignee = user("S2", "Staff B", AdminRole.STAFF);
        when(userAccountRepository.findById("S2")).thenReturn(Optional.of(assignee));
        when(operationCheckItemRepository.save(any(OperationCheckItem.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OperationCheckItemResponse response = operationCheckService.create(
                actor,
                new OperationCheckCreateRequest("Check John's entrance fee", List.of("S2"), null)
        );

        assertThat(response.content()).isEqualTo("Check John's entrance fee");
        assertThat(response.createdByUserId()).isEqualTo("S1");
        assertThat(response.assignedToUserId()).isEqualTo("S2");
        assertThat(response.assignees()).extracting(OperationCheckAssigneeResponse::userId).containsExactly("S2");
        assertThat(response.status()).isEqualTo(OperationCheckStatus.OPEN);
    }

    @Test
    void findAssigneesExcludesSuperAdmins() {
        AdminPrincipal actor = principal("S1", "Staff A", AdminRole.STAFF);
        UserAccount staff = user("S2", "Staff B", AdminRole.STAFF);
        UserAccount superAdmin = user("A1", "Super Admin", AdminRole.SUPER_ADMIN);
        superAdmin.addRole(AdminRole.STAFF);
        when(userAccountRepository.findDistinctByRoles_RoleCodeInAndUseYnOrderByNameAsc(List.of(AdminRole.STAFF), "Y"))
                .thenReturn(List.of(superAdmin, staff));

        List<OperationCheckAssigneeResponse> assignees = operationCheckService.findAssignees(actor);

        assertThat(assignees).extracting(OperationCheckAssigneeResponse::name).containsExactly("Staff B");
        verify(userAccountRepository).findDistinctByRoles_RoleCodeInAndUseYnOrderByNameAsc(List.of(AdminRole.STAFF), "Y");
    }

    @Test
    void assigneeCanMarkItemDone() {
        AdminPrincipal creator = principal("S1", "Staff A", AdminRole.STAFF);
        AdminPrincipal assignee = principal("S2", "Staff B", AdminRole.STAFF);
        OperationCheckItem item = OperationCheckItem.create(
                "Buy cups before class",
                creator,
                List.of(user("S2", "Staff B", AdminRole.STAFF))
        );
        when(operationCheckItemRepository.findById(10L)).thenReturn(Optional.of(item));

        OperationCheckItemResponse response = operationCheckService.markDone(
                assignee,
                10L,
                new OperationCheckDoneRequest("Bought at the station.")
        );

        assertThat(response.status()).isEqualTo(OperationCheckStatus.DONE);
        assertThat(response.checkedYn()).isTrue();
        assertThat(response.checkedByUserId()).isEqualTo("S2");
        assertThat(response.checkedMemo()).isEqualTo("Bought at the station.");
    }

    @Test
    void unrelatedStaffCannotMarkItemDone() {
        AdminPrincipal creator = principal("S1", "Staff A", AdminRole.STAFF);
        AdminPrincipal unrelated = principal("S3", "Staff C", AdminRole.STAFF);
        OperationCheckItem item = OperationCheckItem.create(
                "Confirm venue key",
                creator,
                List.of(user("S2", "Staff B", AdminRole.STAFF))
        );
        when(operationCheckItemRepository.findById(10L)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> operationCheckService.markDone(
                unrelated,
                10L,
                new OperationCheckDoneRequest(null)
        )).isInstanceOf(ForbiddenException.class);
    }

    @Test
    void teacherCannotUseOperationChecks() {
        AdminPrincipal teacher = principal("T1", "Teacher", AdminRole.TEACHER);

        assertThatThrownBy(() -> operationCheckService.findItems(teacher, "OPEN"))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void assigneeCanCommentOnAssignedItem() {
        AdminPrincipal creator = principal("S1", "Staff A", AdminRole.STAFF);
        AdminPrincipal assignee = principal("S2", "Staff B", AdminRole.STAFF);
        OperationCheckItem item = OperationCheckItem.create(
                "Buy water before party",
                creator,
                List.of(user("S2", "Staff B", AdminRole.STAFF), user("S3", "Staff C", AdminRole.STAFF))
        );
        when(operationCheckItemRepository.findById(10L)).thenReturn(Optional.of(item));
        when(operationCheckCommentRepository.save(any(OperationCheckComment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OperationCheckCommentResponse response = operationCheckService.addComment(
                assignee,
                10L,
                new OperationCheckCommentCreateRequest("How many bottles?")
        );

        assertThat(response.content()).isEqualTo("How many bottles?");
        assertThat(response.createdByUserId()).isEqualTo("S2");
    }

    @Test
    void unrelatedStaffCanCommentOnAssignedItem() {
        AdminPrincipal creator = principal("S1", "Staff A", AdminRole.STAFF);
        AdminPrincipal unrelated = principal("S4", "Staff D", AdminRole.STAFF);
        OperationCheckItem item = OperationCheckItem.create(
                "Buy water before party",
                creator,
                List.of(user("S2", "Staff B", AdminRole.STAFF), user("S3", "Staff C", AdminRole.STAFF))
        );
        when(operationCheckItemRepository.findById(10L)).thenReturn(Optional.of(item));
        when(operationCheckCommentRepository.save(any(OperationCheckComment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OperationCheckCommentResponse response = operationCheckService.addComment(
                unrelated,
                10L,
                new OperationCheckCommentCreateRequest("I will check.")
        );

        assertThat(response.createdByUserId()).isEqualTo("S4");
    }

    @Test
    void allStaffCanCommentOnSharedItem() {
        AdminPrincipal creator = principal("S1", "Staff A", AdminRole.STAFF);
        AdminPrincipal staff = principal("S4", "Staff D", AdminRole.STAFF);
        OperationCheckItem item = OperationCheckItem.create("Shared note", creator, List.of());
        when(operationCheckItemRepository.findById(10L)).thenReturn(Optional.of(item));
        when(operationCheckCommentRepository.save(any(OperationCheckComment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OperationCheckCommentResponse response = operationCheckService.addComment(
                staff,
                10L,
                new OperationCheckCommentCreateRequest("I saw this.")
        );

        assertThat(response.createdByUserId()).isEqualTo("S4");
    }

    private AdminPrincipal principal(String userId, String name, AdminRole role) {
        return new AdminPrincipal(userId, name, userId.toLowerCase(), role, List.of(role), AdminLanguage.Kor);
    }

    private UserAccount user(String userId, String name, AdminRole role) {
        return UserAccount.create(userId, name, userId.toLowerCase(), null, "password", AdminLanguage.Kor, List.of(role));
    }
}
