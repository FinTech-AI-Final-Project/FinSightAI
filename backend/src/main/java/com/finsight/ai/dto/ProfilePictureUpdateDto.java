package com.finsight.ai.dto;

import jakarta.validation.constraints.NotBlank;

public class ProfilePictureUpdateDto {
    @NotBlank(message = "Profile picture data is required")
    private String profilePicture;

    public ProfilePictureUpdateDto() {}

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }
}
