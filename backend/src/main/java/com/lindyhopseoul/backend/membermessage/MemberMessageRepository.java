package com.lindyhopseoul.backend.membermessage;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberMessageRepository extends JpaRepository<MemberMessage, Long> {

    @EntityGraph(attributePaths = {"thread", "senderMember"})
    List<MemberMessage> findByThreadIdOrderByCreatedAtAscIdAsc(Long threadId);

    @EntityGraph(attributePaths = {"thread", "senderMember"})
    Optional<MemberMessage> findTopByThreadIdOrderByCreatedAtDescIdDesc(Long threadId);

    long countByThreadIdAndSenderType(Long threadId, MemberMessageSenderType senderType);

    long countByThreadIdAndSenderTypeAndCreatedAtAfter(
            Long threadId,
            MemberMessageSenderType senderType,
            Instant createdAt
    );
}
