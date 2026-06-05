package com.lindyhopseoul.backend.memo;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/memos")
public class MemoController {

    private final MemoService memoService;

    public MemoController(MemoService memoService) {
        this.memoService = memoService;
    }

    @GetMapping
    public List<MemoResponse> findAll() {
        return memoService.findAll();
    }

    @GetMapping("/{id}")
    public MemoResponse findById(@PathVariable Long id) {
        return memoService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MemoResponse create(@Valid @RequestBody MemoCreateRequest request) {
        return memoService.create(request);
    }

    @PutMapping("/{id}")
    public MemoResponse update(@PathVariable Long id, @Valid @RequestBody MemoUpdateRequest request) {
        return memoService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        memoService.delete(id);
    }
}
