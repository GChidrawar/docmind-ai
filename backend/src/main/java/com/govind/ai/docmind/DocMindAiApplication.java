package com.govind.ai.docmind;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jdbc.repository.config.EnableJdbcAuditing;

import java.util.TimeZone;

@SpringBootApplication
@EnableJdbcAuditing
public class DocMindAiApplication {

	public static void main(String[] args) {
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
		SpringApplication.run(DocMindAiApplication.class, args);
	}

}
