package com.lindyhopseoul.backend.push;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserNotificationSettingRepository extends JpaRepository<UserNotificationSetting, String> {

    Optional<UserNotificationSetting> findByUserId(String userId);
}
