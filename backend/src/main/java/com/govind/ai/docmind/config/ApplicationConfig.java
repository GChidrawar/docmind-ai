package com.govind.ai.docmind.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.modelmapper.ModelMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * @author govind.chidrawar
 * @since 03-09-2026
 */
@Configuration
public class ApplicationConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    // swagger configuration
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(
                        new Info()
                                .title("DocMindAI — AI Document Intelligence & RAG APIs")
                                .description("REST API for DocMindAI: multi-format document ingestion, vector embeddings with PostgreSQL pgvector, and  hybrid conversational Q&A powered by Ollama")
                                .version("1.0.0")
                                .contact(new Contact()
                                        .name("CG Technologies")
                                        .email("support@cgtech.dev")
                                        .url("https://cgtech.dev")
                                )
                )
                // Adds the "Authorize" button; paste the access token from /auth/login (without "Bearer ")
                .components(new Components().addSecuritySchemes(BEARER_SCHEME,
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME));
    }

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder
                .defaultSystem("""
                            You are DocMind, an intelligent, versatile, and friendly AI document intelligence assistant.
                                Your Capabilities:
                                    1. Document-Grounded Q&A:
                                       When context from the user's uploaded documents is provided, use it
                                       as the primary source for answering questions. When available, cite
                                       the document name and relevant page number.
                                    2. General Knowledge & Conversation:
                                       For greetings, casual conversation, programming questions, mathematics,
                                       explanations, or general knowledge questions that are unrelated to the
                                       uploaded documents, respond naturally using your general knowledge.
                                    3. Context-Aware Responses:
                                       When a question relates to an uploaded document, prioritize the
                                       retrieved document context and avoid introducing unsupported facts.
                                       If the available context is insufficient, clearly state that the
                                       information could not be found in the provided documents.
                                    4. Tone & Format:
                                       Be clear, professional, and conversational. Structure responses using
                                       Markdown when appropriate, including headings, bullet points, numbered
                                       lists, bold text, and code blocks where they improve readability.
                        """
                )
                .build();
    }


    @Bean
    public ModelMapper modelMapper() {
        return new ModelMapper();
    }
}
