package com.finsight.ai.service;

import com.finsight.ai.dto.UserRegistrationDto;
import com.finsight.ai.entity.User;
import com.finsight.ai.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FirebaseAuthService firebaseAuthService;

    public User createUser(UserRegistrationDto userDto) {
        if (userRepository.existsByFirebaseUid(userDto.getFirebaseUid())) {
            throw new RuntimeException("User already exists with this Firebase UID");
        }

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

        return userRepository.save(user);
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
