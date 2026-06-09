package com.lindyhopseoul.backend.admin;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminUserRepository extends JpaRepository<AdminUser, String> {

    Optional<AdminUser> findByLoginId(String loginId);

    long countByRoleAndUseYn(AdminRole role, String useYn);
}
