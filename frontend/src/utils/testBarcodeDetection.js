import fastBarcodeDetectorService from '../services/fastBarcodeDetector';

/**
 * Test barcode detection with a sample image
 * This can be used for debugging the barcode detection functionality
 */
export const testBarcodeDetection = async () => {
  console.log('🧪 Testing barcode detection...');
  
  try {
    // Create a simple test barcode image (data URL)
    const testBarcodeDataUrl = createTestBarcodeImage();
    
    console.log('🧪 Created test barcode image');
    
    // Test the detection
    const result = await fastBarcodeDetectorService.detectBarcodeFromImage(testBarcodeDataUrl);
    
    console.log('🧪 Detection result:', result);
    
    return {
      success: true,
      testResult: result,
      message: result.success ? 
        `Barcode detection working! Detected: ${result.barcode}` : 
        `Detection failed: ${result.error}`
    };
    
  } catch (error) {
    console.error('🧪 Test failed:', error);
    return {
      success: false,
      error: error.message,
      message: `Test failed: ${error.message}`
    };
  }
};

/**
 * Create a simple test barcode image as data URL
 * This creates a basic pattern that should be detectable
 */
function createTestBarcodeImage() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size
  canvas.width = 300;
  canvas.height = 100;
  
  // Fill with white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw simple barcode pattern (vertical lines)
  ctx.fillStyle = 'black';
  
  // Simple barcode pattern - alternating thick and thin lines
  const pattern = [3, 1, 1, 1, 3, 1, 1, 1, 3, 1, 2, 1, 1, 1, 3, 1, 1, 1, 3];
  let x = 20;
  
  for (let i = 0; i < pattern.length; i++) {
    const width = pattern[i] * 2;
    if (i % 2 === 0) {
      // Draw black line
      ctx.fillRect(x, 20, width, 60);
    }
    x += width;
  }
  
  // Add some text below (simulating a barcode number)
  ctx.fillStyle = 'black';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('123456789012', canvas.width / 2, 95);
  
  return canvas.toDataURL('image/png');
}

/**
 * Test with a user-provided image file
 */
export const testWithImageFile = async (file) => {
  console.log('🧪 Testing with user image file:', file.name);
  
  try {
    // Convert file to data URL
    const dataUrl = await fileToDataUrl(file);
    
    // Test detection
    const result = await fastBarcodeDetectorService.detectBarcodeFromImage(dataUrl);
    
    console.log('🧪 User image detection result:', result);
    
    return {
      success: true,
      testResult: result,
      message: result.success ? 
        `Barcode detected: ${result.barcode}` : 
        `No barcode found: ${result.error}`
    };
    
  } catch (error) {
    console.error('🧪 User image test failed:', error);
    return {
      success: false,
      error: error.message,
      message: `Test failed: ${error.message}`
    };
  }
};

/**
 * Convert file to data URL
 */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get detection capabilities info
 */
export const getDetectionInfo = () => {
  return {
    zxingAvailable: true, // We import it dynamically
    tesseractAvailable: true, // We import it dynamically
    canvasSupported: typeof document !== 'undefined' && document.createElement('canvas').getContext,
    supportedFormats: [
      'Code 128',
      'EAN-13',
      'EAN-8',
      'UPC-A',
      'UPC-E',
      'Code 39',
      'Code 93',
      'Codabar',
      'ITF',
      'RSS-14',
      'Data Matrix',
      'QR Code'
    ],
    detectionMethods: [
      'ZXing multi-format detection (primary)',
      'Enhanced image preprocessing + ZXing',
      'OCR-based numeric detection (fallback)'
    ],
    reliability: 'High - uses industry-standard ZXing library'
  };
};
