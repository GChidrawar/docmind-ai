package com.govind.ai.docmind.service.impl;

import com.govind.ai.docmind.constants.MessageType;
import com.govind.ai.docmind.model.ChatMessage;
import com.govind.ai.docmind.model.Conversation;
import com.govind.ai.docmind.model.User;
import com.govind.ai.docmind.repository.ChatMessageRepo;
import com.govind.ai.docmind.repository.ConversationRepo;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

/**
 * @author govind.chidrawar
 * @since 16-10-2026
 */
@Service
@Slf4j
@AllArgsConstructor
public class JpaChatMemory implements ChatMemory {

    private final ConversationRepo conversationRepo;
    private  final ChatMessageRepo chatMessageRepo;

    @Override
    @Transactional
    public void add(@NonNull String conversationId, @NonNull List<Message> messages) {

        Conversation conversation = conversationRepo.findById(conversationId)
                .orElseGet(() -> {
                    User user = (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
                    log.warn("Conversation {} not found when adding messages. Starting new conversation", conversationId);
                    return conversationRepo.save(Conversation.builder().id(conversationId).user(user).title("New Conversation").build());
                });

        List<ChatMessage> chatMessages = messages.stream()
                .map(msg -> {
                    MessageType type = switch (msg.getMessageType()) {
                        case ASSISTANT -> MessageType.ASSISTANT;
                        case SYSTEM -> MessageType.SYSTEM;
                        default -> MessageType.USER;
                    };

                    return ChatMessage.builder()
                            .conversation(conversation)
                            .messageType(type)
                            .content(msg.getText())
                            .build();
                }).toList();

        chatMessageRepo.saveAll(chatMessages);
    }

    @Override
    @Transactional(readOnly = true)
    public @NonNull List<Message> get(@NonNull String conversationId) {

        List<ChatMessage> lastNMessages = chatMessageRepo.findLastNMessages(conversationId, Pageable.ofSize(10));

        if (lastNMessages.isEmpty()) {
            return Collections.emptyList();
        }


        return lastNMessages.stream()
                .sorted(Comparator.comparing(ChatMessage::getCreatedAt))
                .<Message>map(chatMessage ->
                        switch (chatMessage.getMessageType()) {
                            case USER -> new UserMessage(chatMessage.getContent());
                            case ASSISTANT -> new AssistantMessage(chatMessage.getContent());
                            case SYSTEM -> new SystemMessage(chatMessage.getContent());
                        })
                .toList();
    }

    @Override
    @Transactional
    public void clear(@NonNull String conversationId) {
        chatMessageRepo.deleteByConversation_Id(conversationId);
    }

}
