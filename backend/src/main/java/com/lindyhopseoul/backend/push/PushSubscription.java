package com.lindyhopseoul.backend.push;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * One browser/device push subscription for a user. A user can hold several
 * (phone, laptop, …); the endpoint is the unique handle the push service gave
 * that device, so it is what we upsert and delete on.
 */
@Entity
@Table(
        name = "PUSH_SUBSCRIPTION",
        uniqueConstraints = @UniqueConstraint(name = "UK_PUSH_SUBSCRIPTION_ENDPOINT", columnNames = "ENDPOINT")
)
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "USER_ID", nullable = false, length = 36)
    private String userId;

    @Column(name = "ENDPOINT", nullable = false, length = 512)
    private String endpoint;

    @Column(name = "P256DH", nullable = false, length = 255)
    private String p256dh;

    @Column(name = "AUTH", nullable = false, length = 255)
    private String auth;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private Instant createdAt;

    protected PushSubscription() {
    }

    public PushSubscription(String userId, String endpoint, String p256dh, String auth) {
        this.userId = userId;
        this.endpoint = endpoint;
        this.p256dh = p256dh;
        this.auth = auth;
    }

    /** The device kept its endpoint but re-subscribed, or moved to another user. */
    public void refresh(String userId, String p256dh, String auth) {
        this.userId = userId;
        this.p256dh = p256dh;
        this.auth = auth;
    }

    @PrePersist
    void prePersist() {
        createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getUserId() {
        return userId;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public String getP256dh() {
        return p256dh;
    }

    public String getAuth() {
        return auth;
    }
}
