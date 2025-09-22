import Quagga from 'quagga';

class BarcodeDetectorService {
  constructor() {
    this.isInitialized = false;
    this.zxingReader = null;
  }

  async initializeZXing() {
    if (!this.zxingReader) {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/library');
        this.zxingReader = new BrowserMultiFormatReader();
        console.log('🔍 ZXing reader initialized');
      } catch (error) {
        console.warn('🔍 ZXing initialization failed:', error);
      }
    }
    return this.zxingReader;
  }

  /**
   * Detect barcode from image data URL
   * @param {string} imageDataUrl - Base64 data URL of the image
   * @returns {Promise<{success: boolean, barcode?: string, error?: string}>}
   */
  async detectBarcodeFromImage(imageDataUrl) {
    console.log('🔍 Starting barcode detection from image...');
    
    try {
      // Create an image element from the data URL
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      return new Promise((resolve) => {
        img.onload = () => {
          console.log('🔍 Image loaded, dimensions:', img.width, 'x', img.height);
          
          // Set canvas size to image size
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0);
          
          // Try multiple barcode detection approaches in order of reliability
          this.detectWithZXing(canvas)
            .then(result => {
              if (result.success) {
                resolve(result);
              } else {
                // Fallback 1: try Quagga
                return this.detectWithQuagga(canvas);
              }
            })
            .then(result => {
              if (result && result.success) {
                resolve(result);
              } else {
                // Fallback 2: try with image preprocessing
                return this.detectWithPreprocessing(canvas);
              }
            })
            .then(result => {
              if (result && result.success) {
                resolve(result);
              } else {
                // Final fallback: try OCR approach
                return this.detectWithOCR(canvas);
              }
            })
            .then(result => {
              resolve(result || { success: false, error: 'No barcode detected in image' });
            })
            .catch(error => {
              console.error('🔍 Barcode detection error:', error);
              resolve({ success: false, error: error.message });
            });
        };
        
        img.onerror = () => {
          resolve({ success: false, error: 'Failed to load image' });
        };
        
        img.src = imageDataUrl;
      });
    } catch (error) {
      console.error('🔍 Barcode detection setup error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect barcode using ZXing library (most reliable)
   */
  async detectWithZXing(canvas) {
    console.log('🔍 Trying ZXing detection...');

    try {
      const reader = await this.initializeZXing();
      if (!reader) {
        return { success: false, error: 'ZXing not available' };
      }

      // Convert canvas to ImageData
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Create a temporary canvas for ZXing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.putImageData(imageData, 0, 0);

      // Try to decode
      const result = await reader.decodeFromCanvas(tempCanvas);

      if (result) {
        const barcode = result.getText();
        console.log('🔍 ZXing detected barcode:', barcode);
        return { success: true, barcode };
      } else {
        return { success: false, error: 'No barcode found with ZXing' };
      }

    } catch (error) {
      console.error('🔍 ZXing detection error:', error);
      return { success: false, error: 'ZXing detection failed' };
    }
  }

  /**
   * Detect barcode using Quagga library
   */
  async detectWithQuagga(canvas) {
    console.log('🔍 Trying Quagga detection...');

    return new Promise((resolve) => {
      try {
        // Create a temporary container for Quagga
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.width = canvas.width + 'px';
        container.style.height = canvas.height + 'px';
        document.body.appendChild(container);

        // Add canvas to container
        const clonedCanvas = document.createElement('canvas');
        clonedCanvas.width = canvas.width;
        clonedCanvas.height = canvas.height;
        const ctx = clonedCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, 0);
        container.appendChild(clonedCanvas);

        const config = {
          inputStream: {
            name: "Live",
            type: "ImageStream",
            target: container,
            constraints: {
              width: canvas.width,
              height: canvas.height
            }
          },
          locator: {
            patchSize: "medium",
            halfSample: true
          },
          numOfWorkers: 1, // Reduced for stability
          frequency: 10,
          decoder: {
            readers: [
              "code_128_reader",
              "ean_reader",
              "ean_8_reader",
              "code_39_reader",
              "upc_reader",
              "upc_e_reader"
            ]
          },
          locate: true
        };

        let detected = false;
        const cleanup = () => {
          try {
            Quagga.stop();
            if (container && container.parentNode) {
              document.body.removeChild(container);
            }
          } catch (e) {
            console.warn('🔍 Quagga cleanup warning:', e);
          }
        };

        const timeout = setTimeout(() => {
          if (!detected) {
            detected = true;
            cleanup();
            resolve({ success: false, error: 'Quagga detection timeout' });
          }
        }, 8000); // 8 second timeout

        Quagga.onDetected((result) => {
          if (!detected) {
            detected = true;
            clearTimeout(timeout);
            cleanup();

            const code = result.codeResult.code;
            console.log('🔍 Quagga detected barcode:', code);
            resolve({ success: true, barcode: code });
          }
        });

        Quagga.init(config, (err) => {
          if (err) {
            clearTimeout(timeout);
            cleanup();
            console.error('🔍 Quagga init error:', err);
            resolve({ success: false, error: 'Quagga initialization failed' });
            return;
          }

          console.log('🔍 Quagga initialized, starting detection...');
          Quagga.start();

          // Process single frame approach
          setTimeout(() => {
            if (!detected) {
              detected = true;
              clearTimeout(timeout);
              cleanup();
              resolve({ success: false, error: 'No barcode found with Quagga' });
            }
          }, 6000);
        });

      } catch (error) {
        console.error('🔍 Quagga setup error:', error);
        resolve({ success: false, error: 'Quagga setup failed' });
      }
    });
  }

  /**
   * Try detection with image preprocessing
   */
  async detectWithPreprocessing(originalCanvas) {
    console.log('🔍 Trying with image preprocessing...');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = originalCanvas.width;
    canvas.height = originalCanvas.height;
    
    // Copy original image
    ctx.drawImage(originalCanvas, 0, 0);
    
    // Get image data for preprocessing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Convert to grayscale and enhance contrast
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      
      // Enhance contrast for barcode detection
      const enhanced = gray > 128 ? 255 : 0; // High contrast black/white
      
      data[i] = enhanced;     // Red
      data[i + 1] = enhanced; // Green
      data[i + 2] = enhanced; // Blue
    }
    
    // Put processed image back
    ctx.putImageData(imageData, 0, 0);
    
    // Try detection on processed image
    return this.detectWithQuagga(canvas);
  }

  /**
   * Fallback OCR-based detection for numeric barcodes
   */
  async detectWithOCR(canvas) {
    console.log('🔍 Trying OCR-based detection...');

    try {
      // Convert canvas to blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png');
      });

      // Use Tesseract for OCR with updated API
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: m => console.log('🔍 OCR:', m)
      });

      try {
        // Configure for number recognition (updated API)
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789'
        });

        const result = await worker.recognize(blob);
        const text = result.data.text.trim();

        console.log('🔍 OCR extracted text:', text);

        // Look for barcode-like patterns (8-13 digits)
        const barcodePattern = /\b\d{8,13}\b/g;
        const matches = text.match(barcodePattern);

        if (matches && matches.length > 0) {
          const barcode = matches[0];
          console.log('🔍 OCR detected potential barcode:', barcode);
          return { success: true, barcode };
        }

        return { success: false, error: 'No barcode pattern found in OCR text' };

      } finally {
        await worker.terminate();
      }
    } catch (error) {
      console.error('🔍 OCR detection error:', error);
      return { success: false, error: 'OCR detection failed' };
    }
  }

  /**
   * Validate if a string looks like a valid barcode
   */
  isValidBarcode(code) {
    if (!code || typeof code !== 'string') return false;
    
    // Remove any whitespace
    code = code.trim();
    
    // Check if it's a valid length for common barcode types
    const validLengths = [8, 12, 13, 14]; // EAN-8, UPC-A, EAN-13, etc.
    
    // Must be all digits
    if (!/^\d+$/.test(code)) return false;
    
    // Must be a valid length
    return validLengths.includes(code.length);
  }
}

const barcodeDetectorService = new BarcodeDetectorService();
export default barcodeDetectorService;
