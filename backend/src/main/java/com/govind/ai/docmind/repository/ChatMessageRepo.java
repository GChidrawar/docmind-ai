package com.govind.ai.docmind.repository;

import com.govind.ai.docmind.model.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * @author govind.chidrawar
 * @since 16-10-2026
 */
public interface ChatMessageRepo extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByConversation_IdOrderByCreatedAtAsc(String conversationId);

    @Query(value = "SELECT c FROM ChatMessage c WHERE c.conversation.id =: conversationId ORDER BY c.createdAt DESC")
    List<ChatMessage> findLastNMessages(@Param("conversationId") String conversationId, Pageable pageable);

    void deleteByConversation_Id(String conversationId);
}
