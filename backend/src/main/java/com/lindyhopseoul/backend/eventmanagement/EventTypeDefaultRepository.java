package com.lindyhopseoul.backend.eventmanagement;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EventTypeDefaultRepository extends JpaRepository<EventTypeDefault, EventType> {

    List<EventTypeDefault> findAllByOrderByDisplayOrderAsc();
}
