package com.finsight.ai.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finsight.ai.dto.UserRegistrationDto;
import com.finsight.ai.entity.User;
import com.finsight.ai.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FirebaseAuthService firebaseAuthService;

    @Transactional
    public User createUser(UserRegistrationDto userDto) {
        // Check if user already exists by Firebase UID first (most reliable)
        Optional<User> existingUser = userRepository.findByFirebaseUid(userDto.getFirebaseUid());
        if (existingUser.isPresent()) {
            // User already exists, return the existing user instead of throwing error
            return existingUser.get();
        }

        // Check by email as well
        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new RuntimeException("User already exists with this email");
        }

        User user = new User(
            userDto.getFirebaseUid(),
            userDto.getEmail(),
            userDto.getFirstName(),
            userDto.getLastName()
        );
        
        user.setProfilePictureUrl(userDto.getProfilePictureUrl());
        user.setCurrency(userDto.getCurrency());

        try {
            return userRepository.save(user);
        } catch (Exception e) {
            // If save fails due to constraint violation, try to return existing user
            Optional<User> existingUserAfterError = userRepository.findByFirebaseUid(userDto.getFirebaseUid());
            if (existingUserAfterError.isPresent()) {
                return existingUserAfterError.get();
            }
            throw new RuntimeException("Failed to create user: " + e.getMessage(), e);
        }
    }

    public Optional<User> getUserByFirebaseUid(String firebaseUid) {
        return userRepository.findByFirebaseUid(firebaseUid);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User updateUser(String firebaseUid, User updatedUser) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
            .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFirstName(updatedUser.getFirstName());
        user.setLastName(updatedUser.getLastName());
        user.setProfilePictureUrl(updatedUser.getProfilePictureUrl());
        user.setDarkMode(updatedUser.getDarkMode());
        user.setCurrency(updatedUser.getCurrency());

        return userRepository.save(user);
    }

    public User getUserFromToken(String authToken) {
        String firebaseUid = firebaseAuthService.getUserIdFromToken(authToken);
        return userRepository.findByFirebaseUid(firebaseUid)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public void deleteUser(String firebaseUid) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
            .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
    }
}
