package com.govind.ai.docmind.repository;

import com.govind.ai.docmind.model.DocumentMetadata;
import com.govind.ai.docmind.model.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * @author govind.chidrawar
 * @since 04-09-2026
 */
@Repository
public interface DocumentMetadataRepo extends JpaRepository<DocumentMetadata, UUID> {

    /**
     * Finds all documents with the given processing status.
     *
     * @param status the status to filter by (e.g. UPLOADING, PROCESSING, INDEXED, FAILED)
     * @return list of documents matching the given status; empty list if none found
     */
    List<DocumentMetadata> findByStatus(DocumentStatus status);

    /**
     * Fetches all documents ordered by creation time, most recent first.
     *
     * @return list of all documents sorted by {@code createdAt} descending
     */
    List<DocumentMetadata> findAllByOrderByCreatedAtDesc();

    @Query("select d.id from DocumentMetadata d")
    List<UUID> findAllIds();

    Optional<DocumentMetadata> findByIdAndUserId(UUID id, Long userId);

    List<DocumentMetadata> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("select d.id from DocumentMetadata d where d.user.id = :userId")
    List<UUID> findIdsByUserId(@Param("userId") Long userId);

    void deleteAllByUserId(Long userId);
}