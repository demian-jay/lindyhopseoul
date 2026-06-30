package com.lindyhopseoul.backend.agora;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CorkboardRepository extends JpaRepository<Corkboard, Long> {

    List<Corkboard> findByPeriodKeyOrderByPageNoAsc(String periodKey);

    boolean existsByPeriodKey(String periodKey);

    Optional<Corkboard> findTopByPeriodKeyOrderByPageNoDesc(String periodKey);

    List<Corkboard> findByStatus(CorkboardStatus status);

    List<Corkboard> findAllByOrderByPeriodStartDescPageNoAsc();
}
