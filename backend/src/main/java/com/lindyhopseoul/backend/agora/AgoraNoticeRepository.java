package com.lindyhopseoul.backend.agora;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AgoraNoticeRepository extends JpaRepository<AgoraNotice, Long> {

    List<AgoraNotice> findByVisibleTrueOrderByCreatedAtDescIdDesc();

    List<AgoraNotice> findAllByOrderByCreatedAtDescIdDesc();
}
