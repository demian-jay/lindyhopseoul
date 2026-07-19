package com.lindyhopseoul.backend.admin;

import java.util.Collection;
import java.util.Comparator;
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

    private final UserAccountRepository userAccountRepository;
    private final TeacherUserRepository teacherUserRepository;
    private final PasswordHasher passwordHasher;

    public AdminAccountService(
            UserAccountRepository userAccountRepository,
            TeacherUserRepository teacherUserRepository,
            PasswordHasher passwordHasher
    ) {
        this.userAccountRepository = userAccountRepository;
        this.teacherUserRepository = teacherUserRepository;
        this.passwordHasher = passwordHasher;
    }

    public List<AdminAccountResponse> findAdminUsers(AdminPrincipal actor) {
        requireAccountManager(actor);

        return userAccountRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                .stream()
                .map(AdminAccountResponse::from)
                .toList();
    }

    @Transactional
    public AdminAccountResponse createAdminUser(AdminPrincipal actor, AdminAccountCreateRequest request) {
        requireSuperAdmin(actor);
        List<AdminRole> roles = normalizeRoles(request.roles(), request.role(), AdminRole.STAFF);
        requireRoleChangeAllowed(actor, roles);
        validateLoginIdAvailable(request.loginId(), Optional.empty());

        UserAccount user = userAccountRepository.save(UserAccount.create(
                null,
                clean(request.adminUserNm()),
                clean(request.loginId()),
                null,
                passwordHasher.hash(request.password()),
                normalizeLanguage(request.langCd()),
                roles
        ));
        syncTeacherProfile(user, roles.contains(AdminRole.TEACHER) && user.isActive(), actor.userCd());

        return AdminAccountResponse.from(user);
    }

    @Transactional
    public AdminAccountResponse updateAdminUser(
            AdminPrincipal actor,
            String userId,
            AdminAccountUpdateRequest request
    ) {
        requireAccountManager(actor);
        UserAccount user = findUser(userId);
        // Non-super admins (STAFF) may edit only their own account; everyone else's
        // account — including any password reset — is super-admin only.
        if (!user.getUserId().equals(actor.userCd()) && !actor.hasRole(AdminRole.SUPER_ADMIN)) {
            throw new ForbiddenException("Only a super administrator can edit other accounts.");
        }
        List<AdminRole> roles = normalizeRoles(request.roles(), request.role(), AdminRole.STAFF);
        requireRoleChangeAllowed(actor, user.getRoleCodes(), roles);
        validateSelfProtection(actor, user, roles, request.useYn());
        validateLastSuperAdminProtection(user, roles, request.useYn());
        validateLoginIdAvailable(request.loginId(), Optional.of(user.getUserId()));

        user.update(
                clean(request.adminUserNm()),
                clean(request.loginId()),
                user.getEmail(),
                normalizeLanguage(request.langCd()),
                request.useYn()
        );
        user.replaceRoles(roles);

        if (request.password() != null && !request.password().isBlank()) {
            user.changePassword(passwordHasher.hash(request.password()));
        }
        syncTeacherProfile(user, roles.contains(AdminRole.TEACHER) && user.isActive(), actor.userCd());

        return AdminAccountResponse.from(user);
    }

    @Transactional
    public AdminAccountResponse deactivateAdminUser(AdminPrincipal actor, String userId) {
        requireSuperAdmin(actor);
        UserAccount user = findUser(userId);

        if (user.getUserId().equals(actor.userCd())) {
            throw new ForbiddenException("You cannot deactivate your own account.");
        }
        validateLastSuperAdminProtection(user, user.getRoleCodes(), "N");

        user.deactivate();
        syncTeacherProfile(user, false, actor.userCd());
        return AdminAccountResponse.from(user);
    }

    public List<TeacherAccountResponse> findTeacherUsers(AdminPrincipal actor) {
        requireAccountManager(actor);

        return teacherUserRepository.findTeacherRoleProfiles()
                .stream()
                .map(TeacherAccountResponse::from)
                .toList();
    }

    @Transactional
    public TeacherAccountResponse createTeacherUser(AdminPrincipal actor, TeacherAccountCreateRequest request) {
        requireAccountManager(actor);
        UserAccount user = resolveTeacherAccountForCreate(request);
        ensureRole(user, AdminRole.TEACHER);

        Optional<TeacherUser> existingProfile = teacherUserRepository
                .findFirstByUserAccount_UserIdOrderByTeacherUserNmAsc(user.getUserId());
        if (existingProfile.isPresent()) {
            TeacherUser teacherUser = existingProfile.get();
            teacherUser.updateProfile(clean(request.teacherUserNm()), user, "Y", actor.userCd());
            return TeacherAccountResponse.from(teacherUser);
        }

        TeacherUser teacherUser = teacherUserRepository.save(TeacherUser.createProfile(
                null,
                clean(request.teacherUserNm()),
                user,
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
        UserAccount user = resolveTeacherAccountForUpdate(teacherUser, request);
        ensureRole(user, AdminRole.TEACHER);
        validateTeacherProfileLinkAvailable(user, teacherUser);

        teacherUser.updateProfile(clean(request.teacherUserNm()), user, request.useYn(), actor.userCd());
        if (request.password() != null && !request.password().isBlank()) {
            user.changePassword(passwordHasher.hash(request.password()));
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

    private UserAccount resolveTeacherAccountForCreate(TeacherAccountCreateRequest request) {
        String requestedUserId = cleanNullable(request.userId());
        if (requestedUserId != null) {
            return findUser(requestedUserId);
        }

        String loginId = cleanNullable(request.loginId());
        if (loginId == null) {
            throw new ConflictException("Login ID is required when a teacher is not linked to an existing user.");
        }

        Optional<UserAccount> existingUser = userAccountRepository.findByLoginId(loginId);
        if (existingUser.isPresent()) {
            return existingUser.get();
        }
        if (request.password() == null || request.password().isBlank()) {
            throw new ConflictException("Password is required when creating a new user account.");
        }

        return userAccountRepository.save(UserAccount.create(
                null,
                clean(request.teacherUserNm()),
                loginId,
                null,
                passwordHasher.hash(request.password()),
                normalizeLanguage(request.langCd()),
                List.of(AdminRole.TEACHER)
        ));
    }

    private UserAccount resolveTeacherAccountForUpdate(TeacherUser teacherUser, TeacherAccountUpdateRequest request) {
        String requestedUserId = cleanNullable(request.userId());
        if (requestedUserId != null) {
            return findUser(requestedUserId);
        }

        String loginId = cleanNullable(request.loginId());
        if (loginId != null) {
            Optional<UserAccount> existingUser = userAccountRepository.findByLoginId(loginId);
            if (existingUser.isPresent()
                    && (teacherUser.getUserAccount() == null
                    || !existingUser.get().getUserId().equals(teacherUser.getUserAccount().getUserId()))) {
                return existingUser.get();
            }
        }

        UserAccount currentUser = teacherUser.getUserAccount();
        if (currentUser != null) {
            if (loginId != null) {
                validateLoginIdAvailable(loginId, Optional.of(currentUser.getUserId()));
                currentUser.update(
                        clean(request.teacherUserNm()),
                        loginId,
                        currentUser.getEmail(),
                        normalizeLanguage(request.langCd()),
                        currentUser.getUseYn()
                );
            }
            return currentUser;
        }

        if (loginId == null || request.password() == null || request.password().isBlank()) {
            throw new ConflictException("Login ID and password are required when linking a legacy teacher profile.");
        }
        return userAccountRepository.save(UserAccount.create(
                null,
                clean(request.teacherUserNm()),
                loginId,
                null,
                passwordHasher.hash(request.password()),
                normalizeLanguage(request.langCd()),
                List.of(AdminRole.TEACHER)
        ));
    }

    private void validateTeacherProfileLinkAvailable(UserAccount user, TeacherUser currentTeacherUser) {
        teacherUserRepository.findFirstByUserAccount_UserIdOrderByTeacherUserNmAsc(user.getUserId())
                .filter(existing -> !existing.getTeacherUserCd().equals(currentTeacherUser.getTeacherUserCd()))
                .ifPresent(existing -> {
                    throw new ConflictException("This user is already linked to another teacher profile.");
                });
    }

    private UserAccount findUser(String userId) {
        return userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private TeacherUser findTeacherUser(String teacherUserCd) {
        return teacherUserRepository.findById(teacherUserCd)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher profile not found: " + teacherUserCd));
    }

    private void requireAccountManager(AdminPrincipal actor) {
        if (!actor.canManageAccounts()) {
            throw new ForbiddenException("This account cannot manage users.");
        }
    }

    private void requireSuperAdmin(AdminPrincipal actor) {
        if (!actor.hasRole(AdminRole.SUPER_ADMIN)) {
            throw new ForbiddenException("Only a super administrator can perform this action.");
        }
    }

    private void requireRoleChangeAllowed(AdminPrincipal actor, List<AdminRole> nextRoles) {
        requireRoleChangeAllowed(actor, List.of(), nextRoles);
    }

    private void requireRoleChangeAllowed(
            AdminPrincipal actor,
            List<AdminRole> currentRoles,
            List<AdminRole> nextRoles
    ) {
        boolean touchesSuperAdmin = nextRoles.contains(AdminRole.SUPER_ADMIN)
                || currentRoles.contains(AdminRole.SUPER_ADMIN);
        if (touchesSuperAdmin && !actor.hasRole(AdminRole.SUPER_ADMIN)) {
            throw new ForbiddenException("Only a super administrator can create or modify super administrators.");
        }
    }

    private void validateSelfProtection(
            AdminPrincipal actor,
            UserAccount target,
            List<AdminRole> nextRoles,
            String nextUseYn
    ) {
        if (!target.getUserId().equals(actor.userCd())) {
            return;
        }

        if (!sameRoles(target.getRoleCodes(), nextRoles) || !"Y".equals(nextUseYn)) {
            throw new ForbiddenException("You cannot change your own roles or deactivate your own account.");
        }
    }

    private void validateLastSuperAdminProtection(UserAccount target, List<AdminRole> nextRoles, String nextUseYn) {
        if (!target.hasRole(AdminRole.SUPER_ADMIN) || !target.isActive()) {
            return;
        }

        boolean remainsActiveSuperAdmin = nextRoles.contains(AdminRole.SUPER_ADMIN) && "Y".equals(nextUseYn);
        if (!remainsActiveSuperAdmin
                && userAccountRepository.countDistinctByRoles_RoleCodeAndUseYn(AdminRole.SUPER_ADMIN, "Y") <= 1) {
            throw new ForbiddenException("At least one active super administrator is required.");
        }
    }

    private void validateLoginIdAvailable(String loginId, Optional<String> currentUserId) {
        String nextLoginId = clean(loginId);

        userAccountRepository.findByLoginId(nextLoginId)
                .filter(user -> currentUserId
                        .map(currentId -> !currentId.equals(user.getUserId()))
                        .orElse(true))
                .ifPresent(user -> {
                    throw new ConflictException("Login ID already exists.");
                });
    }

    private void ensureRole(UserAccount user, AdminRole role) {
        if (!user.hasRole(role)) {
            user.addRole(role);
            userAccountRepository.save(user);
        }
    }

    private void syncTeacherProfile(UserAccount user, boolean shouldBeActive, String actorCd) {
        Optional<TeacherUser> existingProfile = teacherUserRepository
                .findFirstByUserAccount_UserIdOrderByTeacherUserNmAsc(user.getUserId());
        if (existingProfile.isPresent()) {
            existingProfile.get().updateProfile(user.getName(), user, shouldBeActive ? "Y" : "N", actorCd);
            return;
        }

        if (shouldBeActive) {
            teacherUserRepository.save(TeacherUser.createProfile(
                    null,
                    user.getName(),
                    user,
                    actorCd
            ));
        }
    }

    private List<AdminRole> normalizeRoles(Collection<AdminRole> roles, AdminRole fallbackRole, AdminRole defaultRole) {
        Collection<AdminRole> source = roles == null || roles.isEmpty()
                ? (fallbackRole == null ? List.of() : List.of(fallbackRole))
                : roles;
        List<AdminRole> normalized = source
                .stream()
                .filter(role -> role != null)
                .distinct()
                .sorted(Comparator.comparingInt(this::rolePriority))
                .toList();
        return normalized.isEmpty() ? List.of(defaultRole) : normalized;
    }

    private boolean sameRoles(List<AdminRole> left, List<AdminRole> right) {
        return normalizeRoles(left, null, AdminRole.MEMBER).equals(normalizeRoles(right, null, AdminRole.MEMBER));
    }

    private AdminLanguage normalizeLanguage(AdminLanguage langCd) {
        return langCd == null ? AdminLanguage.Kor : langCd;
    }

    private int rolePriority(AdminRole role) {
        return switch (role) {
            case SUPER_ADMIN -> 0;
            case STAFF -> 1;
            case TEACHER -> 2;
            case MEMBER -> 3;
        };
    }

    private String clean(String value) {
        return value.trim();
    }

    private String cleanNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
