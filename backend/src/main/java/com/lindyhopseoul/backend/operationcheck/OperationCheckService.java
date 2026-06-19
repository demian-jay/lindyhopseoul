package com.lindyhopseoul.backend.operationcheck;

import java.util.ArrayList;
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
    private final OperationCheckCommentRepository operationCheckCommentRepository;
    private final UserAccountRepository userAccountRepository;

    public OperationCheckService(
            OperationCheckItemRepository operationCheckItemRepository,
            OperationCheckCommentRepository operationCheckCommentRepository,
            UserAccountRepository userAccountRepository
    ) {
        this.operationCheckItemRepository = operationCheckItemRepository;
        this.operationCheckCommentRepository = operationCheckCommentRepository;
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
                operationCheckItemRepository.countByStatusAssignedToUser(OperationCheckStatus.OPEN, actor.userCd())
        );
    }

    public List<OperationCheckItemResponse> findItems(AdminPrincipal actor, String status) {
        requireOperator(actor);

        return findItemsByStatus(status).stream()
                .map(item -> toResponse(actor, item))
                .toList();
    }

    @Transactional
    public OperationCheckItemResponse create(AdminPrincipal actor, OperationCheckCreateRequest request) {
        requireOperator(actor);

        List<UserAccount> assignees = resolveAssignees(request.assignedToUserIds(), request.assignedToUserId());
        OperationCheckItem item = operationCheckItemRepository.save(OperationCheckItem.create(
                clean(request.content()),
                actor,
                assignees
        ));

        return toResponse(actor, item);
    }

    @Transactional
    public OperationCheckItemResponse update(AdminPrincipal actor, Long id, OperationCheckUpdateRequest request) {
        requireOperator(actor);

        OperationCheckItem item = findItem(id);
        if (item.getStatus() == OperationCheckStatus.DONE) {
            throw new ConflictException("Completed operation check items cannot be edited.");
        }
        if (!canEdit(actor, item)) {
            throw new ForbiddenException("Only the creator or super administrator can edit this item.");
        }

        item.update(clean(request.content()), resolveAssignees(request.assignedToUserIds(), request.assignedToUserId()));
        return toResponse(actor, item);
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
        return toResponse(actor, item);
    }

    @Transactional
    public OperationCheckCommentResponse addComment(
            AdminPrincipal actor,
            Long id,
            OperationCheckCommentCreateRequest request
    ) {
        requireOperator(actor);

        OperationCheckItem item = findItem(id);
        if (!canComment(actor, item)) {
            throw new ForbiddenException("You cannot comment on this operation check item.");
        }

        OperationCheckComment comment = operationCheckCommentRepository.save(
                OperationCheckComment.create(item, clean(request.content()), actor)
        );
        return OperationCheckCommentResponse.from(comment);
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

    private List<UserAccount> resolveAssignees(List<String> assignedToUserIds, String assignedToUserId) {
        List<String> cleanedIds = new ArrayList<>();
        if (assignedToUserIds != null) {
            assignedToUserIds.stream()
                    .map(this::cleanNullable)
                    .filter(value -> value != null)
                    .forEach(cleanedIds::add);
        }
        String legacyAssignedToUserId = cleanNullable(assignedToUserId);
        if (legacyAssignedToUserId != null) {
            cleanedIds.add(legacyAssignedToUserId);
        }

        return cleanedIds.stream()
                .distinct()
                .map(this::resolveAssignee)
                .toList();
    }

    private UserAccount resolveAssignee(String assignedToUserId) {
        UserAccount user = userAccountRepository.findById(assignedToUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignee not found: " + assignedToUserId));
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
                || item.isAssignedTo(actor.userCd());
    }

    private boolean canComment(AdminPrincipal actor, OperationCheckItem item) {
        return true;
    }

    private boolean canEdit(AdminPrincipal actor, OperationCheckItem item) {
        if (item.getStatus() == OperationCheckStatus.DONE) {
            return false;
        }
        return actor.hasRole(AdminRole.SUPER_ADMIN) || actor.userCd().equals(item.getCreatedByUserId());
    }

    private OperationCheckItemResponse toResponse(AdminPrincipal actor, OperationCheckItem item) {
        List<OperationCheckCommentResponse> comments = findComments(item).stream()
                .map(OperationCheckCommentResponse::from)
                .toList();
        return OperationCheckItemResponse.from(
                item,
                assigneeResponses(item),
                comments,
                canComplete(actor, item),
                canComment(actor, item),
                canEdit(actor, item)
        );
    }

    private List<OperationCheckComment> findComments(OperationCheckItem item) {
        if (item.getId() == null) {
            return List.of();
        }
        return operationCheckCommentRepository.findByItem_IdAndDeletedYnFalseOrderByCreatedAtAsc(item.getId());
    }

    private List<OperationCheckAssigneeResponse> assigneeResponses(OperationCheckItem item) {
        List<OperationCheckAssigneeResponse> assignees = item.getAssignees().stream()
                .map(assignee -> new OperationCheckAssigneeResponse(
                        assignee.getAssigneeUserId(),
                        assignee.getAssigneeName()
                ))
                .toList();
        if (!assignees.isEmpty() || item.getAssignedToUserId() == null) {
            return assignees;
        }
        return List.of(new OperationCheckAssigneeResponse(item.getAssignedToUserId(), item.getAssignedToName()));
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
