package com.govind.ai.docmind.service.impl;

import com.govind.ai.docmind.config.AppProperties;
import com.govind.ai.docmind.dto.*;
import com.govind.ai.docmind.exception.ResourceNotFoundException;
import com.govind.ai.docmind.model.Conversation;
import com.govind.ai.docmind.model.User;
import com.govind.ai.docmind.repository.ConversationRepo;
import com.govind.ai.docmind.service.ChatService;
import jakarta.validation.constraints.NotEmpty;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.Filter;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * @author govind.chidrawar
 * @since 09-09-2026
 */
@Service
@Slf4j
public class ChatServiceImpl implements ChatService {

    private static final String NOT_FOUND_ANSWER = "I couldn't find this in your documents.";

    private final VectorStore vectorStore;
    private final ChatClient chatClient;
    private final AppProperties appProperties;
    private final ConversationRepo conversationRepo;

    public ChatServiceImpl(VectorStore vectorStore, ChatClient chatClient, AppProperties appProperties, ConversationRepo conversationRepo) {
        this.vectorStore = vectorStore;
        this.chatClient = chatClient;
        this.appProperties = appProperties;
        this.conversationRepo = conversationRepo;
    }


    /**
     * Answers a user's question, optionally grounded in relevant document context
     * retrieved via vector similarity search.
     * */
    @Override
    public ChatResponseDto askQuestion(ChatRequestDto request, User user) {
        long startTime = System.currentTimeMillis();

        String conversationId = request.conversationId() != null ? request.conversationId() : UUID.randomUUID().toString();
        getOrCreateConversation(conversationId, request.question(), user);

        // Retrieve relevant chunks of the document from vector store
        List<Document> similarDocuments = this.retrieveRelevantDocuments(request.question(), request.documentId(), request.topK(), request.minSimilarity(), user);

//        if (similarDocuments.isEmpty()) {
//            log.info("No relevant chunks found for query: '{}'", request.question());
//            return ChatResponseDto.builder().answer(NOT_FOUND_ANSWER).conversationId(request.conversationId() != null ? request.conversationId() : UUID.randomUUID().toString()).citations(List.of()).responseTimeMs(System.currentTimeMillis() - startTime).build();
//        }

        List<CitationDto> citationDtos = similarDocuments.stream().map(CitationDto::from).toList();

        String contextString = buildContextString(similarDocuments);

        long chatClientStart = System.currentTimeMillis();
        log.info("ChatClient request started | conversationId: {}", conversationId);

        String answer = chatClient.prompt()
                .system(s -> s.param("docContext", contextString))
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                .user(request.question())
                .call()
                .content();

        log.info("ChatClient request completed | conversationId: {} | duration: {} ms", conversationId, System.currentTimeMillis() - chatClientStart);

        long responseTime = System.currentTimeMillis() - startTime;
        log.info("Completed Q&A in {} ms with {} citations", responseTime, citationDtos.size());

        return ChatResponseDto.builder().answer(answer).conversationId(conversationId).citations(citationDtos).responseTimeMs(responseTime).build();
    }

    @Override
    public Flux<String> streamQuestionAnswer(ChatRequestDto requestDto, User user) {
        String conversationId = requestDto.conversationId() != null ? requestDto.conversationId() : UUID.randomUUID().toString();

        Conversation conversation = getOrCreateConversation(conversationId, requestDto.question(), user);

        log.info("Streaming query: '{}'| conversationId: {}", requestDto.question(),  conversation.getId());

        List<Document> similarDocuments = this.retrieveRelevantDocuments(requestDto.question(), requestDto.documentId(), requestDto.topK(), requestDto.minSimilarity(), user);
//        if (similarDocuments.isEmpty()) {
//            log.info("No relevant chunks found for query: '{}'", requestDto.question());
//            return Flux.just(NOT_FOUND_ANSWER, "[DONE]");
//        }

        String contextString = this.buildContextString(similarDocuments);

        return chatClient.prompt()
                .system(s -> s.param("docContext", contextString))
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                .user(requestDto.question())
                .stream()
                .content()
                .concatWith(Flux.just("[DONE]"));
    }


