package com.lindyhopseoul.backend.push;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    Optional<PushSubscription> findByEndpoint(String endpoint);

    List<PushSubscription> findByUserId(String userId);

    List<PushSubscription> findByUserIdIn(List<String> userIds);

    void deleteByEndpoint(String endpoint);
}
