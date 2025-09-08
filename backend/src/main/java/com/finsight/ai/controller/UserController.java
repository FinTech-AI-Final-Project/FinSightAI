package com.finsight.ai.controller;

import com.finsight.ai.dto.UserRegistrationDto;
import com.finsight.ai.dto.UserProfileUpdateDto;
import com.finsight.ai.dto.ProfilePictureUpdateDto;
import com.finsight.ai.entity.User;
import com.finsight.ai.service.FirebaseAuthService;
import com.finsight.ai.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private FirebaseAuthService firebaseAuthService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRegistrationDto userDto) {
        try {
            User user = userService.createUser(userDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(user);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/auth-test")
    public ResponseEntity<?> testAuth(@RequestHeader("Authorization") String authToken) {
        try {
            String token = authToken.replace("Bearer ", "");
            String firebaseUid = firebaseAuthService.getUserIdFromToken(token);
            String email = firebaseAuthService.getEmailFromToken(token);
            return ResponseEntity.ok(Map.of(
                "firebaseUid", firebaseUid,
                "email", email,
                "message", "Firebase authentication working correctly"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "error", "Authentication failed",
                "details", e.getMessage()
            ));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile(@RequestHeader("Authorization") String authToken) {
        try {
            String token = authToken.replace("Bearer ", "");
            User user = userService.getUserFromToken(token);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @GetMapping("/{firebaseUid}")
    public ResponseEntity<?> getUserByFirebaseUid(@PathVariable String firebaseUid) {
        Optional<User> user = userService.getUserByFirebaseUid(firebaseUid);
        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(@RequestHeader("Authorization") String authToken,
                                             @Valid @RequestBody UserProfileUpdateDto profileUpdateDto) {
        try {
            String token = authToken.replace("Bearer ", "");
            User currentUser = userService.getUserFromToken(token);
            
            // Update only the fields that are provided
            currentUser.setFirstName(profileUpdateDto.getFirstName());
            currentUser.setLastName(profileUpdateDto.getLastName());
            currentUser.setEmail(profileUpdateDto.getEmail());
            
            if (profileUpdateDto.getProfilePictureUrl() != null) {
                currentUser.setProfilePictureUrl(profileUpdateDto.getProfilePictureUrl());
            }
            if (profileUpdateDto.getDarkMode() != null) {
                currentUser.setDarkMode(profileUpdateDto.getDarkMode());
            }
            if (profileUpdateDto.getCurrency() != null) {
                currentUser.setCurrency(profileUpdateDto.getCurrency());
            }
            
            User updatedUser = userService.updateUser(currentUser.getFirebaseUid(), currentUser);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/profile/picture")
    public ResponseEntity<?> updateProfilePicture(@RequestHeader("Authorization") String authToken,
                                                 @Valid @RequestBody ProfilePictureUpdateDto pictureUpdateDto) {
        try {
            String token = authToken.replace("Bearer ", "");
            User currentUser = userService.getUserFromToken(token);
            
            // Update profile picture
            currentUser.setProfilePictureUrl(pictureUpdateDto.getProfilePicture());
            
            User updatedUser = userService.updateUser(currentUser.getFirebaseUid(), currentUser);
            return ResponseEntity.ok(Map.of(
                "message", "Profile picture updated successfully",
                "profilePictureUrl", updatedUser.getProfilePictureUrl()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "error", "Failed to update profile picture",
                "details", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/profile")
    public ResponseEntity<?> deleteUser(@RequestHeader("Authorization") String authToken) {
        try {
            String token = authToken.replace("Bearer ", "");
            User user = userService.getUserFromToken(token);
            userService.deleteUser(user.getFirebaseUid());
            return ResponseEntity.ok("User deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
