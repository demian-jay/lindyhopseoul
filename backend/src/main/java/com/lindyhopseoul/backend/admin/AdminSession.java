package com.lindyhopseoul.backend.admin;

import java.time.Duration;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/**
 * A signed-in admin, kept in the database so a deploy or a restart does not sign
 * everyone out.
 *
 * <p>The row is keyed by a hash of the bearer token rather than the token, so a
 * dump of this table does not hand out live sessions. A plain SHA-256 is enough
 * here — unlike a password, the token is 256 bits from a {@link
 * java.security.SecureRandom}, so there is nothing to guess and no reason to pay
 * for a slow KDF on every request.
 *
 * <p>Only the account id is stored. Roles, language and password state are read
 * off the account on each request, so revoking a role or deactivating an account
 * takes effect immediately instead of waiting out the session.
 */
@Entity
@Table(
        name = "ADMIN_SESSION",
        indexes = @Index(name = "IX_ADMIN_SESSION_EXPIRES_AT", columnList = "EXPIRES_AT")
)
public class AdminSession {

    @Id
    @Column(name = "TOKEN_HASH", nullable = false, length = 64)
    private String tokenHash;

    @Column(name = "USER_ID", nullable = false, length = 36)
    private String userId;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "LAST_SEEN_AT", nullable = false)
    private Instant lastSeenAt;

    @Column(name = "EXPIRES_AT", nullable = false)
    private Instant expiresAt;

    protected AdminSession() {
    }

    static AdminSession create(String tokenHash, String userId, Instant now, Duration ttl) {
        AdminSession session = new AdminSession();
        session.tokenHash = tokenHash;
        session.userId = userId;
        session.createdAt = now;
        session.lastSeenAt = now;
        session.expiresAt = now.plus(ttl);
        return session;
    }

    boolean isExpired(Instant now) {
        return expiresAt.isBefore(now);
    }

    /**
     * Whether the expiry is worth sliding forward yet. The floor is what keeps a
     * sliding session from costing a write on every single admin request; the
     * cost of skipping one is that the expiry trails real use by up to
     * {@code minInterval}, against a window measured in months.
     */
    boolean isDueForExtension(Instant now, Duration minInterval) {
        return !lastSeenAt.plus(minInterval).isAfter(now);
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public String getUserId() {
        return userId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getLastSeenAt() {
        return lastSeenAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }
}
