/**
 * Simplified, more reliable barcode detector
 * Uses modern libraries and focuses on the most reliable detection methods
 */

class SimpleBarcodeDetectorService {
  constructor() {
    this.zxingReader = null;
  }

  /**
   * Main detection method - tries the most reliable approaches
   */
  async detectBarcodeFromImage(imageDataUrl) {
    console.log('🔍 Starting simple barcode detection...');
    
    try {
      // Create image and canvas
      const { canvas, ctx } = await this.createCanvasFromDataUrl(imageDataUrl);
      
      // Method 1: Try ZXing (most reliable)
      console.log('🔍 Method 1: ZXing detection...');
      const zxingResult = await this.detectWithZXing(canvas);
      if (zxingResult.success) {
        return zxingResult;
      }
      
      // Method 2: Try with enhanced image
      console.log('🔍 Method 2: Enhanced image detection...');
      const enhancedCanvas = this.enhanceImageForBarcode(canvas, ctx);
      const enhancedResult = await this.detectWithZXing(enhancedCanvas);
      if (enhancedResult.success) {
        return enhancedResult;
      }
      
      // Method 3: OCR fallback for numeric codes
      console.log('🔍 Method 3: OCR fallback...');
      const ocrResult = await this.detectWithOCR(canvas);
      if (ocrResult.success) {
        return ocrResult;
      }
      
      return { 
        success: false, 
        error: 'No barcode detected. Please ensure the barcode is clear and well-lit.' 
      };
      
    } catch (error) {
      console.error('🔍 Detection error:', error);
      return { 
        success: false, 
        error: `Detection failed: ${error.message}` 
      };
    }
  }

  /**
   * Create canvas from data URL
   */
  async createCanvasFromDataUrl(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        resolve({ canvas, ctx });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
  }

  /**
   * ZXing detection method (fixed API)
   */
  async detectWithZXing(canvas) {
    try {
      if (!this.zxingReader) {
        const ZXing = await import('@zxing/library');
        this.zxingReader = new ZXing.BrowserMultiFormatReader();
      }

      // Convert canvas to ImageData for ZXing
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Use the correct ZXing API
      const result = await this.zxingReader.decodeFromImageData(imageData);

      if (result) {
        const barcode = result.getText();
        console.log('🔍 ZXing detected:', barcode);
        return { success: true, barcode };
      }

      return { success: false, error: 'No barcode found' };

    } catch (error) {
      console.warn('🔍 ZXing error:', error.message);
      // Try alternative ZXing method
      return this.detectWithZXingAlternative(canvas);
    }
  }

  /**
   * Alternative ZXing method
   */
  async detectWithZXingAlternative(canvas) {
    try {
      const ZXing = await import('@zxing/library');
      const codeReader = new ZXing.BrowserMultiFormatReader();

      // Create a temporary image element
      const dataUrl = canvas.toDataURL('image/png');
      const img = new Image();

      return new Promise((resolve) => {
        img.onload = async () => {
          try {
            const result = await codeReader.decodeFromImageElement(img);
            if (result) {
              const barcode = result.getText();
              console.log('🔍 ZXing alternative detected:', barcode);
              resolve({ success: true, barcode });
            } else {
              resolve({ success: false, error: 'No barcode found with alternative method' });
            }
          } catch (error) {
            console.warn('🔍 ZXing alternative error:', error.message);
            resolve({ success: false, error: 'ZXing alternative failed' });
          }
        };

        img.onerror = () => {
          resolve({ success: false, error: 'Failed to create image for ZXing' });
        };

        img.src = dataUrl;
      });

    } catch (error) {
      console.warn('🔍 ZXing alternative setup error:', error.message);
      return { success: false, error: 'ZXing alternative setup failed' };
    }
  }

  /**
   * Enhance image for better barcode detection
   */
  enhanceImageForBarcode(originalCanvas, originalCtx) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = originalCanvas.width;
    canvas.height = originalCanvas.height;
    
    // Copy original image
    ctx.drawImage(originalCanvas, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Convert to high contrast black and white
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      const enhanced = gray > 128 ? 255 : 0;
      
      data[i] = enhanced;     // Red
      data[i + 1] = enhanced; // Green
      data[i + 2] = enhanced; // Blue
      // Alpha stays the same
    }
    
    // Put enhanced image back
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * OCR-based detection for numeric barcodes
   */
  async detectWithOCR(canvas) {
    try {
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png');
      });
      
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      
      try {
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789'
        });
        
        const result = await worker.recognize(blob);
        const text = result.data.text.trim();
        
        // Look for barcode patterns
        const barcodePattern = /\b\d{8,13}\b/g;
        const matches = text.match(barcodePattern);
        
        if (matches && matches.length > 0) {
          const barcode = matches[0];
          console.log('🔍 OCR detected:', barcode);
          return { success: true, barcode };
        }
        
        return { success: false, error: 'No numeric barcode pattern found' };
        
      } finally {
        await worker.terminate();
      }
      
    } catch (error) {
      console.warn('🔍 OCR error:', error.message);
      return { success: false, error: 'OCR detection failed' };
    }
  }

  /**
   * Validate barcode format
   */
  isValidBarcode(code) {
    if (!code || typeof code !== 'string') return false;
    
    code = code.trim();
    
    // Check common barcode lengths
    const validLengths = [8, 12, 13, 14];
    return /^\d+$/.test(code) && validLengths.includes(code.length);
  }
}

const simpleBarcodeDetectorService = new SimpleBarcodeDetectorService();
export default simpleBarcodeDetectorService;
