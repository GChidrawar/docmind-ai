package com.govind.ai.docmind.service.impl;

import com.govind.ai.docmind.config.AppProperties;
import com.govind.ai.docmind.dto.ChatRequestDto;
import com.govind.ai.docmind.dto.ChatResponseDto;
import com.govind.ai.docmind.dto.CitationDto;
import com.govind.ai.docmind.dto.DocumentResponseDto;
import com.govind.ai.docmind.service.ChatService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.Filter;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.*;
import java.util.stream.Collectors;

/**
 * @author govind.chidrawar
 * @since 09-09-2026
 */
@Service
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final VectorStore vectorStore;
    private final ChatClient chatClient;
    private final AppProperties appProperties;

    public ChatServiceImpl(VectorStore vectorStore, ChatClient chatClient, AppProperties appProperties) {
        this.vectorStore = vectorStore;
        this.chatClient = chatClient;
        this.appProperties = appProperties;
    }


    /**
     * Answers a user's question, optionally grounded in relevant document context
     * retrieved via vector similarity search.
     * */
    @Override
    public ChatResponseDto askQuestion(ChatRequestDto request) {
        long startTime = System.currentTimeMillis();

        // Retrieve relevant chunks of the document from vector store
        List<Document> similarDocuments = this.retrieveRelevantDocuments(request.question(), request.documentId(), request.topK(), request.minSimilarity());

        List<CitationDto> citationDtos = similarDocuments.stream().map(CitationDto::from).toList();

        String contextString = buildContextString(similarDocuments);

        String prompt = buildPrompt(request.question(), contextString);

        String answer = chatClient.prompt().user(prompt).call().content();

        long responseTime = System.currentTimeMillis() - startTime;
        log.info("Completed Q&A in {} ms with {} citations", responseTime, citationDtos.size());

        return ChatResponseDto.builder().answer(answer).conversationId(request.conversationId() != null ? request.conversationId() : UUID.randomUUID().toString()).citations(citationDtos).responseTimeMs(responseTime).build();
    }

    @Override
    public Flux<String> streamQuestionAnswer(ChatRequestDto requestDto) {
        return null;
    }

    private List<Document> retrieveRelevantDocuments(@NotEmpty(message = "Query can not be empty") String query, UUID documentId, Integer topK, Double similarityThreshold) {

        AppProperties.RagProperties ragProperties = appProperties.getRag();

        int effectiveTopK = (Objects.nonNull(topK) && topK > 0) ? topK : ragProperties.getTopK();
        double effectiveSimilarityThreshold = (Objects.nonNull(similarityThreshold)) ? similarityThreshold : ragProperties.getSimilarityThreshold();

        SearchRequest.Builder searchRequestBuilder = SearchRequest.builder().query(query).topK(effectiveTopK);

        if (effectiveSimilarityThreshold > 0.0) {
            searchRequestBuilder.similarityThreshold(effectiveSimilarityThreshold);
        }

        if (documentId != null) {
            log.info("Filtering from vector store for documentId {} :", documentId);
            FilterExpressionBuilder expressionBuilder = new FilterExpressionBuilder();
            Filter.Expression documentId1 = expressionBuilder.eq("documentId", documentId.toString()).build();
            searchRequestBuilder.filterExpression(documentId1);
        }

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
            return "";
        }

        return similarDocuments.stream().map(doc -> {
            String fileName = (String) doc.getMetadata().getOrDefault("fileName", "Unknown File");
            Object page = doc.getMetadata().getOrDefault("pageNumber", "N/A");
            return String.format("[Source: %s | Page: %s]\n%s", fileName, page, escapePercent(doc.getText()));
        }).collect(Collectors.joining("\n\n---\n\n"));

    }


    private String buildPrompt(String question, String contextText) {

        if (contextText != null && !contextText.isBlank()) {
            return """
                           Document Context:
                           ---------------------
                           %s
                           ---------------------
                           User Message / Question: %s
                           Instructions:
                           - If the user's question relates to the document context above, prioritize answering using that context and reference key sections.
                           - If the user is asking a general question, greeting, or discussing topics beyond the document context, respond helpfully and conversationally using your general knowledge while weaving in relevant document context if applicable
                    
                    """.formatted(escapePercent(contextText), escapePercent(question));
        } else {
            return """
                       User Message / Question:
                       %s
                       Instructions:
                          - Respond helpfully, accurately, and conversationally to the user's message using your broad knowledge base.
                    
                    """.formatted(escapePercent(question));
        }


    }
    // Escapes literal '%' so it isn't misread as a format specifier by .formatted()
    private String escapePercent(String text) {
        return text == null ? "" : text.replace("%", "%%");
    }

}
