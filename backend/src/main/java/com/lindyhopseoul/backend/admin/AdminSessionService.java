package com.lindyhopseoul.backend.admin;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

import com.lindyhopseoul.backend.exception.UnauthorizedException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

@Service
public class AdminSessionService {

    /**
     * How long a signed-in admin stays signed in without using the app. Sliding:
     * every authenticated request pushes it out again, so an admin who opens the
     * installed app now and then is never signed out. Long on purpose — the admin
     * UI is installed as a phone app, where the old 12-hour window meant signing
     * in again most days.
     */
    private static final Duration SESSION_TTL = Duration.ofDays(90);

    /**
     * Sliding the expiry costs a write, so only do it once a session has gone this
     * long unused. Otherwise every admin request would update its row.
     */
    private static final Duration EXTEND_AFTER = Duration.ofHours(1);

    private static final String PRINCIPAL_ATTRIBUTE = AdminSessionService.class.getName() + ".PRINCIPAL";
    private static final int TOKEN_BYTES = 32;
    private static final String BEARER_PREFIX = "Bearer ";

    private final SecureRandom secureRandom = new SecureRandom();
    private final AdminSessionRepository adminSessionRepository;
    private final UserAccountRepository userAccountRepository;
    /**
     * Programmatic rather than {@code @Transactional} because the only caller is a
     * private method reached from within this bean, which a proxy would not
     * intercept. Without it each repository call below opens a transaction of its
     * own, which costs more round trips than the reads themselves.
     */
    private final TransactionTemplate transactionTemplate;

    public AdminSessionService(
            AdminSessionRepository adminSessionRepository,
            UserAccountRepository userAccountRepository,
            PlatformTransactionManager transactionManager
    ) {
        this.adminSessionRepository = adminSessionRepository;
        this.userAccountRepository = userAccountRepository;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @Transactional
    public AdminAuthResponse createSession(AdminPrincipal principal) {
        String token = generateToken();
        adminSessionRepository.save(
                AdminSession.create(hashToken(token), principal.userCd(), Instant.now(), SESSION_TTL));
        return AdminAuthResponse.from(token, principal);
    }

    /**
     * Resolved once per request and remembered for the rest of it. Almost every
     * admin call asks twice — {@link AdminApiAuthInterceptor} before the
     * controller does — and that would otherwise be two trips to the database for
     * an answer that cannot change in between.
     */
    public AdminPrincipal requirePrincipal(String authorizationHeader) {
        RequestAttributes request = RequestContextHolder.getRequestAttributes();
        if (request == null) {
            return loadPrincipal(authorizationHeader);
        }

        Object cached = request.getAttribute(PRINCIPAL_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
        // Keyed by the header it was resolved from, so a caller passing a different
        // token part-way through a request is answered about that token rather than
        // handed whoever was resolved first.
        if (cached instanceof ResolvedPrincipal resolved && resolved.matches(authorizationHeader)) {
            return resolved.principal();
        }

        AdminPrincipal principal = loadPrincipal(authorizationHeader);
        request.setAttribute(
                PRINCIPAL_ATTRIBUTE,
                new ResolvedPrincipal(authorizationHeader, principal),
                RequestAttributes.SCOPE_REQUEST
        );
        return principal;
    }

    private record ResolvedPrincipal(String authorizationHeader, AdminPrincipal principal) {

        boolean matches(String otherHeader) {
            return authorizationHeader.equals(otherHeader);
        }
    }

    /**
     * The principal is rebuilt from the account rather than kept as a snapshot
     * taken at sign-in. With sessions lasting months a snapshot would mean a
     * revoked role or a deactivated account staying usable for months; reading it
     * live also means nothing has to remember to push changes back into a session.
     *
     * <p>Both reads and the occasional expiry slide share one transaction, so an
     * admin request costs a single trip's worth of transaction overhead rather
     * than one per repository call.
     */
    private AdminPrincipal loadPrincipal(String authorizationHeader) {
        String tokenHash = hashToken(extractToken(authorizationHeader));
        AdminPrincipal principal = transactionTemplate.execute(status -> resolve(tokenHash, Instant.now()));
        if (principal == null) {
            throw new UnauthorizedException("Login is required.");
        }
        return principal;
    }

    /**
     * Null when the token does not identify a usable admin — unknown, expired, or
     * an account that has since been deactivated.
     *
     * <p>Returns rather than throws because it runs inside a transaction that
     * deletes the row of an expired token: throwing would roll that delete back
     * and leave it for the nightly purge. The caller turns null into the one
     * message every failure gets, which also avoids telling a caller whether the
     * token it presented was ever real.
     */
    private AdminPrincipal resolve(String tokenHash, Instant now) {
        AdminSession session = adminSessionRepository.findById(tokenHash).orElse(null);
        if (session == null) {
            return null;
        }
        if (session.isExpired(now)) {
            adminSessionRepository.deleteById(tokenHash);
            return null;
        }

        AdminPrincipal principal = userAccountRepository.findById(session.getUserId())
                .filter(UserAccount::isActive)
                .map(AdminPrincipal::from)
                .orElse(null);
        if (principal != null && session.isDueForExtension(now, EXTEND_AFTER)) {
            adminSessionRepository.extend(tokenHash, now, now.plus(SESSION_TTL));
        }
        return principal;
    }

    @Transactional
    public void clearSession(String authorizationHeader) {
        adminSessionRepository.deleteById(hashToken(extractToken(authorizationHeader)));
    }

    /**
     * Expired rows are rejected on sight, so this is housekeeping rather than a
     * control — without it the table would only ever grow.
     */
    @Scheduled(cron = "0 30 4 * * *", zone = "Asia/Seoul")
    @Transactional
    public void purgeExpiredSessions() {
        adminSessionRepository.deleteByExpiresAtBefore(Instant.now());
    }

    private String generateToken() {
        byte[] token = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(token);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(token);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is required but unavailable.", exception);
        }
    }

    private String extractToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            throw new UnauthorizedException("Login is required.");
        }

        String token = authorizationHeader.substring(BEARER_PREFIX.length()).trim();
        if (token.isBlank()) {
            throw new UnauthorizedException("Login is required.");
        }

        return token;
    }
}
