package com.lindyhopseoul.backend.eventmanagement;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageTemplateRepository extends JpaRepository<MessageTemplate, Long> {

    List<MessageTemplate> findAllByOrderByUpdatedAtDescIdDesc();
}
