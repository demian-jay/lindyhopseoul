package com.lindyhopseoul.backend.agora;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgoraGuestbookMessageRepository extends JpaRepository<AgoraGuestbookMessage, Long> {

    List<AgoraGuestbookMessage> findByVisibleTrueAndHiddenByAdminFalseAndExpiresAtAfterOrderByCreatedAtDescIdDesc(
            Instant now,
            Pageable pageable
    );

    List<AgoraGuestbookMessage> findAllByOrderByCreatedAtDescIdDesc();
}
