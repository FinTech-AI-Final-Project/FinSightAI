import { createWorker } from 'tesseract.js';

class ReceiptScannerService {
  constructor() {
    this.worker = null;
  }

  async initialize() {
    if (!this.worker) {
      this.worker = await createWorker('eng');
    }
    return this.worker;
  }

  async scanReceipt(imageFile, onProgress = null) {
    console.log('📸 ReceiptScanner: Starting OCR for file:', imageFile.name, 'Size:', imageFile.size);
    
    try {
      // Method 1: Try the simplified worker approach
      console.log('📸 Method 1: Creating simple worker...');
      const worker = await createWorker();
      
      try {
        // Initialize with minimal options
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        console.log('📸 Worker initialized successfully');

        // Use simplified recognition without complex logger
        console.log('📸 Starting text recognition...');
        
        // Update progress manually
        if (onProgress) {
          onProgress({ progress: 0.1 });
        }
        
        const result = await worker.recognize(imageFile);
        
        if (onProgress) {
          onProgress({ progress: 1.0 });
        }

        const text = result.data.text || '';
        console.log('📸 OCR completed successfully');
        console.log('📸 Extracted text length:', text.length);
        console.log('📸 Text preview:', text.substring(0, 200) + '...');
        
        // Parse the receipt text
        const parsedData = this.parseReceiptText(text);
        console.log('📸 Parsed receipt data:', parsedData);
        
        return {
          success: true,
          rawText: text,
          parsedData
        };
      } finally {
        // Always clean up the worker
        console.log('📸 Terminating worker...');
        try {
          await worker.terminate();
          console.log('📸 Worker terminated');
        } catch (terminateError) {
          console.warn('📸 Worker termination warning:', terminateError);
        }
      }
    } catch (error) {
      console.error('📸 OCR Method 1 failed:', error);
      
      // Method 2: Try alternative approach
      try {
        console.log('📸 Method 2: Trying alternative OCR approach...');
        const altWorker = await createWorker();
        
        const result = await altWorker.recognize(imageFile);
        await altWorker.terminate();
        
        const text = result.data.text || '';
        const parsedData = this.parseReceiptText(text);
        
        console.log('📸 Method 2 successful');
        return {
          success: true,
          rawText: text,
          parsedData
        };
      } catch (altError) {
        console.error('📸 OCR Method 2 also failed:', altError);
        
        return {
          success: false,
          error: `OCR processing failed: ${error.message}. This might be due to image quality, device limitations, or network connectivity. Please try again with a clearer image or enter details manually.`,
          rawText: '',
          parsedData: this.getDefaultExpenseData()
        };
      }
    }
  }

  parseReceiptText(text) {
    console.log('📸 Parsing receipt text:', text.substring(0, 300));
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const expenseData = {
      description: '',
      amount: 0,
      category: 'OTHER',
      merchant: '',
      date: new Date().toISOString().split('T')[0], // Default to today
      confidence: {
        description: 0,
        amount: 0,
        merchant: 0,
        date: 0
      }
    };

    // Extract merchant name (usually at the top)
    const merchantPatterns = [
      /^([A-Z\s]{3,}(?:STORE|MARKET|SHOP|RESTAURANT|CAFE|PHARMACY|STATION))/i,
      /^([A-Z\s]{3,}(?:INC|LLC|LTD|CORP))/i,
      /^([A-Z][A-Z\s]{2,20})\s*$/
    ];

    for (const line of lines.slice(0, 5)) { // Check first 5 lines
      for (const pattern of merchantPatterns) {
        const match = line.match(pattern);
        if (match) {
          expenseData.merchant = match[1].trim();
          expenseData.confidence.merchant = 0.8;
          break;
        }
      }
      if (expenseData.merchant) break;
    }

    // Extract product/item description - look for product lines
    const productPatterns = [
      // Product code + description pattern (like "210292674 JBL 1520 BT Headphones")
      /^\d+\s+(.+?)(?:\s+\d+[.,]\d{2})?$/,
      // Description with price pattern
      /^(.+?)\s+(?:R?\s*)?\d+[.,]\d{2}$/,
      // Simple product name pattern
      /^([A-Za-z0-9\s]{4,}(?:Headphones|Phone|Laptop|Computer|TV|Mouse|Keyboard|Speaker|Camera|Watch|Tablet).*?)(?:\s|$)/i,
      // Generic item description (longer lines that aren't totals)
      /^([A-Za-z][A-Za-z0-9\s]{10,})$/
    ];

    const possibleDescriptions = [];
    for (const line of lines) {
      // Skip lines that look like totals, headers, or addresses
      if (line.match(/^(total|subtotal|tax|vat|amount|balance|due|receipt|store|address|tel|phone)/i)) {
        continue;
      }
      
      for (const pattern of productPatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          const desc = match[1].trim();
          if (desc.length > 3 && desc.length < 100) { // Reasonable description length
            possibleDescriptions.push({
              description: desc,
              confidence: this.getDescriptionConfidence(desc),
              line: line
            });
          }
        }
      }
    }

