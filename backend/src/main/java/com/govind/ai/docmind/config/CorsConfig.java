package com.govind.ai.docmind.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * @author govind.chidrawar
 * @since 21-10-2026
 */
@Configuration
@RequiredArgsConstructor
public class CorsConfig implements WebMvcConfigurer {


    private final AppProperties appProperties;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] allowedOrigins= appProperties.getCors().getAllowedOrigins().split(",");
        String[] allowedMethods= appProperties.getCors().getAllowedMethods().split(",");
        String[] allowedHeaders= appProperties.getCors().getAllowedHeaders().split(",");


        registry.addMapping("/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods(allowedMethods)
                .allowedHeaders(allowedHeaders)
                .allowCredentials(true)
                .maxAge(3600);
    }
}
