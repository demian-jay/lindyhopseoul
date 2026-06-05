package com.lindyhopseoul.backend.memo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import com.lindyhopseoul.backend.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MemoServiceTest {

    @Mock
    private MemoRepository memoRepository;

    @InjectMocks
    private MemoService memoService;

    @Test
    void createStoresMemoAndReturnsResponse() {
        when(memoRepository.save(any(Memo.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MemoResponse response = memoService.create(new MemoCreateRequest("Practice note", "Remember the swing-out timing."));

        assertThat(response.title()).isEqualTo("Practice note");
        assertThat(response.content()).isEqualTo("Remember the swing-out timing.");
        verify(memoRepository).save(any(Memo.class));
    }

    @Test
    void updateThrowsWhenMemoDoesNotExist() {
        when(memoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> memoService.update(
                99L,
                new MemoUpdateRequest("Missing memo", "This should not be saved.")
        )).isInstanceOf(ResourceNotFoundException.class);
    }
}