    private Conversation getOrCreateConversation(String conversationId, String question, User user) {
        return conversationRepo.findByIdAndUser(conversationId, user).orElseGet(() -> {
            if (conversationRepo.existsById(conversationId)) {
                throw new ResourceNotFoundException("Conversation Id not available: " + conversationId);
            }
            String title = question.length() > 50 ? question.substring(0, 50) : question;
            return conversationRepo.save(Conversation.builder().id(conversationId).title(title).user(user).build());
        });
    }

    @Override
    public SearchResultDto searchSimilarChunks(SearchRequestDto request, User user) {
        List<Document> matchedDocs = retrieveRelevantDocuments(request.query(), request.documentId(), request.topK(), request.similaritySearch(), user);
        List<CitationDto> citations = null;
        if(!matchedDocs.isEmpty()) {
            citations = matchedDocs.stream().map(CitationDto::from).toList();
        }
        return SearchResultDto.builder().query(request.query()).matches(citations).totalMatches(citations.size()).build();
    }

    private List<Document> retrieveRelevantDocuments(@NotEmpty(message = "Query can not be empty") String query, UUID documentId, Integer topK, Double similarityThreshold, User user) {

        AppProperties.RagProperties ragProperties = appProperties.getRag();

        int effectiveTopK = (Objects.nonNull(topK) && topK > 0) ? topK : ragProperties.getTopK();
        double effectiveSimilarityThreshold = (Objects.nonNull(similarityThreshold)) ? similarityThreshold : ragProperties.getSimilarityThreshold();

        SearchRequest.Builder searchRequestBuilder = SearchRequest.builder().query(query).topK(effectiveTopK);

        if (effectiveSimilarityThreshold > 0.0) {
            searchRequestBuilder.similarityThreshold(effectiveSimilarityThreshold);
        }

        // Always restrict the search to the caller's own chunks; an optional documentId narrows it further
        String userId = user.getId().toString();
        FilterExpressionBuilder expressionBuilder = new FilterExpressionBuilder();
        Filter.Expression filter;
        if (documentId != null) {
            log.info("Filtering from vector store for documentId: {}", documentId);
            filter = expressionBuilder.and(
                    expressionBuilder.eq("userId", userId),
                    expressionBuilder.eq("documentId", documentId.toString())).build();
        } else {
            filter = expressionBuilder.eq("userId", userId).build();
        }
        searchRequestBuilder.filterExpression(filter);

        try {
            List<Document> documents = vectorStore.similaritySearch(searchRequestBuilder.build());
            log.info("Retrieved {} chunks for query: '{}' (scoped documentId: {})", documents.size(), query, documentId);
            return documents;
        } catch (Exception e) {
            log.error("Similarity search failed for query: '{}'", query, e);
            return Collections.emptyList();
        }

    }


    /**
     * Builds a formatted context string from retrieved document chunks,
     * each tagged with its source file and page number for traceability.
     * */
    private String buildContextString(List<Document> similarDocuments) {
        if (similarDocuments == null || similarDocuments.isEmpty()) {
            return "N/A";
        }

        return similarDocuments.stream().map(doc -> {
            String fileName = (String) doc.getMetadata().getOrDefault("fileName", "Unknown File");
            Object page = doc.getMetadata().getOrDefault("pageNumber", "N/A");
            return String.format("[Source: %s | Page: %s]\n%s", fileName, page, doc.getText());
        }).collect(Collectors.joining("\n\n---\n\n"));

    }


    // Only called when relevant chunks were found; the no-context case is answered by NOT_FOUND_ANSWER
    private String buildPrompt(String question, String contextText) {
        return """
                Document Context:
                ---------------------
                """
                + contextText
                + """

                ---------------------
                User Message / Question:"""
                + question
                + """

                Instructions:
                - Answer using only the document context above and reference key sections.
                - If the context does not contain the answer, say that it was not found in the user's documents.
                """;
    }

}