    // Choose the best description
    if (possibleDescriptions.length > 0) {
      const bestDescription = possibleDescriptions.sort((a, b) => b.confidence - a.confidence)[0];
      expenseData.description = bestDescription.description;
      expenseData.confidence.description = bestDescription.confidence;
      console.log('📸 Found descriptions:', possibleDescriptions.map(d => `${d.description} (${d.confidence})`));
      console.log('📸 Selected description:', bestDescription.description);
    }

    // Extract total amount - improved patterns
    const amountPatterns = [
      // Total with currency
      /(?:total|amount|sum|balance|due)[\s:]*R?\s*(\d+[.,]\d{2})/gi,
      // Price patterns
      /(?:price|cost)[\s:]*R?\s*(\d+[.,]\d{2})/gi,
      // Currency with amount
      /R\s*(\d+[.,]\d{2})/g,
      // Standalone amounts
      /(\d+[.,]\d{2})/g
    ];

    const amounts = [];
    const amountSources = [];
    
    for (const line of lines) {
      for (const pattern of amountPatterns) {
        // Reset regex lastIndex for global patterns
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const amountStr = match[1].replace(',', '.');
          const amount = parseFloat(amountStr);
          if (amount > 0 && amount < 100000) { // Reasonable range
            amounts.push(amount);
            amountSources.push({
              amount: amount,
              source: line,
              pattern: pattern.source
            });
          }
          // Prevent infinite loops with global regex
          if (!pattern.global) break;
        }
      }
    }

    console.log('📸 Found amounts:', amountSources);

    if (amounts.length > 0) {
      // For receipts, usually the largest amount is the total
      // But prefer amounts from lines containing "total", "amount", etc.
      const totalLines = amountSources.filter(a => 
        a.source.match(/total|amount|sum|balance|due/i)
      );
      
      if (totalLines.length > 0) {
        expenseData.amount = Math.max(...totalLines.map(t => t.amount));
        expenseData.confidence.amount = 0.9;
      } else {
        expenseData.amount = Math.max(...amounts);
        expenseData.confidence.amount = 0.7;
      }
      console.log('📸 Selected amount:', expenseData.amount);
    }

    // Extract date - improved patterns
    const datePatterns = [
      /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/g,
      /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/g,
      /(\w{3}\s+\d{1,2},?\s+\d{4})/gi, // Oct 15, 2023
      /(\d{1,2}\s+\w{3}\s+\d{4})/gi // 15 Oct 2023
    ];

    for (const line of lines) {
      for (const pattern of datePatterns) {
        pattern.lastIndex = 0;
        const match = pattern.exec(line);
        if (match) {
          try {
            const parsedDate = new Date(match[1]);
            const currentYear = new Date().getFullYear();
            if (parsedDate.getFullYear() >= currentYear - 1 && 
                parsedDate.getFullYear() <= currentYear + 1) {
              expenseData.date = parsedDate.toISOString().split('T')[0];
              expenseData.confidence.date = 0.8;
              console.log('📸 Found date:', expenseData.date);
              break;
            }
          } catch (e) {
            // Invalid date, continue
          }
        }
      }
      if (expenseData.confidence.date > 0) break;
    }

    // Determine category and description based on merchant and content
    const categoryInfo = this.getCategoryFromText(text, expenseData.merchant, expenseData.description);
    expenseData.category = categoryInfo.category;
    
    // If we don't have a good description, use the category-based one
    if (expenseData.confidence.description < 0.5) {
      expenseData.description = categoryInfo.description;
      expenseData.confidence.description = categoryInfo.confidence;
    }

    console.log('📸 Final parsed data:', expenseData);
    return expenseData;
  }

  getDescriptionConfidence(description) {
    // Higher confidence for descriptions that look like product names
    let confidence = 0.5;
    
    // Brand names and product types boost confidence
    const brandKeywords = ['samsung', 'apple', 'sony', 'jbl', 'nike', 'adidas', 'hp', 'dell', 'canon'];
    const productKeywords = ['headphones', 'phone', 'laptop', 'tv', 'mouse', 'keyboard', 'speaker', 'camera'];
    
    const lowerDesc = description.toLowerCase();
    
    if (brandKeywords.some(brand => lowerDesc.includes(brand))) {
      confidence += 0.3;
    }
    
    if (productKeywords.some(product => lowerDesc.includes(product))) {
      confidence += 0.2;
    }
    
    // Model numbers boost confidence
    if (description.match(/\d{3,}/)) {
      confidence += 0.1;
    }
    
    // Reasonable length
    if (description.length >= 10 && description.length <= 50) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  getCategoryFromText(text, merchant, description = '') {
    const lowerText = text.toLowerCase();
    const lowerMerchant = merchant.toLowerCase();
    const lowerDescription = description.toLowerCase();

    // Define category keywords
    const categories = {
      'GROCERIES': {
        keywords: ['grocery', 'supermarket', 'walmart', 'target', 'costco', 'kroger', 'safeway', 'whole foods', 'trader joe', 'spar', 'checkers', 'woolworths', 'pick n pay'],
        description: 'Grocery shopping'
      },
      'FOOD_DINING': {
        keywords: ['restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'fast food', 'dining', 'mcdonald', 'starbucks', 'subway', 'kfc', 'nandos', 'steers'],
        description: 'Restaurant / Dining'
      },
      'TRANSPORTATION': {
        keywords: ['gas', 'fuel', 'shell', 'exxon', 'bp', 'chevron', 'mobil', 'station', 'gasoline', 'petrol', 'caltex', 'sasol', 'engen'],
        description: 'Gas / Fuel'
      },
      'SHOPPING': {
        keywords: ['amazon', 'ebay', 'mall', 'store', 'shop', 'retail', 'clothing', 'fashion', 'takealot', 'makro', 'game'],
        description: 'Shopping'
      },
      'ELECTRONICS': {
        keywords: ['electronics', 'computer', 'laptop', 'phone', 'headphones', 'tv', 'camera', 'samsung', 'apple', 'sony', 'jbl', 'hp', 'dell', 'incredible connection', 'dion wired'],
        description: 'Electronics'
      },
      'HEALTHCARE': {
        keywords: ['pharmacy', 'cvs', 'walgreens', 'hospital', 'clinic', 'medical', 'doctor', 'dentist', 'clicks', 'dis-chem', 'medicine'],
        description: 'Healthcare / Pharmacy'
      },
      'ENTERTAINMENT': {
        keywords: ['movie', 'cinema', 'theater', 'game', 'entertainment', 'netflix', 'spotify', 'ster kinekor', 'nu metro', 'books'],
        description: 'Entertainment'
      },
      'BILLS_UTILITIES': {
        keywords: ['electric', 'water', 'internet', 'phone', 'utility', 'bill', 'payment', 'municipal', 'eskom', 'telkom'],
        description: 'Utility bill'
      }
    };

    // Check all text sources for category matches
    const allText = `${lowerText} ${lowerMerchant} ${lowerDescription}`;
    
    for (const [category, data] of Object.entries(categories)) {
      for (const keyword of data.keywords) {
        if (allText.includes(keyword)) {
          const baseDescription = data.description;
          let finalDescription = baseDescription;
          
          // Use the actual description if we have one, otherwise use merchant or generic
          if (description && description.length > 3) {
            finalDescription = description;
          } else if (merchant) {
            finalDescription = `${baseDescription} at ${merchant}`;
          }
          
          return {
            category,
            description: finalDescription,
            confidence: 0.8
          };
        }
      }
    }

    // If no category match, use description or merchant as fallback
    let finalDescription = 'Receipt expense';
    if (description && description.length > 3) {
      finalDescription = description;
    } else if (merchant) {
      finalDescription = `Purchase at ${merchant}`;
    }

    return {
      category: 'OTHER',
      description: finalDescription,
      confidence: 0.5
    };
  }

  getDefaultExpenseData() {
    return {
      description: 'Receipt expense',
      amount: 0,
      category: 'OTHER',
      merchant: '',
      date: new Date().toISOString().split('T')[0],
      confidence: {
        description: 0,
        amount: 0,
        merchant: 0,
        date: 0
      }
    };
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  // Preprocess image for better OCR results
  preprocessImage(canvas, imageData) {
    const ctx = canvas.getContext('2d');
    const data = imageData.data;

    // Convert to grayscale and enhance contrast
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      
      // Enhance contrast
      const enhanced = gray > 128 ? Math.min(255, gray * 1.2) : Math.max(0, gray * 0.8);
      
      data[i] = enhanced;     // Red
      data[i + 1] = enhanced; // Green
      data[i + 2] = enhanced; // Blue
      // Alpha channel (data[i + 3]) remains unchanged
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
}

const receiptScannerService = new ReceiptScannerService();
export default receiptScannerService;
