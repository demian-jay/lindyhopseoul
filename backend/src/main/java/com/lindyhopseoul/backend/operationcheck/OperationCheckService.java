package com.lindyhopseoul.backend.operationcheck;

import java.util.Collection;
import java.util.List;

import com.lindyhopseoul.backend.admin.AdminPrincipal;
import com.lindyhopseoul.backend.admin.AdminRole;
import com.lindyhopseoul.backend.admin.UserAccount;
import com.lindyhopseoul.backend.admin.UserAccountRepository;
import com.lindyhopseoul.backend.exception.ConflictException;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class OperationCheckService {

    private static final List<AdminRole> OPERATOR_ROLES = List.of(AdminRole.SUPER_ADMIN, AdminRole.STAFF);
    private static final List<AdminRole> ASSIGNEE_ROLES = List.of(AdminRole.STAFF);

    private final OperationCheckItemRepository operationCheckItemRepository;
    private final UserAccountRepository userAccountRepository;

    public OperationCheckService(
            OperationCheckItemRepository operationCheckItemRepository,
            UserAccountRepository userAccountRepository
    ) {
        this.operationCheckItemRepository = operationCheckItemRepository;
        this.userAccountRepository = userAccountRepository;
    }

    public List<OperationCheckAssigneeResponse> findAssignees(AdminPrincipal actor) {
        requireOperator(actor);

        return userAccountRepository.findDistinctByRoles_RoleCodeInAndUseYnOrderByNameAsc(ASSIGNEE_ROLES, "Y")
                .stream()
                .filter(user -> !user.hasRole(AdminRole.SUPER_ADMIN))
                .map(OperationCheckAssigneeResponse::from)
                .toList();
    }

    public OperationCheckSummaryResponse findSummary(AdminPrincipal actor) {
        requireOperator(actor);

        return new OperationCheckSummaryResponse(
                operationCheckItemRepository.countByStatus(OperationCheckStatus.OPEN),
                operationCheckItemRepository.countByStatusAndAssignedToUserId(OperationCheckStatus.OPEN, actor.userCd())
        );
    }

    public List<OperationCheckItemResponse> findItems(AdminPrincipal actor, String status) {
        requireOperator(actor);

        return findItemsByStatus(status).stream()
                .map(item -> OperationCheckItemResponse.from(item, canComplete(actor, item)))
                .toList();
    }

    @Transactional
    public OperationCheckItemResponse create(AdminPrincipal actor, OperationCheckCreateRequest request) {
        requireOperator(actor);

        UserAccount assignedTo = resolveAssignee(request.assignedToUserId());
        OperationCheckItem item = operationCheckItemRepository.save(OperationCheckItem.create(
                clean(request.content()),
                actor,
                assignedTo
        ));

        return OperationCheckItemResponse.from(item, canComplete(actor, item));
    }

    @Transactional
    public OperationCheckItemResponse markDone(AdminPrincipal actor, Long id, OperationCheckDoneRequest request) {
        requireOperator(actor);

        OperationCheckItem item = findItem(id);
        if (item.getStatus() == OperationCheckStatus.DONE) {
            throw new ConflictException("This operation check item is already done.");
        }
        if (!canComplete(actor, item)) {
            throw new ForbiddenException("Only the creator, assignee, or super administrator can complete this item.");
        }

        item.markDone(actor, cleanNullable(request.checkedMemo()));
        return OperationCheckItemResponse.from(item, false);
    }

    private List<OperationCheckItem> findItemsByStatus(String status) {
        if ("DONE".equalsIgnoreCase(status)) {
            return operationCheckItemRepository.findByStatusOrderByCreatedAtDesc(OperationCheckStatus.DONE);
        }
        if ("ALL".equalsIgnoreCase(status)) {
            return operationCheckItemRepository.findAllByOrderByCreatedAtDesc();
        }
        return operationCheckItemRepository.findByStatusOrderByCreatedAtDesc(OperationCheckStatus.OPEN);
    }

    private UserAccount resolveAssignee(String assignedToUserId) {
        String cleanAssignedToUserId = cleanNullable(assignedToUserId);
        if (cleanAssignedToUserId == null) {
            return null;
        }

        UserAccount user = userAccountRepository.findById(cleanAssignedToUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignee not found: " + cleanAssignedToUserId));
        if (!user.isActive() || !hasAnyRole(user.getRoleCodes(), ASSIGNEE_ROLES) || user.hasRole(AdminRole.SUPER_ADMIN)) {
            throw new ConflictException("Assignee must be an active staff member.");
        }
        return user;
    }

    private OperationCheckItem findItem(Long id) {
        return operationCheckItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Operation check item not found: " + id));
    }

    private boolean canComplete(AdminPrincipal actor, OperationCheckItem item) {
        if (item.getStatus() == OperationCheckStatus.DONE) {
            return false;
        }
        return actor.hasRole(AdminRole.SUPER_ADMIN)
                || actor.userCd().equals(item.getCreatedByUserId())
                || actor.userCd().equals(item.getAssignedToUserId());
    }

    private void requireOperator(AdminPrincipal actor) {
        if (!actor.hasAnyRole(AdminRole.SUPER_ADMIN, AdminRole.STAFF)) {
            throw new ForbiddenException("Only staff members can use operation checks.");
        }
    }

    private boolean hasAnyRole(Collection<AdminRole> userRoles, Collection<AdminRole> requiredRoles) {
        return userRoles.stream().anyMatch(requiredRoles::contains);
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private String cleanNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
