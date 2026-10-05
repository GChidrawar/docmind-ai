package com.govind.ai.docmind.repository;

import com.govind.ai.docmind.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * @author govind.chidrawar
 * @since 30-09-2026
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUserName(String userName);

    boolean existsByUserName(String userName);

    boolean existsByEmail(String email);

}
