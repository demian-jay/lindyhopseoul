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

    /**
     * Read-write despite the mostly-read shape: signing in now inserts a session
     * row, and a read-only transaction would leave that insert unflushed.
     */
    @Transactional
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

    /**
     * True when {@code loginId} is free for the actor to take — either unused or
     * already their own. Mirrors the uniqueness check in
     * {@link AdminAccountService#validateLoginIdAvailable}.
     */
    public boolean isLoginIdAvailable(AdminPrincipal actor, String loginId) {
        String nextLoginId = clean(loginId);
        if (nextLoginId.isEmpty()) {
            return false;
        }
        return userAccountRepository.findByLoginId(nextLoginId)
                .map(user -> user.getUserId().equals(actor.userCd()))
                .orElse(true);
    }

    /**
     * The account holder changing their own login ID. Uniqueness is re-checked
     * here even though the UI checks availability as you type, because the field
     * could be free at check time and taken by save time.
     */
    @Transactional
    public void changeOwnLoginId(AdminPrincipal actor, AdminLoginIdChangeRequest request) {
        UserAccount user = userAccountRepository.findById(actor.userCd())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + actor.userCd()));

        String nextLoginId = clean(request.newLoginId());
        userAccountRepository.findByLoginId(nextLoginId)
                .filter(existing -> !existing.getUserId().equals(user.getUserId()))
                .ifPresent(existing -> {
                    throw new ConflictException("Login ID already exists.");
                });

        user.changeLoginId(nextLoginId);
    }

    /**
     * The account holder choosing their own admin UI language.
     */
    @Transactional
    public AdminPrincipal changeOwnLanguage(AdminPrincipal actor, AdminLanguageChangeRequest request) {
        UserAccount user = userAccountRepository.findById(actor.userCd())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + actor.userCd()));

        user.changeLanguage(request.langCd());
        return AdminPrincipal.from(user);
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }
}
