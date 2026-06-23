package com.lindyhopseoul.backend.membermessage;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberMessageThreadRepository extends JpaRepository<MemberMessageThread, Long> {

    @EntityGraph(attributePaths = "member")
    Optional<MemberMessageThread> findByMemberId(Long memberId);

    @EntityGraph(attributePaths = "member")
    List<MemberMessageThread> findAllByOrderByLastMessageAtDescIdDesc();
}
