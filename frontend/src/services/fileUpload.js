// Simple file upload service that converts images to base64
// In production, you'd want to use a service like Firebase Storage, AWS S3, etc.

export const uploadProfilePicture = async (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select an image file'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('File size must be less than 5MB'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const base64String = e.target.result;
      resolve({
        url: base64String,
        fileName: file.name,
        fileSize: file.size
      });
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

export const resizeImage = (file, maxWidth = 300, maxHeight = 300) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const validateImage = (file) => {
  const errors = [];
  
  if (!file.type.startsWith('image/')) {
    errors.push('Please select an image file');
  }
  
  if (file.size > 5 * 1024 * 1024) {
    errors.push('File size must be less than 5MB');
  }
  
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('Only JPEG, PNG, and GIF files are allowed');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
