package com.finsight.ai.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class FirebaseAuthService {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseAuthService.class);

    public FirebaseToken verifyToken(String idToken) {
        try {
            logger.debug("Verifying Firebase token...");
            FirebaseToken token = FirebaseAuth.getInstance().verifyIdToken(idToken);
            logger.debug("Token verified successfully for user: {}", token.getUid());
            return token;
        } catch (Exception e) {
            logger.error("Firebase token verification failed: {}", e.getMessage());
            throw new RuntimeException("Invalid Firebase token: " + e.getMessage(), e);
        }
    }

    public String getUserIdFromToken(String idToken) {
        FirebaseToken token = verifyToken(idToken);
        return token.getUid();
    }

    public String getEmailFromToken(String idToken) {
        FirebaseToken token = verifyToken(idToken);
        return token.getEmail();
    }
}
