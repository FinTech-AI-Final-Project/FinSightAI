import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';

/**
 * Test utility for debugging barcode scanner issues
 */
export const testBarcodeScanner = async () => {
  console.log('🔍 Starting Barcode Scanner Test...');
  
  // Test 1: Check if we're on a native platform
  console.log('📱 Platform check:', {
    isNativePlatform: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
    isPluginAvailable: Capacitor.isPluginAvailable('BarcodeScanner')
  });
  
  if (!Capacitor.isNativePlatform()) {
    console.log('❌ Not on native platform - barcode scanning not available');
    return { success: false, error: 'Not on native platform' };
  }
  
  try {
    // Test 2: Check permissions
    console.log('🔐 Checking permissions...');
    const permission = await BarcodeScanner.checkPermission({ force: false });
    console.log('🔐 Permission status:', permission);
    
    if (!permission.granted) {
      console.log('🔐 Requesting permission...');
      const requestResult = await BarcodeScanner.checkPermission({ force: true });
      console.log('🔐 Permission request result:', requestResult);
      
      if (!requestResult.granted) {
        return { 
          success: false, 
          error: 'Camera permission not granted',
          details: requestResult
        };
      }
    }
    
    // Test 3: Try to prepare scanner (without actually starting scan)
    console.log('📷 Testing scanner preparation...');
    await BarcodeScanner.hideBackground();
    console.log('📷 Background hidden successfully');
    
    // Immediately restore background
    await BarcodeScanner.showBackground();
    console.log('📷 Background restored successfully');
    
    console.log('✅ Barcode scanner test completed successfully');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Barcode scanner test failed:', error);
    
    // Try to cleanup
    try {
      await BarcodeScanner.showBackground();
      await BarcodeScanner.stopScan();
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup error:', cleanupError);
    }
    
    return { 
      success: false, 
      error: error.message || 'Unknown error',
      details: error
    };
  }
};

/**
 * Get detailed scanner info for debugging
 */
export const getScannerInfo = async () => {
  const info = {
    platform: Capacitor.getPlatform(),
    isNativePlatform: Capacitor.isNativePlatform(),
    isPluginAvailable: Capacitor.isPluginAvailable('BarcodeScanner'),
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };
  
  try {
    const permission = await BarcodeScanner.checkPermission({ force: false });
    info.permission = permission;
  } catch (error) {
    info.permissionError = error.message;
  }
  
  return info;
};
