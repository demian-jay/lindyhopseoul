package com.lindyhopseoul.backend.admin;

import com.lindyhopseoul.backend.exception.ConflictException;
import com.lindyhopseoul.backend.exception.ResourceNotFoundException;
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

    /**
     * The account holder changing their own password. This is the only write an
     * account with a pending change is allowed to make, so it is what clears the
     * block: see {@link AdminPasswordChangeInterceptor}.
     */
    @Transactional
    public AdminPrincipal changeOwnPassword(AdminPrincipal actor, AdminPasswordChangeRequest request) {
        UserAccount user = userAccountRepository.findById(actor.userCd())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + actor.userCd()));

        // Re-checked even though the caller holds a valid session, so a walked-up-to
        // unlocked screen cannot be used to take the account over.
        if (!passwordHasher.matches(request.currentPassword(), user.getPassword())) {
            throw new UnauthorizedException("Current password is invalid.");
        }
        if (passwordHasher.matches(request.newPassword(), user.getPassword())) {
            throw new ConflictException("The new password must differ from the current one.");
        }

        user.changePassword(passwordHasher.hash(request.newPassword()));
        return AdminPrincipal.from(user);
    }
}
