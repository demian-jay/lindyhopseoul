package com.lindyhopseoul.backend.memo;

import java.util.List;

import com.lindyhopseoul.backend.exception.ResourceNotFoundException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MemoService {

    private final MemoRepository memoRepository;

    public MemoService(MemoRepository memoRepository) {
        this.memoRepository = memoRepository;
    }

    public List<MemoResponse> findAll() {
        return memoRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(MemoResponse::from)
                .toList();
    }

    public MemoResponse findById(Long id) {
        return MemoResponse.from(findMemo(id));
    }

    @Transactional
    public MemoResponse create(MemoCreateRequest request) {
        Memo memo = memoRepository.save(new Memo(request.title(), request.content()));
        return MemoResponse.from(memo);
    }

    @Transactional
    public MemoResponse update(Long id, MemoUpdateRequest request) {
        Memo memo = findMemo(id);
        memo.update(request.title(), request.content());
        return MemoResponse.from(memo);
    }

    @Transactional
    public void delete(Long id) {
        Memo memo = findMemo(id);
        memoRepository.delete(memo);
    }

    private Memo findMemo(Long id) {
        return memoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Memo not found: " + id));
    }
}
