package com.govind.ai.docmind.config;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.ollama.OllamaEmbeddingModel;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiEmbeddingModel;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * @author govind.chidrawar
 * @since 01-09-2026
 */
@Configuration
public class AiProviderConfig {

	@Bean
	@Primary
	@ConditionalOnProperty(name = "app.ai.provider", havingValue = "ollama", matchIfMissing = true)
	public ChatModel primaryChatModel(OllamaChatModel ollamaChatModel) {
		return ollamaChatModel;
	}

	@Bean
	@Primary
	@ConditionalOnProperty(name = "app.ai.provider", havingValue = "openai")
	public ChatModel primaryChatModelOpenAi(OpenAiChatModel openAiChatModel) {
		return openAiChatModel;
	}

	// --- Embedding ---

	@Bean
	@Primary
	@ConditionalOnProperty(name = "app.ai.provider", havingValue = "ollama", matchIfMissing = true)
	public EmbeddingModel primaryEmbeddingModel(OllamaEmbeddingModel ollamaEmbeddingModel) {
		return ollamaEmbeddingModel;
	}

	@Bean
	@Primary
	@ConditionalOnProperty(name = "app.ai.provider", havingValue = "openai")
	public EmbeddingModel primaryEmbeddingModelOpenAi(OpenAiEmbeddingModel openAiEmbeddingModel) {
		return openAiEmbeddingModel;
	}

}
