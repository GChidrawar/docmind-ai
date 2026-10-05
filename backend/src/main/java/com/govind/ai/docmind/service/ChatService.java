package com.govind.ai.docmind.service;

import com.govind.ai.docmind.dto.ChatRequestDto;
import com.govind.ai.docmind.dto.ChatResponseDto;
import com.govind.ai.docmind.model.User;
import reactor.core.publisher.Flux;

/**
 * Service interface for handling document-based chat operations.
 *
 * @author govind.chidrawar
 * @since 07-09-2026
 */
public interface ChatService {

    /** Answers using only the given user's documents. */
    ChatResponseDto askQuestion(ChatRequestDto request, User user);

    Flux<String> streamQuestionAnswer(ChatRequestDto requestDto, User user);
}
