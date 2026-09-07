package com.govind.ai.docmind.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
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


}
