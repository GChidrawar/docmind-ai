package com.govind.ai.docmind.service;

import com.govind.ai.docmind.dto.ChatRequestDto;
import com.govind.ai.docmind.dto.ChatResponseDto;
import reactor.core.publisher.Flux;

/**
 * Service interface for handling document-based chat operations.
 *
 * @author govind.chidrawar
 * @since 07-09-2026
 */
public interface ChatService {

    ChatResponseDto askQuestion(ChatRequestDto request);

    Flux<String> streamQuestionAnswer(ChatRequestDto requestDto);
}
