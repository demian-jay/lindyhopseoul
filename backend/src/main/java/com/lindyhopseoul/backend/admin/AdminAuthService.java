package com.lindyhopseoul.backend.admin;

import com.lindyhopseoul.backend.exception.UnauthorizedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminAuthService {

    private final AdminUserRepository adminUserRepository;
    private final TeacherUserRepository teacherUserRepository;
    private final PasswordHasher passwordHasher;
    private final AdminSessionService adminSessionService;

    public AdminAuthService(
            AdminUserRepository adminUserRepository,
            TeacherUserRepository teacherUserRepository,
            PasswordHasher passwordHasher,
            AdminSessionService adminSessionService
    ) {
        this.adminUserRepository = adminUserRepository;
        this.teacherUserRepository = teacherUserRepository;
        this.passwordHasher = passwordHasher;
        this.adminSessionService = adminSessionService;
    }

    public AdminAuthResponse login(AdminLoginRequest request) {
        String loginId = request.loginId().trim();

        return adminUserRepository.findByLoginId(loginId)
                .map(adminUser -> authenticateAdmin(adminUser, request.password()))
                .or(() -> teacherUserRepository.findByLoginId(loginId)
                        .map(teacherUser -> authenticateTeacher(teacherUser, request.password())))
                .orElseThrow(() -> new UnauthorizedException("Login ID or password is invalid."));
    }

    private AdminAuthResponse authenticateAdmin(AdminUser adminUser, String password) {
        if (!passwordHasher.matches(password, adminUser.getLoginPwHash())) {
            throw new UnauthorizedException("Login ID or password is invalid.");
        }
        if (!adminUser.isActive()) {
            throw new UnauthorizedException("Account is inactive.");
        }

        return adminSessionService.createSession(AdminPrincipal.from(adminUser));
    }

    private AdminAuthResponse authenticateTeacher(TeacherUser teacherUser, String password) {
        if (!passwordHasher.matches(password, teacherUser.getLoginPwHash())) {
            throw new UnauthorizedException("Login ID or password is invalid.");
        }
        if (!teacherUser.isActive()) {
            throw new UnauthorizedException("Account is inactive.");
        }

        return adminSessionService.createSession(AdminPrincipal.from(teacherUser));
    }
}
