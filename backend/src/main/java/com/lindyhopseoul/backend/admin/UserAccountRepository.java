package com.lindyhopseoul.backend.admin;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, String> {

    Optional<UserAccount> findByLoginId(String loginId);

    /**
     * The Google sign-in path: a member id off the member session, answered with
     * the admin account it was paired with, if any.
     */
    Optional<UserAccount> findByMemberId(Long memberId);

    List<UserAccount> findByMemberIdIsNotNull();

    List<UserAccount> findDistinctByRoles_RoleCodeInAndUseYnOrderByNameAsc(
            Collection<AdminRole> roleCodes,
            String useYn
    );

    long countDistinctByRoles_RoleCodeAndUseYn(AdminRole roleCode, String useYn);
}
