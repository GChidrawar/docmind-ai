package com.govind.ai.docmind.controller;

import com.govind.ai.docmind.dto.ApiResponse;
import com.govind.ai.docmind.dto.ChatRequestDto;
import com.govind.ai.docmind.dto.ChatResponseDto;
import com.govind.ai.docmind.model.User;
import com.govind.ai.docmind.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

/**
 * REST controller responsible for managing chat-related operations.
 *
 * @author govind.chidrawar
 * @since 07-09-2026
 */
@RestController
@AllArgsConstructor
@RequestMapping("/api/v1/chat")
@Tag(
        name = "Chat Management",
        description = "APIs for managing chat and conversation operations"
)
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/query")
    @Operation(summary = "Ask a question against all documents or a specific document with citations")
    public ResponseEntity<ApiResponse<ChatResponseDto>> askQuestion(@Valid @RequestBody ChatRequestDto requestDto, @AuthenticationPrincipal User user) {
        ChatResponseDto chatResponseDto = chatService.askQuestion(requestDto, user);
        return ResponseEntity.ok(ApiResponse.success(chatResponseDto));
    }

    @PostMapping(value = "/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Real-time Q&A answer stream via Server-Sent Events (SSE)")
    public Flux<String> streamQuestion(@Valid @RequestBody ChatRequestDto requestDto, @AuthenticationPrincipal User user) {
        return chatService.streamQuestionAnswer(requestDto, user);
    }
}
