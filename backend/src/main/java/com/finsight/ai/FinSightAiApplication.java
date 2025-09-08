package com.finsight.ai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class FinSightAiApplication {

	public static void main(String[] args) {
		SpringApplication.run(FinSightAiApplication.class, args);
	}

}
