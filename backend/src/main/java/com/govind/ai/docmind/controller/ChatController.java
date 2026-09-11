package com.govind.ai.docmind.controller;

import com.govind.ai.docmind.dto.ApiResponse;
import com.govind.ai.docmind.dto.ChatRequestDto;
import com.govind.ai.docmind.dto.ChatResponseDto;
import com.govind.ai.docmind.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<ApiResponse<ChatResponseDto>> askQuestion(@Valid @RequestBody ChatRequestDto requestDto) {
        ChatResponseDto chatResponseDto = chatService.askQuestion(requestDto);
        return ResponseEntity.ok(ApiResponse.success(chatResponseDto));
    }
}
