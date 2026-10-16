package com.govind.ai.docmind.repository;

import com.govind.ai.docmind.model.Conversation;
import com.govind.ai.docmind.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * @author govind.chidrawar
 * @since 16-10-2026
 */
@Repository
public interface ConversationRepo extends JpaRepository<Conversation, String> {

    List<Conversation> findByUserOrderByUpdatedAtDesc(User user);

    Optional<Conversation> findByIdAndUser(String id, User user);

    void deleteByIdAndUser(String id, User user);

}
