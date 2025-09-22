/**
 * Fast, lightweight barcode detector
 * Prioritizes speed and reliability over comprehensive format support
 */

class FastBarcodeDetectorService {
  constructor() {
    this.zxingReader = null;
  }

  /**
   * Main detection method - fast and reliable
   */
  async detectBarcodeFromImage(imageDataUrl) {
    console.log('🔍 Starting fast barcode detection...');
    
    try {
      // Create image and canvas quickly
      const { canvas } = await this.createCanvasFromDataUrl(imageDataUrl);
      
      // Method 1: Try ZXing with timeout (5 seconds max)
      console.log('🔍 Method 1: ZXing detection (5s timeout)...');
      const zxingResult = await this.detectWithTimeout(
        () => this.detectWithZXing(canvas), 
        5000
      );
      
      if (zxingResult.success) {
        return zxingResult;
      }
      
      // Method 2: Try with enhanced image (3 seconds max)
      console.log('🔍 Method 2: Enhanced image detection (3s timeout)...');
      const enhancedCanvas = this.enhanceImageForBarcode(canvas);
      const enhancedResult = await this.detectWithTimeout(
        () => this.detectWithZXing(enhancedCanvas),
        3000
      );

      if (enhancedResult.success) {
        return enhancedResult;
      }

      // Method 3: Try with region detection (2 seconds max)
      console.log('🔍 Method 3: Region-based detection (2s timeout)...');
      const regionResults = await this.detectWithTimeout(
        () => this.detectInRegions(canvas),
        2000
      );

      if (regionResults.success) {
        return regionResults;
      }

      // Method 4: Try with different preprocessing (2 seconds max)
      console.log('🔍 Method 4: Alternative preprocessing (2s timeout)...');
      const altProcessedCanvas = this.alternativePreprocessing(canvas);
      const altResult = await this.detectWithTimeout(
        () => this.detectWithZXing(altProcessedCanvas),
        2000
      );

      if (altResult.success) {
        return altResult;
      }
      
      return { 
        success: false, 
        error: 'No barcode detected. Please ensure the barcode is clear and try again.' 
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
   * Run detection with timeout
   */
  async detectWithTimeout(detectionFunction, timeoutMs) {
    return Promise.race([
      detectionFunction(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Detection timeout')), timeoutMs)
      )
    ]).catch(error => {
      console.warn('🔍 Detection timeout or error:', error.message);
      return { success: false, error: 'Detection timed out' };
    });
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
        
        // Limit canvas size for performance
        const maxSize = 800;
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve({ canvas, ctx });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
  }

  /**
   * ZXing detection with proper error handling
   */
  async detectWithZXing(canvas) {
    try {
      // Try multiple ZXing approaches
      const approaches = [
        this.tryZXingImageData.bind(this),
        this.tryZXingImageElement.bind(this),
        this.tryZXingCanvas.bind(this)
      ];
      
      for (const approach of approaches) {
        try {
          const result = await approach(canvas);
          if (result.success) {
            return result;
          }
        } catch (error) {
          console.warn('🔍 ZXing approach failed:', error.message);
          continue;
        }
      }
      
      return { success: false, error: 'All ZXing methods failed' };
      
    } catch (error) {
      console.warn('🔍 ZXing detection error:', error.message);
      return { success: false, error: 'ZXing detection failed' };
    }
  }

  /**
   * Try ZXing with ImageData
   */
  async tryZXingImageData(canvas) {
    const ZXing = await import('@zxing/library');
    const reader = new ZXing.BrowserMultiFormatReader();
    
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const result = await reader.decodeFromImageData(imageData);
    if (result) {
      const barcode = result.getText();
      console.log('🔍 ZXing ImageData detected:', barcode);
      return { success: true, barcode };
    }
    
    return { success: false, error: 'No barcode found' };
  }

  /**
   * Try ZXing with Image Element
   */
  async tryZXingImageElement(canvas) {
    const ZXing = await import('@zxing/library');
    const reader = new ZXing.BrowserMultiFormatReader();
    
    const dataUrl = canvas.toDataURL('image/png');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = async () => {
        try {
          const result = await reader.decodeFromImageElement(img);
          if (result) {
            const barcode = result.getText();
            console.log('🔍 ZXing ImageElement detected:', barcode);
            resolve({ success: true, barcode });
          } else {
            resolve({ success: false, error: 'No barcode found' });
          }
        } catch (error) {
          resolve({ success: false, error: error.message });
        }
      };
      img.onerror = () => resolve({ success: false, error: 'Image load failed' });
      img.src = dataUrl;
    });
  }

  /**
   * Try ZXing with Canvas directly
   */
  async tryZXingCanvas(canvas) {
    const ZXing = await import('@zxing/library');
    const reader = new ZXing.BrowserMultiFormatReader();
    
    // Some versions of ZXing support canvas directly
    if (reader.decodeFromCanvas) {
      const result = await reader.decodeFromCanvas(canvas);
      if (result) {
        const barcode = result.getText();
        console.log('🔍 ZXing Canvas detected:', barcode);
        return { success: true, barcode };
      }
    }
    
    return { success: false, error: 'Canvas method not supported' };
  }

  /**
   * Enhance image for better barcode detection
   */
  enhanceImageForBarcode(originalCanvas) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = originalCanvas.width;
    canvas.height = originalCanvas.height;
    
    ctx.drawImage(originalCanvas, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Enhanced contrast processing to handle text and noise
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);

      // Multi-level thresholding to better separate barcodes from text
      let enhanced;
      if (gray < 80) {
        enhanced = 0; // Very dark - likely barcode bars
      } else if (gray > 175) {
        enhanced = 255; // Very light - likely background
      } else {
        // Mid-tones - apply adaptive threshold
        enhanced = gray > 127 ? 255 : 0;
      }

      data[i] = enhanced;
      data[i + 1] = enhanced;
      data[i + 2] = enhanced;
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * Detect barcodes in different regions of the image
   */
  async detectInRegions(canvas) {
    console.log('🔍 Trying region-based detection...');

    try {
      // Define regions to check (center, top, bottom, left, right)
      const regions = [
        { x: 0.25, y: 0.25, w: 0.5, h: 0.5, name: 'center' },
        { x: 0.1, y: 0.1, w: 0.8, h: 0.4, name: 'top' },
        { x: 0.1, y: 0.5, w: 0.8, h: 0.4, name: 'bottom' },
        { x: 0.0, y: 0.2, w: 0.5, h: 0.6, name: 'left' },
        { x: 0.5, y: 0.2, w: 0.5, h: 0.6, name: 'right' }
      ];

      for (const region of regions) {
        try {
          const regionCanvas = this.extractRegion(canvas, region);
          const result = await this.detectWithZXing(regionCanvas);

          if (result.success) {
            console.log(`🔍 Found barcode in ${region.name} region:`, result.barcode);
            return result;
          }
        } catch (error) {
          console.warn(`🔍 Region ${region.name} failed:`, error.message);
          continue;
        }
      }

      return { success: false, error: 'No barcode found in any region' };

    } catch (error) {
      console.warn('🔍 Region detection error:', error.message);
      return { success: false, error: 'Region detection failed' };
    }
  }

  /**
   * Extract a specific region from the canvas
   */
  extractRegion(canvas, region) {
    const regionCanvas = document.createElement('canvas');
    const ctx = regionCanvas.getContext('2d');

    const x = Math.floor(canvas.width * region.x);
    const y = Math.floor(canvas.height * region.y);
    const width = Math.floor(canvas.width * region.w);
    const height = Math.floor(canvas.height * region.h);

    regionCanvas.width = width;
    regionCanvas.height = height;

    ctx.drawImage(canvas, x, y, width, height, 0, 0, width, height);

    return regionCanvas;
  }

  /**
   * Alternative preprocessing method
   */
  alternativePreprocessing(originalCanvas) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = originalCanvas.width;
    canvas.height = originalCanvas.height;

    ctx.drawImage(originalCanvas, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply adaptive thresholding and noise reduction
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);

      // Adaptive threshold based on local average
      let threshold = 128;

      // Sample surrounding pixels for local threshold
      const pixelIndex = Math.floor(i / 4);
      const x = pixelIndex % canvas.width;
      const y = Math.floor(pixelIndex / canvas.width);

      if (x > 5 && x < canvas.width - 5 && y > 5 && y < canvas.height - 5) {
        let sum = 0;
        let count = 0;

        // Sample 3x3 neighborhood
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const neighborIndex = ((y + dy) * canvas.width + (x + dx)) * 4;
            if (neighborIndex >= 0 && neighborIndex < data.length) {
              const neighborGray = Math.round(0.299 * data[neighborIndex] + 0.587 * data[neighborIndex + 1] + 0.114 * data[neighborIndex + 2]);
              sum += neighborGray;
              count++;
            }
          }
        }

        threshold = count > 0 ? sum / count : 128;
      }

      // Apply threshold with some tolerance
      const enhanced = gray > (threshold - 10) ? 255 : 0;

      data[i] = enhanced;
      data[i + 1] = enhanced;
      data[i + 2] = enhanced;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * Validate barcode format
   */
  isValidBarcode(code) {
    if (!code || typeof code !== 'string') return false;
    
    code = code.trim();
    const validLengths = [8, 12, 13, 14];
    return /^\d+$/.test(code) && validLengths.includes(code.length);
  }
}

const fastBarcodeDetectorService = new FastBarcodeDetectorService();
export default fastBarcodeDetectorService;
