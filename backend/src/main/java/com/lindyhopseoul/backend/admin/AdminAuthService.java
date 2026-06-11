package com.lindyhopseoul.backend.admin;

import com.lindyhopseoul.backend.exception.UnauthorizedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminAuthService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordHasher passwordHasher;
    private final AdminSessionService adminSessionService;

    public AdminAuthService(
            UserAccountRepository userAccountRepository,
            PasswordHasher passwordHasher,
            AdminSessionService adminSessionService
    ) {
        this.userAccountRepository = userAccountRepository;
        this.passwordHasher = passwordHasher;
        this.adminSessionService = adminSessionService;
    }

    public AdminAuthResponse login(AdminLoginRequest request) {
        String loginId = request.loginId().trim();

        return userAccountRepository.findByLoginId(loginId)
                .map(user -> authenticate(user, request.password()))
                .orElseThrow(() -> new UnauthorizedException("Login ID or password is invalid."));
    }

    private AdminAuthResponse authenticate(UserAccount user, String password) {
        if (!passwordHasher.matches(password, user.getPassword())) {
            throw new UnauthorizedException("Login ID or password is invalid.");
        }
        if (!user.isActive()) {
            throw new UnauthorizedException("Account is inactive.");
        }

        return adminSessionService.createSession(AdminPrincipal.from(user));
    }
}
