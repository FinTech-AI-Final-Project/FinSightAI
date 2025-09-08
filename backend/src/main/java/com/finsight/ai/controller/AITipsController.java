package com.finsight.ai.controller;

import com.finsight.ai.entity.User;
import com.finsight.ai.service.AITipsService;
import com.finsight.ai.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ai-tips")
@CrossOrigin(origins = "*")
public class AITipsController {

    @Autowired
    private AITipsService aiTipsService;

    @Autowired
    private UserService userService;

    @GetMapping("/personalized")
    public ResponseEntity<?> getPersonalizedTip(@RequestHeader("Authorization") String authToken) {
        try {
            String token = authToken.replace("Bearer ", "");
            User user = userService.getUserFromToken(token);
            
            String tip = aiTipsService.generatePersonalizedTip(user);
            return ResponseEntity.ok(Map.of("tip", tip));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @GetMapping("/multiple")
    public ResponseEntity<?> getMultipleTips(@RequestHeader("Authorization") String authToken) {
        try {
            String token = authToken.replace("Bearer ", "");
            User user = userService.getUserFromToken(token);
            
            List<String> tips = aiTipsService.getMultipleTips(user);
            return ResponseEntity.ok(Map.of("tips", tips));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @GetMapping("/daily")
    public ResponseEntity<?> getDailyTip(@RequestHeader(value = "Authorization", required = false) String authToken,
                                       @RequestParam(required = false) String currency,
                                       @RequestParam(required = false) String country) {
        try {
            if (authToken != null && !authToken.isEmpty()) {
                // Return personalized tip for authenticated user
                String token = authToken.replace("Bearer ", "");
                User user = userService.getUserFromToken(token);
                String tip = aiTipsService.generatePersonalizedTip(user);
                return ResponseEntity.ok(Map.of("tip", tip, "personalized", true));
            } else {
                // Return generic tip for unauthenticated users
                String tip = aiTipsService.getDailyTip();
                return ResponseEntity.ok(Map.of("tip", tip, "personalized", false));
            }
        } catch (RuntimeException e) {
            // Fallback to generic tip if auth fails
            String tip = aiTipsService.getDailyTip();
            return ResponseEntity.ok(Map.of("tip", tip, "personalized", false));
        }
    }
}
