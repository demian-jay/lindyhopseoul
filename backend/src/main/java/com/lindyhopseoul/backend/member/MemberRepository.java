package com.lindyhopseoul.backend.member;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByProviderAndProviderId(MemberProvider provider, String providerId);

    @Query("""
            select member
            from Member member
            where member.role = com.lindyhopseoul.backend.member.MemberRole.USER
              and member.status in :statuses
              and (
                :keyword is null
                or lower(member.displayName) like :keyword
                or lower(member.nickname) like :keyword
                or lower(member.email) like :keyword
              )
              and (:name is null or lower(member.displayName) like :name)
              and (:nickname is null or lower(member.nickname) like :nickname)
              and (:email is null or lower(member.email) like :email)
              and (:preferredLanguage is null or member.preferredLanguage = :preferredLanguage)
            order by member.createdAt desc, member.id desc
            """)
    List<Member> findAdminMembers(
            @Param("keyword") String keyword,
            @Param("name") String name,
            @Param("nickname") String nickname,
            @Param("email") String email,
            @Param("statuses") Collection<MemberStatus> statuses,
            @Param("preferredLanguage") MemberPreferredLanguage preferredLanguage
    );
}
