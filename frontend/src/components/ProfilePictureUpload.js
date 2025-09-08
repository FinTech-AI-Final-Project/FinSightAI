import React, { useState } from 'react';
import {
  Box,
  Avatar,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Tooltip
} from '@mui/material';
import {
  PhotoCamera,
  Delete,
  Edit
} from '@mui/icons-material';
import { uploadProfilePicture, validateImage, resizeImage } from '../services/fileUpload';

const ProfilePictureUpload = ({ 
  currentPicture, 
  onPictureChange, 
  size = 120,
  editable = true 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError('');
    setLoading(true);

    try {
      // Validate the image
      const validation = validateImage(file);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        setLoading(false);
        return;
      }

      // Resize the image for better performance
      const resizedFile = await resizeImage(file, 300, 300);
      
      // Convert to base64
      const uploadResult = await uploadProfilePicture(resizedFile);
      
      // Show preview
      setPreviewImage(uploadResult.url);
      setPreviewDialog(true);
      
    } catch (err) {
      setError(err.message || 'Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUpload = () => {
    if (previewImage && onPictureChange) {
      onPictureChange(previewImage);
    }
    setPreviewDialog(false);
    setPreviewImage(null);
  };

  const handleRemovePicture = () => {
    if (onPictureChange) {
      onPictureChange(null);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const words = name.split(' ');
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
      <Box position="relative" display="inline-block">
        <Tooltip title={editable ? "Click to change profile picture" : ""}>
          <Avatar
            src={currentPicture}
            onClick={editable ? () => document.getElementById('profile-picture-upload').click() : undefined}
            sx={{ 
              width: size, 
              height: size,
              fontSize: size / 3,
              bgcolor: currentPicture ? 'transparent' : 'primary.main',
              cursor: editable ? 'pointer' : 'default',
              transition: 'transform 0.2s',
              '&:hover': editable ? {
                transform: 'scale(1.05)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              } : {}
            }}
          >
            {!currentPicture && getInitials('User')}
          </Avatar>
        </Tooltip>
        
        {editable && (
          <>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="profile-picture-upload"
              type="file"
              onChange={handleFileSelect}
              disabled={loading}
            />
            <label htmlFor="profile-picture-upload">
              <IconButton
                component="span"
                disabled={loading}
                sx={{
                  position: 'absolute',
                  bottom: -5,
                  right: -5,
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  width: 36,
                  height: 36,
                }}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <PhotoCamera fontSize="small" />
                )}
              </IconButton>
            </label>
          </>
        )}
      </Box>

      {editable && currentPicture && (
        <Button
          startIcon={<Delete />}
          onClick={handleRemovePicture}
          size="small"
          color="error"
          variant="outlined"
        >
          Remove Picture
        </Button>
      )}

      {error && (
        <Alert severity="error" sx={{ width: '100%', maxWidth: 300 }}>
          {error}
        </Alert>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)}>
        <DialogTitle>Preview Profile Picture</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <Avatar
              src={previewImage}
              sx={{ width: 200, height: 200 }}
            />
            <Typography variant="body2" color="textSecondary">
              This will be your new profile picture
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmUpload} 
            variant="contained"
            startIcon={<Edit />}
          >
            Use This Picture
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePictureUpload;
