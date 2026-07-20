package com.lindyhopseoul.backend.admin;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.lindyhopseoul.backend.exception.UnauthorizedException;
import org.springframework.stereotype.Service;

@Service
public class AdminSessionService {

    private static final Duration SESSION_TTL = Duration.ofHours(12);
    private static final int TOKEN_BYTES = 32;
    private static final String BEARER_PREFIX = "Bearer ";

    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, StoredSession> sessions = new ConcurrentHashMap<>();

    public AdminAuthResponse createSession(AdminPrincipal principal) {
        String token = generateToken();
        sessions.put(token, new StoredSession(principal, Instant.now().plus(SESSION_TTL)));
        return AdminAuthResponse.from(token, principal);
    }

    public AdminPrincipal requirePrincipal(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        StoredSession session = sessions.get(token);

        if (session == null) {
            throw new UnauthorizedException("Login is required.");
        }

        if (session.expiresAt().isBefore(Instant.now())) {
            sessions.remove(token);
            throw new UnauthorizedException("Session expired.");
        }

        return session.principal();
    }

    public void clearSession(String authorizationHeader) {
        String token = extractToken(authorizationHeader);
        sessions.remove(token);
    }

    /**
     * Sessions hold a snapshot of the principal, so anything that changes the
     * underlying account has to push the new one in. Without this, clearing the
     * pending password change would not take effect until the session expired.
     */
    public void refreshPrincipal(String authorizationHeader, AdminPrincipal principal) {
        String token = extractToken(authorizationHeader);
        sessions.computeIfPresent(token, (key, session) ->
                new StoredSession(principal, session.expiresAt()));
    }

    private String generateToken() {
        byte[] token = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(token);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(token);
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

    private record StoredSession(
            AdminPrincipal principal,
            Instant expiresAt
    ) {
    }
}
