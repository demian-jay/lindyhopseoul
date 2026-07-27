package com.lindyhopseoul.backend.admin;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface AdminSessionRepository extends JpaRepository<AdminSession, String> {

    int deleteByExpiresAtBefore(Instant cutoff);

    /**
     * Slides a session's expiry. An explicit update rather than dirty checking so
     * that reading a principal — which every admin request does, and which almost
     * never needs to write — does not have to run inside a transaction.
     */
    @Modifying
    @Transactional
    @Query("update AdminSession s set s.lastSeenAt = :now, s.expiresAt = :expiresAt where s.tokenHash = :tokenHash")
    int extend(
            @Param("tokenHash") String tokenHash,
            @Param("now") Instant now,
            @Param("expiresAt") Instant expiresAt
    );
}
