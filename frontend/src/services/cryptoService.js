import { formatCurrency } from '../utils/helpers';

// Blockchair API configuration
const BLOCKCHAIR_API_KEY = 'G___T015qT4KXWjyDqr8lxHpyXSrOzzD';
const BLOCKCHAIR_BASE_URL = 'https://api.blockchair.com';

// Crypto data cache to avoid excessive API calls
let cryptoDataCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to make Blockchair API requests
const blockchairRequest = async (endpoint) => {
  try {
    const url = `${BLOCKCHAIR_BASE_URL}${endpoint}?key=${BLOCKCHAIR_API_KEY}`;
    console.log(`🔗 Making Blockchair API request to: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Blockchair API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📊 Blockchair response:', data);
    return data;
  } catch (error) {
    console.error('💥 Blockchair API request failed:', error);
    throw error;
  }
};

// Fetch Bitcoin statistics
const getBitcoinStats = async () => {
  try {
    const response = await blockchairRequest('/bitcoin/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching Bitcoin stats:', error);
    return null;
  }
};

// Fetch Ethereum statistics
const getEthereumStats = async () => {
  try {
    const response = await blockchairRequest('/ethereum/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching Ethereum stats:', error);
    return null;
  }
};

// Fetch multiple crypto stats with caching
const getCryptoStats = async () => {
  // Check cache first
  if (cryptoDataCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    console.log('📦 Using cached crypto data');
    return cryptoDataCache;
  }

  try {
    console.log('🔄 Fetching fresh crypto data from Blockchair...');
    
    // Fetch Bitcoin and Ethereum stats in parallel
    const [bitcoinStats, ethereumStats] = await Promise.allSettled([
      getBitcoinStats(),
      getEthereumStats()
    ]);

    const cryptoData = {
      bitcoin: bitcoinStats.status === 'fulfilled' ? bitcoinStats.value : null,
      ethereum: ethereumStats.status === 'fulfilled' ? ethereumStats.value : null,
      timestamp: Date.now()
    };

    // Cache the data
    cryptoDataCache = cryptoData;
    cacheTimestamp = Date.now();

    return cryptoData;
  } catch (error) {
    console.error('Failed to fetch crypto stats:', error);
    return null;
  }
};

// Generate crypto tips based on current market data
const generateCryptoTips = async (userCurrency = 'USD') => {
  try {
    const cryptoData = await getCryptoStats();
    
    if (!cryptoData || (!cryptoData.bitcoin && !cryptoData.ethereum)) {
      return getFallbackCryptoTips(userCurrency);
    }

    const tips = [];

    // Bitcoin tips
    if (cryptoData.bitcoin) {
      const btc = cryptoData.bitcoin;
      
      if (btc.market_price_usd) {
        tips.push(
          `💰 Bitcoin is currently trading at ${formatCurrency(btc.market_price_usd, 'USD')}. ${getBitcoinPriceTrend()}`
        );
      }

      if (btc.transactions_24h) {
        tips.push(
          `⚡ Bitcoin processed ${btc.transactions_24h.toLocaleString()} transactions in the last 24 hours, showing strong network activity.`
        );
      }

      if (btc.hashrate_24h) {
        const hashrateInEH = (btc.hashrate_24h / 1e18).toFixed(2);
        tips.push(
          `🔐 Bitcoin network hashrate is ${hashrateInEH} EH/s, indicating robust security and mining participation.`
        );
      }

      if (btc.blocks_24h) {
        const avgBlockTime = Math.round((24 * 60) / btc.blocks_24h);
        tips.push(
          `⏰ Bitcoin is averaging ~${avgBlockTime} minutes per block today. The target is 10 minutes.`
        );
      }
    }

    // Ethereum tips
    if (cryptoData.ethereum) {
      const eth = cryptoData.ethereum;
      
      if (eth.market_price_usd) {
        tips.push(
          `💎 Ethereum is currently priced at ${formatCurrency(eth.market_price_usd, 'USD')}. Perfect for DeFi and NFT activities.`
        );
      }

      if (eth.transactions_24h) {
        tips.push(
          `🚀 Ethereum processed ${eth.transactions_24h.toLocaleString()} transactions today, powering the DeFi ecosystem.`
        );
      }
    }

    // Add investment advice based on market conditions
    tips.push(
      `📊 Consider dollar-cost averaging (DCA) into crypto investments rather than trying to time the market perfectly.`
    );

    if (userCurrency === 'ZAR') {
      tips.push(
        `🇿🇦 In South Africa, you can invest in crypto through platforms like Luno, VALR, or AltCoinTrader. Remember to consider tax implications.`
      );
    }

    tips.push(
      `🔒 Always use proper security: enable 2FA, use hardware wallets for large amounts, and never share your private keys.`
    );

    // Add a safety tip
    tips.push(
      `⚠️ Crypto tip: Only invest what you can afford to lose. Cryptocurrency markets are highly volatile and speculative.`
    );

    // Shuffle tips and return a random selection
    const shuffledTips = tips.sort(() => Math.random() - 0.5);
    return shuffledTips.slice(0, 3); // Return 3 random tips

  } catch (error) {
    console.error('Error generating crypto tips:', error);
    return getFallbackCryptoTips(userCurrency);
  }
};

// Get Bitcoin price trend suggestion
const getBitcoinPriceTrend = () => {
  const trends = [
    "Consider dollar-cost averaging for steady accumulation.",
    "Research before making any investment decisions.",
    "Volatility creates both opportunities and risks.",
    "Long-term holders often weather short-term fluctuations better.",
    "Market sentiment can change rapidly in crypto.",
    "Consider your risk tolerance before investing."
  ];
  
  return trends[Math.floor(Math.random() * trends.length)];
};

// Fallback crypto tips when API is unavailable
const getFallbackCryptoTips = (userCurrency) => {
  const fallbackTips = [
    `💡 Crypto investing tip: Start with established cryptocurrencies like Bitcoin and Ethereum before exploring altcoins.`,
    `🔐 Security first: Use reputable exchanges, enable two-factor authentication, and consider cold storage for large holdings.`,
    `📈 Dollar-cost averaging (DCA) is a popular strategy to reduce the impact of volatility when investing in crypto.`,
    `⚠️ Never invest more than you can afford to lose in cryptocurrency. The market is highly volatile and speculative.`,
    `🎯 Diversification applies to crypto too - don't put all your funds into a single cryptocurrency.`,
    `📚 Education is key: Understand blockchain technology and the specific use cases of cryptocurrencies you invest in.`
  ];

  if (userCurrency === 'ZAR') {
    fallbackTips.push(
      `🇿🇦 In South Africa, popular crypto platforms include Luno, VALR, and AltCoinTrader. Always verify platform security and regulation compliance.`
    );
  }

  // Return 2-3 random fallback tips
  const shuffledTips = fallbackTips.sort(() => Math.random() - 0.5);
  return shuffledTips.slice(0, 2);
};

// Get a single random crypto tip
export const getRandomCryptoTip = async (userCurrency = 'USD') => {
  try {
    const tips = await generateCryptoTips(userCurrency);
    return tips[Math.floor(Math.random() * tips.length)];
  } catch (error) {
    console.error('Error getting random crypto tip:', error);
    const fallbackTips = getFallbackCryptoTips(userCurrency);
    return fallbackTips[0];
  }
};

// Get multiple crypto tips
export const getMultipleCryptoTips = async (userCurrency = 'USD') => {
  try {
    return await generateCryptoTips(userCurrency);
  } catch (error) {
    console.error('Error getting multiple crypto tips:', error);
    return getFallbackCryptoTips(userCurrency);
  }
};

// Get current crypto market summary
export const getCryptoMarketSummary = async () => {
  try {
    const cryptoData = await getCryptoStats();
    
    if (!cryptoData) {
      return "Unable to fetch current crypto market data. Check your internet connection.";
    }

    let summary = "📊 Crypto Market Summary:\n";
    
    if (cryptoData.bitcoin && cryptoData.bitcoin.market_price_usd) {
      summary += `• Bitcoin: ${formatCurrency(cryptoData.bitcoin.market_price_usd, 'USD')}\n`;
    }
    
    if (cryptoData.ethereum && cryptoData.ethereum.market_price_usd) {
      summary += `• Ethereum: ${formatCurrency(cryptoData.ethereum.market_price_usd, 'USD')}\n`;
    }

    summary += `\n⏰ Last updated: ${new Date().toLocaleString()}`;
    
    return summary;
  } catch (error) {
    console.error('Error getting crypto market summary:', error);
    return "Unable to fetch crypto market data at the moment.";
  }
};

// Export cache management functions for testing
export const clearCryptoCache = () => {
  cryptoDataCache = null;
  cacheTimestamp = null;
  console.log('🗑️ Crypto data cache cleared');
};

export const getCacheInfo = () => {
  return {
    hasCachedData: !!cryptoDataCache,
    cacheAge: cacheTimestamp ? Date.now() - cacheTimestamp : null,
    cacheValidFor: cacheTimestamp ? Math.max(0, CACHE_DURATION - (Date.now() - cacheTimestamp)) : null
  };
};

console.log('🚀 Crypto service initialized with Blockchair API');