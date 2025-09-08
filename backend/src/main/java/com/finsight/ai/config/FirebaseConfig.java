package com.finsight.ai.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @Bean
    public FirebaseApp initializeFirebase() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            InputStream serviceAccount = getClass().getClassLoader().getResourceAsStream("firebase-service-account.json");
            
            if (serviceAccount == null) {
                logger.error("Firebase service account file not found: firebase-service-account.json");
                throw new RuntimeException("Firebase service account file not found. Please ensure firebase-service-account.json is in src/main/resources/");
            }

            logger.info("Initializing Firebase with service account...");
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();

            FirebaseApp app = FirebaseApp.initializeApp(options);
            logger.info("Firebase initialized successfully with project ID: {}", options.getProjectId());
            return app;
        }
        return FirebaseApp.getInstance();
    }
}
