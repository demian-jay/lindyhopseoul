package com.lindyhopseoul.backend.admin;

import java.util.List;
import java.util.Optional;

import com.lindyhopseoul.backend.exception.ConflictException;
import com.lindyhopseoul.backend.exception.ForbiddenException;
import com.lindyhopseoul.backend.exception.ResourceNotFoundException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminAccountService {

    private final AdminUserRepository adminUserRepository;
    private final TeacherUserRepository teacherUserRepository;
    private final PasswordHasher passwordHasher;

    public AdminAccountService(
            AdminUserRepository adminUserRepository,
            TeacherUserRepository teacherUserRepository,
            PasswordHasher passwordHasher
    ) {
        this.adminUserRepository = adminUserRepository;
        this.teacherUserRepository = teacherUserRepository;
        this.passwordHasher = passwordHasher;
    }

    public List<AdminAccountResponse> findAdminUsers(AdminPrincipal actor) {
        requireAccountManager(actor);

        return adminUserRepository.findAll(Sort.by(Sort.Direction.ASC, "adminUserNm"))
                .stream()
                .map(AdminAccountResponse::from)
                .toList();
    }

    @Transactional
    public AdminAccountResponse createAdminUser(AdminPrincipal actor, AdminAccountCreateRequest request) {
        requireAccountManager(actor);
        requireAdminRole(actor, request.role());
        validateLoginIdAvailable(request.loginId(), Optional.empty(), Optional.empty());

        AdminUser adminUser = adminUserRepository.save(AdminUser.create(
                null,
                request.adminUserNm().trim(),
                request.loginId().trim(),
                passwordHasher.hash(request.password()),
                request.role(),
                request.langCd(),
                actor.userCd()
        ));

        return AdminAccountResponse.from(adminUser);
    }

    @Transactional
    public AdminAccountResponse updateAdminUser(
            AdminPrincipal actor,
            String adminUserCd,
            AdminAccountUpdateRequest request
    ) {
        requireAccountManager(actor);
        requireAdminRole(actor, request.role());
        AdminUser adminUser = findAdminUser(adminUserCd);

        validateSelfProtection(actor, adminUser, request);
        validateLastSuperAdminProtection(adminUser, request.role(), request.useYn());
        validateLoginIdAvailable(request.loginId(), Optional.of(adminUserCd), Optional.empty());

        adminUser.update(
                request.adminUserNm().trim(),
                request.loginId().trim(),
                request.role(),
                request.langCd(),
                request.useYn(),
                actor.userCd()
        );

        if (request.password() != null && !request.password().isBlank()) {
            adminUser.changePassword(passwordHasher.hash(request.password()), actor.userCd());
        }

        return AdminAccountResponse.from(adminUser);
    }

    @Transactional
    public AdminAccountResponse deactivateAdminUser(AdminPrincipal actor, String adminUserCd) {
        requireAccountManager(actor);
        AdminUser adminUser = findAdminUser(adminUserCd);

        if (adminUser.getAdminUserCd().equals(actor.userCd())) {
            throw new ForbiddenException("You cannot deactivate your own account.");
        }
        validateLastSuperAdminProtection(adminUser, adminUser.getRole(), "N");

        adminUser.deactivate(actor.userCd());
        return AdminAccountResponse.from(adminUser);
    }

    public List<TeacherAccountResponse> findTeacherUsers(AdminPrincipal actor) {
        requireAccountManager(actor);

        return teacherUserRepository.findAll(Sort.by(Sort.Direction.ASC, "teacherUserNm"))
                .stream()
                .map(TeacherAccountResponse::from)
                .toList();
    }

    @Transactional
    public TeacherAccountResponse createTeacherUser(AdminPrincipal actor, TeacherAccountCreateRequest request) {
        requireAccountManager(actor);
        validateLoginIdAvailable(request.loginId(), Optional.empty(), Optional.empty());

        TeacherUser teacherUser = teacherUserRepository.save(TeacherUser.create(
                null,
                request.teacherUserNm().trim(),
                request.loginId().trim(),
                passwordHasher.hash(request.password()),
                request.langCd(),
                actor.userCd()
        ));

        return TeacherAccountResponse.from(teacherUser);
    }

    @Transactional
    public TeacherAccountResponse updateTeacherUser(
            AdminPrincipal actor,
            String teacherUserCd,
            TeacherAccountUpdateRequest request
    ) {
        requireAccountManager(actor);
        TeacherUser teacherUser = findTeacherUser(teacherUserCd);
        validateLoginIdAvailable(request.loginId(), Optional.empty(), Optional.of(teacherUserCd));

        teacherUser.update(
                request.teacherUserNm().trim(),
                request.loginId().trim(),
                request.langCd(),
                request.useYn(),
                actor.userCd()
        );

        if (request.password() != null && !request.password().isBlank()) {
            teacherUser.changePassword(passwordHasher.hash(request.password()), actor.userCd());
        }

        return TeacherAccountResponse.from(teacherUser);
    }

    @Transactional
    public TeacherAccountResponse deactivateTeacherUser(AdminPrincipal actor, String teacherUserCd) {
        requireAccountManager(actor);
        TeacherUser teacherUser = findTeacherUser(teacherUserCd);

        teacherUser.deactivate(actor.userCd());
        return TeacherAccountResponse.from(teacherUser);
    }

    private AdminUser findAdminUser(String adminUserCd) {
        return adminUserRepository.findById(adminUserCd)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found: " + adminUserCd));
    }

    private TeacherUser findTeacherUser(String teacherUserCd) {
        return teacherUserRepository.findById(teacherUserCd)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher user not found: " + teacherUserCd));
    }

    private void requireAccountManager(AdminPrincipal actor) {
        if (!actor.canManageAccounts()) {
            throw new ForbiddenException("This account cannot manage users.");
        }
    }

    private void requireAdminRole(AdminPrincipal actor, AdminRole requestedRole) {
        if (requestedRole == AdminRole.TEACHER) {
            throw new ConflictException("Teacher role must be managed from teacher users.");
        }
        if (requestedRole == AdminRole.SUPER_ADMIN && actor.role() != AdminRole.SUPER_ADMIN) {
            throw new ForbiddenException("Only a super administrator can create or modify super administrators.");
        }
    }

    private void validateSelfProtection(
            AdminPrincipal actor,
            AdminUser target,
            AdminAccountUpdateRequest request
    ) {
        if (!target.getAdminUserCd().equals(actor.userCd())) {
            return;
        }

        if (!target.getRole().equals(request.role()) || !"Y".equals(request.useYn())) {
            throw new ForbiddenException("You cannot change your own role or deactivate your own account.");
        }
    }

    private void validateLastSuperAdminProtection(AdminUser target, AdminRole nextRole, String nextUseYn) {
        if (target.getRole() != AdminRole.SUPER_ADMIN || !target.isActive()) {
            return;
        }

        boolean remainsActiveSuperAdmin = nextRole == AdminRole.SUPER_ADMIN && "Y".equals(nextUseYn);
        if (!remainsActiveSuperAdmin && adminUserRepository.countByRoleAndUseYn(AdminRole.SUPER_ADMIN, "Y") <= 1) {
            throw new ForbiddenException("At least one active super administrator is required.");
        }
    }

    private void validateLoginIdAvailable(
            String loginId,
            Optional<String> currentAdminUserCd,
            Optional<String> currentTeacherUserCd
    ) {
        String nextLoginId = loginId.trim();

        adminUserRepository.findByLoginId(nextLoginId)
                .filter(adminUser -> currentAdminUserCd
                        .map(currentCd -> !currentCd.equals(adminUser.getAdminUserCd()))
                        .orElse(true))
                .ifPresent(adminUser -> {
                    throw new ConflictException("Login ID already exists.");
                });

        teacherUserRepository.findByLoginId(nextLoginId)
                .filter(teacherUser -> currentTeacherUserCd
                        .map(currentCd -> !currentCd.equals(teacherUser.getTeacherUserCd()))
                        .orElse(true))
                .ifPresent(teacherUser -> {
                    throw new ConflictException("Login ID already exists.");
                });
    }
}
