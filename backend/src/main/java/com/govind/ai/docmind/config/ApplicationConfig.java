package com.govind.ai.docmind.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
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
                );
    }

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder
                .defaultSystem("""
                            You are DocMind, an intelligent, versatile, and friendly AI document intelligence assistant.
                            Your Capabilities:
                            1. Document-Grounded Q&A: When context from the user's uploaded documents is provided, prioritize and base your answer directly on that context, citing document names and page numbers when available.
                            2. General Knowledge & Conversation: If the user engages in general conversation (greetings, chit-chat, programming questions, math, explanations, summaries, or general knowledge) that may not be present in the uploaded documents, answer helpfully, accurately, and naturally.
                            3. Hybrid Synthesis: If the document context partially covers a topic, synthesize the document facts with your broader knowledge to give a complete, high-quality answer.
                            4. Tone & Format: Always be warm, professional, clear, and structured. Use Markdown (headings, bullet points, bold text, code blocks) to make responses easy to read.

                        """
                )
                .build();
    }


    @Bean
    public ModelMapper modelMapper() {
        return new ModelMapper();
    }
}
