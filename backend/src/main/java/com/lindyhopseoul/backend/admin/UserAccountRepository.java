package com.lindyhopseoul.backend.admin;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, String> {

    Optional<UserAccount> findByLoginId(String loginId);

    long countDistinctByRoles_RoleCodeAndUseYn(AdminRole roleCode, String useYn);
}
