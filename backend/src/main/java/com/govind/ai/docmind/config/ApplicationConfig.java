package com.govind.ai.docmind.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.modelmapper.ModelMapper;
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
    public ModelMapper modelMapper() {
        return new ModelMapper();
    }
}
