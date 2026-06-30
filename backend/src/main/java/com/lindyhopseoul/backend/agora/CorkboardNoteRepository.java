package com.lindyhopseoul.backend.agora;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CorkboardNoteRepository extends JpaRepository<CorkboardNote, Long> {

    List<CorkboardNote> findByBoardInOrderByBoard_PageNoAscSlotIndexAscIdAsc(Collection<Corkboard> boards);

    List<CorkboardNote> findByBoardOrderBySlotIndexAscIdAsc(Corkboard board);
}
