import { formatCurrency } from '../utils/helpers';

// Blockchair API configuration
const BLOCKCHAIR_API_KEY = 'G___T015qT4KXWjyDqr8lxHpyXSrOzzD';
const BLOCKCHAIR_BASE_URL = 'https://api.blockchair.com';

// CoinGecko API (no API key needed for basic endpoints)
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Crypto data cache to avoid excessive API calls
let cryptoDataCache = null;
let marketDataCache = null;
let trendDataCache = null;
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

// CoinGecko API request helper
const coingeckoRequest = async (endpoint) => {
  try {
    const url = `${COINGECKO_BASE_URL}${endpoint}`;
    console.log(`🔗 Making CoinGecko API request to: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('💥 CoinGecko API request failed:', error);
    throw error;
  }
};

// Fetch top cryptocurrencies market data
const getTopCryptos = async (limit = 5) => {
  try {
    // Get top cryptocurrencies by market cap
    const data = await coingeckoRequest('/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=' + limit + '&page=1&sparkline=false&price_change_percentage=24h,7d');
    return data;
  } catch (error) {
    console.error('Error fetching top cryptocurrencies:', error);
    return null;
  }
};

// Fetch market trends
const getMarketTrends = async () => {
  try {
    // Get global crypto market data
    const data = await coingeckoRequest('/global');
    return data;
  } catch (error) {
    console.error('Error fetching market trends:', error);
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
    console.log('🔄 Fetching fresh crypto data...');
    
    // Fetch Bitcoin and Ethereum stats in parallel from Blockchair
    const [bitcoinStats, ethereumStats] = await Promise.allSettled([
      getBitcoinStats(),
      getEthereumStats()
    ]);

    // Fetch additional market data from CoinGecko
    const [topCryptos, marketTrends] = await Promise.allSettled([
      getTopCryptos(10),
      getMarketTrends()
    ]);

    const cryptoData = {
      bitcoin: bitcoinStats.status === 'fulfilled' ? bitcoinStats.value : null,
      ethereum: ethereumStats.status === 'fulfilled' ? ethereumStats.value : null,
      topCryptos: topCryptos.status === 'fulfilled' ? topCryptos.value : null,
      marketTrends: marketTrends.status === 'fulfilled' ? marketTrends.value : null,
      timestamp: Date.now()
    };

    // Cache the data
    cryptoDataCache = cryptoData;
    marketDataCache = topCryptos.status === 'fulfilled' ? topCryptos.value : null;
    trendDataCache = marketTrends.status === 'fulfilled' ? marketTrends.value : null;
    cacheTimestamp = Date.now();

    return cryptoData;
  } catch (error) {
    console.error('Failed to fetch crypto stats:', error);
    return null;
  }
};

// Approximate exchange rates (for demo purposes)
// In a production app, these would be fetched from an API
const exchangeRates = {
  'USD': 1,
  'ZAR': 18.20,
  'EUR': 0.92,
  'GBP': 0.79,
  'AUD': 1.52,
  'CAD': 1.38,
  'JPY': 149.50
};

// Convert USD to user's currency
const convertFromUSD = (amountUSD, targetCurrency) => {
  const rate = exchangeRates[targetCurrency] || 1;
  return amountUSD * rate;
};

// Get market sentiment based on data
const getMarketSentiment = (cryptoData) => {
  try {
    if (!cryptoData.topCryptos || !cryptoData.marketTrends) {
      return { sentiment: 'neutral', reason: 'insufficient data' };
    }

    // Check overall market sentiment based on top cryptos performance
    const topCryptos = cryptoData.topCryptos;
    let positiveCount = 0;
    let negativeCount = 0;

    for (const crypto of topCryptos) {
      if (crypto.price_change_percentage_24h > 0) {
        positiveCount++;
      } else if (crypto.price_change_percentage_24h < 0) {
        negativeCount++;
      }
    }

    // Check global market data
    const globalData = cryptoData.marketTrends.data;
    const marketCapChange = globalData.market_cap_change_percentage_24h_usd;
    const totalMarketCap = globalData.total_market_cap.usd;
    const btcDominance = globalData.market_cap_percentage.btc;

    // Determine market sentiment
    if (positiveCount > negativeCount && marketCapChange > 1) {
      return { 
        sentiment: 'bullish',
        reason: 'Most top cryptocurrencies are up in the last 24h',
        marketCapChange,
        btcDominance
      };
    } else if (negativeCount > positiveCount && marketCapChange < -1) {
      return {
        sentiment: 'bearish',
        reason: 'Most top cryptocurrencies are down in the last 24h',
        marketCapChange, 
        btcDominance
      };
    } else {
      return {
        sentiment: 'neutral',
        reason: 'Mixed signals in the crypto market',
        marketCapChange,
        btcDominance
      };
    }
  } catch (error) {
    console.error('Error analyzing market sentiment:', error);
    return { sentiment: 'neutral', reason: 'error analyzing market data' };
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
    
    // Analyze market sentiment
    const marketSentiment = getMarketSentiment(cryptoData);

    // Add market sentiment tip
    if (marketSentiment.sentiment === 'bullish') {
      tips.push(
        `📈 Market sentiment is currently bullish with a ${marketSentiment.marketCapChange.toFixed(2)}% increase in global crypto market cap over 24h.`
      );
    } else if (marketSentiment.sentiment === 'bearish') {
      tips.push(
        `📉 Market sentiment is currently bearish with a ${Math.abs(marketSentiment.marketCapChange).toFixed(2)}% decrease in global crypto market cap over 24h.`
      );
    } else {
      tips.push(
        `📊 Crypto market showing mixed signals with BTC dominance at ${marketSentiment.btcDominance?.toFixed(2)}%. Consider diversification.`
      );
    }

    // Add top performing cryptocurrency tip (if available)
    if (cryptoData.topCryptos && cryptoData.topCryptos.length > 0) {
      const topPerformers = [...cryptoData.topCryptos]
        .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
        .slice(0, 3);
      
      if (topPerformers[0]?.price_change_percentage_24h > 0) {
        const topCoin = topPerformers[0];
        const topCoinPriceInUserCurrency = convertFromUSD(topCoin.current_price, userCurrency);
        tips.push(
          `⭐ ${topCoin.name} (${topCoin.symbol.toUpperCase()}) is up ${topCoin.price_change_percentage_24h.toFixed(2)}% in 24h, currently at ${formatCurrency(topCoinPriceInUserCurrency, userCurrency)}.`
        );
      }
    }

    // Bitcoin tips
    if (cryptoData.bitcoin) {
      const btc = cryptoData.bitcoin;
      
      if (btc.market_price_usd) {
        // Convert BTC price to user's currency
        const btcPriceInUserCurrency = convertFromUSD(btc.market_price_usd, userCurrency);
        tips.push(
          `💰 Bitcoin is currently trading at ${formatCurrency(btcPriceInUserCurrency, userCurrency)}. ${getBitcoinPriceTrend(marketSentiment.sentiment, userCurrency)}`
        );
      }

      if (btc.transactions_24h) {
        tips.push(
          `⚡ Bitcoin processed ${btc.transactions_24h.toLocaleString()} transactions in the last 24h, showing ${btc.transactions_24h > 300000 ? 'strong' : 'moderate'} network activity.`
        );
      }

      if (btc.hashrate_24h) {
        const hashrateInEH = (btc.hashrate_24h / 1e18).toFixed(2);
        tips.push(
          `🔐 Bitcoin network hashrate is ${hashrateInEH} EH/s, indicating robust security and mining participation.`
        );
      }
    }

    // Ethereum tips
    if (cryptoData.ethereum) {
      const eth = cryptoData.ethereum;
      
      if (eth.market_price_usd) {
        // Convert ETH price to user's currency
        const ethPriceInUserCurrency = convertFromUSD(eth.market_price_usd, userCurrency);
        tips.push(
          `💎 Ethereum is currently priced at ${formatCurrency(ethPriceInUserCurrency, userCurrency)}, powering DeFi, NFTs, and smart contracts.`
        );
      }

      if (eth.transactions_24h) {
        tips.push(
          `🚀 Ethereum processed ${eth.transactions_24h.toLocaleString()} transactions in 24h, with gas fees at ${eth.average_transaction_fee_24h_usd ? formatCurrency(eth.average_transaction_fee_24h_usd, 'USD') : 'variable rates'}.`
        );
      }
    }

    // Get region-specific investment advice
    const regionTip = getRegionSpecificCryptoTip(userCurrency, marketSentiment.sentiment);
    if (regionTip) {
      tips.push(regionTip);
    }

    // Add general investment advice based on market sentiment
    if (marketSentiment.sentiment === 'bearish') {
      tips.push(
        `🛡️ In bearish markets, focus on research and building your knowledge. Consider setting limit orders at key support levels.`
      );
    } else if (marketSentiment.sentiment === 'bullish') {
      tips.push(
        `🚀 During bullish trends, don't get caught in FOMO. Stick to your investment strategy and consider taking profits.`
      );
    } else {
      tips.push(
        `📊 Consider dollar-cost averaging (DCA) into crypto investments rather than trying to time the market perfectly.`
      );
    }

    // Always include security tip
    tips.push(
      `🔒 Crypto security: Enable 2FA, use hardware wallets for large amounts, and never share your private keys.`
    );

    // Add a safety tip
    tips.push(
      `⚠️ Crypto investing tip: Only invest what you can afford to lose. Cryptocurrency markets are highly volatile.`
    );

    // Shuffle tips and return a selection - prioritize market trends and regional tips
    const importantTips = tips.filter(tip => 
      tip.includes('Market sentiment') || 
      tip.includes('is up') || 
      tip.includes('🇿🇦') || 
      tip.includes('🇺🇸') || 
      tip.includes('🇪🇺') || 
      tip.includes('🇬🇧') ||
      tip.includes('🇦🇺') ||
      tip.includes('🇨🇦') ||
      tip.includes('🇯🇵')
    );

    const otherTips = tips.filter(tip => !importantTips.includes(tip));
    const shuffledOtherTips = otherTips.sort(() => Math.random() - 0.5);
    
    // Always include at least one important tip if available
    if (importantTips.length > 0) {
      return [
        importantTips[0],
        ...shuffledOtherTips
      ].slice(0, 3);
    } else {
      return shuffledOtherTips.slice(0, 3);
    }

  } catch (error) {
    console.error('Error generating crypto tips:', error);
    return getFallbackCryptoTips(userCurrency);
  }
};

// Get Bitcoin price trend suggestion based on market sentiment
const getBitcoinPriceTrend = (sentiment = 'neutral', userCurrency = 'USD') => {
  // Bullish market trends
  const bullishTrends = [
    "Consider taking profits at predetermined targets.",
    "Stay disciplined during rallies to avoid emotional decisions.",
    "Remember to rebalance your portfolio if allocations shift significantly.",
    "Consider setting trailing stop-losses to protect gains.",
    "Even in bull markets, avoid overleveraging your position."
  ];

  // Bearish market trends
  const bearishTrends = [
    "Consider averaging into positions during downturns.",
    "Focus on projects with strong fundamentals during bear markets.",
    "Bear markets are often when long-term wealth is built.",
    "Maintain an emergency fund before adding to crypto positions.",
    "Consider setting limit orders at key technical support levels."
  ];

  // Neutral market trends
  const neutralTrends = [
    "Consider dollar-cost averaging for steady accumulation.",
    "Research before making any investment decisions.",
    "Volatility creates both opportunities and risks.",
    "Long-term holders often weather short-term fluctuations better.",
    "Market sentiment can change rapidly in crypto.",
    "Consider your risk tolerance before investing."
  ];
  
  // Select appropriate trend based on market sentiment
  let selectedTrends;
  switch (sentiment) {
    case 'bullish':
      selectedTrends = bullishTrends;
      break;
    case 'bearish':
      selectedTrends = bearishTrends;
      break;
    default:
      selectedTrends = neutralTrends;
  }

  // Return a random trend from the selected category
  return selectedTrends[Math.floor(Math.random() * selectedTrends.length)];
};

// Region specific crypto tips based on currency and market sentiment
const getRegionSpecificCryptoTip = (userCurrency, marketSentiment = 'neutral') => {
  // Base region tips that apply regardless of market sentiment
  const baseRegionTips = {
    'ZAR': [
      `🇿🇦 South African crypto investors can use platforms like Luno, VALR, or AltCoinTrader with direct ZAR deposits.`,
      `🇿🇦 South African exchanges offer direct ZAR-to-crypto trading pairs, avoiding USD conversion fees.`,
      `🇿🇦 Keep updated on SARB and FSCA crypto regulations which are evolving in South Africa.`
    ],
    'USD': [
      `🇺🇸 US investors have access to regulated platforms like Coinbase, Gemini, and Kraken with strong consumer protections.`,
      `🇺🇸 US crypto regulations vary by state - check your state's specific laws regarding crypto trading.`,
      `🇺🇸 Consider spot Bitcoin ETFs now available on US exchanges for regulated crypto exposure.`
    ],
    'EUR': [
      `🇪🇺 European crypto traders often use platforms like Bitstamp and Kraken that offer EUR deposits via SEPA.`,
      `🇪🇺 The EU's MiCA regulations provide consistent protections for crypto investors across member states.`,
      `🇪🇺 Consider European crypto ETPs (Exchange Traded Products) for regulated crypto exposure.`
    ],
    'GBP': [
      `🇬🇧 UK investors can use FCA-registered platforms like Coinbase, eToro, and Kraken for GBP deposits.`,
      `🇬🇧 Consider Bitcoin ETNs (Exchange Traded Notes) available on London markets for regulated exposure.`,
      `🇬🇧 Keep detailed records of all crypto transactions for UK tax reporting and self-assessment returns.`
    ],
    'AUD': [
      `🇦🇺 Australian crypto investors typically use local platforms like CoinSpot, Swyftx, or Independent Reserve.`,
      `🇦🇺 Consider BTC and ETH ETFs now available on the Australian Securities Exchange for regulated exposure.`,
      `🇦🇺 AUSTRAC regulates Australian crypto exchanges - ensure your platform is properly registered.`
    ],
    'CAD': [
      `🇨🇦 Canadian investors typically use Newton, Shakepay, or Bitbuy for CAD to crypto conversions.`,
      `🇨🇦 Consider Purpose Bitcoin ETF and other crypto ETFs available on Toronto Stock Exchange.`,
      `🇨🇦 Canadian securities regulators have approved several crypto ETFs for regulated market exposure.`
    ],
    'JPY': [
      `🇯🇵 Japanese crypto traders often use DMM Bitcoin, bitFlyer, or Coincheck with JPY banking integration.`,
      `🇯🇵 Japan's Financial Services Agency provides strong oversight of registered crypto exchanges.`,
      `🇯🇵 Consider Japan's unique crypto tax implications which can reach up to 55% for high earners.`
    ]
  };

  // Additional sentiment-specific regional tips
  const sentimentRegionTips = {
    'bullish': {
      'ZAR': [
        `🇿🇦 South African investors: During bullish cycles, remember SARS taxes crypto gains. Set aside funds for tax obligations.`,
        `🇿🇦 ZAR exchange rates can add volatility to crypto investments - consider the currency risk in bull markets.`
      ],
      'USD': [
        `🇺🇸 US investors: Remember that even in bull markets, crypto gains are taxable events. Track your trades carefully.`,
        `🇺🇸 Consider US-based regulated products like Bitcoin futures and options for hedging during market rallies.`
      ],
      'EUR': [
        `🇪🇺 European investors: MiCA regulations provide safeguards but don't eliminate market risks in bullish cycles.`,
        `🇪🇺 Consider Euro-denominated stablecoins as a hedge to lock in profits during market uptrends.`
      ],
      'GBP': [
        `🇬🇧 UK investors: HMRC treats crypto as assets subject to capital gains tax. Consider annual tax allowances when taking profits.`,
        `🇬🇧 UK crypto users can utilize ISA-eligible products like Bitcoin ETNs for tax-efficient exposure in bull markets.`
      ],
      'AUD': [
        `🇦🇺 Australian investors: ATO is increasing crypto tax enforcement. Ensure proper record-keeping during bull markets.`,
        `🇦🇺 Consider ASX Bitcoin ETFs as a regulated alternative during bullish cycles while maintaining tax compliance.`
      ]
    },
    'bearish': {
      'ZAR': [
        `🇿🇦 South African investors: ZAR volatility can compound crypto market downturns. Consider stablecoins for capital preservation.`,
        `🇿🇦 Bear markets can offer tax-loss harvesting opportunities under SARS rules - consult with a tax professional.`
      ],
      'USD': [
        `🇺🇸 US investors: Bear markets provide tax-loss harvesting opportunities. Consider strategic selling for tax benefits.`,
        `🇺🇸 IRS allows wash sale rules for crypto currently - consult a tax professional about optimizing your position.`
      ],
      'EUR': [
        `🇪🇺 European investors: Bear markets are good times to review the security of your crypto storage and update protections.`,
        `🇪🇺 Consider the different tax treatments across EU countries for losses in bear markets.`
      ],
      'GBP': [
        `🇬🇧 UK investors: Crypto losses can be offset against capital gains in the UK. Keep detailed records during market downturns.`,
        `🇬🇧 Bear markets are good times to ensure your crypto platform has proper FCA registration for better protection.`
      ],
      'AUD': [
        `🇦🇺 Australian investors: Bear markets offer tax-loss harvesting opportunities under ATO rules.`,
        `🇦🇺 Consider dollar-cost averaging in AUD to take advantage of both crypto prices and potential currency advantages.`
      ]
    }
  };

  // Select the base region tips
  if (!baseRegionTips[userCurrency]) {
    return null;
  }

  // 70% chance of using a regular region tip
  if (Math.random() < 0.7 || !sentimentRegionTips[marketSentiment]?.[userCurrency]) {
    return baseRegionTips[userCurrency][Math.floor(Math.random() * baseRegionTips[userCurrency].length)];
  }
  
  // 30% chance of using a sentiment-specific region tip
  const sentimentTips = sentimentRegionTips[marketSentiment][userCurrency];
  if (sentimentTips && sentimentTips.length > 0) {
    return sentimentTips[Math.floor(Math.random() * sentimentTips.length)];
  }
  
  // Fallback to base region tips
  return baseRegionTips[userCurrency][Math.floor(Math.random() * baseRegionTips[userCurrency].length)];
};

// Fallback crypto tips when API is unavailable
const getFallbackCryptoTips = (userCurrency) => {
  // General tips that apply to all regions
  const generalTips = [
    `💡 Crypto investing tip: Start with established cryptocurrencies like Bitcoin and Ethereum before exploring altcoins.`,
    `🔐 Security first: Use reputable exchanges, enable two-factor authentication, and consider cold storage for large holdings.`,
    `📈 Dollar-cost averaging (DCA) is a popular strategy to reduce the impact of volatility when investing in crypto.`,
    `⚠️ Never invest more than you can afford to lose in cryptocurrency. The market is highly volatile and speculative.`,
    `🎯 Diversification applies to crypto too - don't put all your funds into a single cryptocurrency.`,
    `📚 Education is key: Understand blockchain technology and the specific use cases of cryptocurrencies you invest in.`
  ];

  // Region-specific crypto tips based on currency
  const regionSpecificTips = {
    'ZAR': [
      `🇿🇦 In South Africa, popular crypto platforms include Luno, VALR, and AltCoinTrader. Always verify platform security and regulation compliance.`,
      `🇿🇦 South African crypto regulations are evolving - keep updated on SARB and FSCA guidelines for crypto assets.`,
      `🇿🇦 Consider tax implications in South Africa: SARS views crypto as intangible assets subject to capital gains tax.`
    ],
    'USD': [
      `🇺🇸 US investors should be aware of SEC regulations and IRS tax guidelines for cryptocurrency investments.`,
      `🇺🇸 Consider US-based regulated exchanges like Coinbase, Kraken, and Gemini for compliant crypto trading.`,
      `🇺🇸 For US tax purposes, crypto is treated as property - track all transactions for accurate reporting.`
    ],
    'EUR': [
      `🇪🇺 European crypto investors benefit from MiCA regulations providing consistent protections across the EU.`,
      `🇪🇺 European platforms like Bitstamp and Bitpanda offer Euro deposit options and comply with EU regulations.`,
      `🇪🇺 VAT treatment of crypto varies across EU countries - research your specific country's regulations.`
    ],
    'GBP': [
      `🇬🇧 UK crypto investors should use FCA-registered platforms for enhanced consumer protection.`,
      `🇬🇧 UK tax rules treat crypto as assets for capital gains purposes - maintain detailed transaction records.`,
      `🇬🇧 Crypto platforms like Coinjar and Kraken offer GBP banking support for UK residents.`
    ],
    'AUD': [
      `🇦🇺 Australian crypto investors have access to AUSTRAC-registered exchanges like CoinSpot and Swyftx.`,
      `🇦🇺 The ATO considers crypto as property for tax purposes - track your transactions carefully.`,
      `🇦🇺 Consider self-managed super funds (SMSF) for cryptocurrency investment in Australia.`
    ],
    'CAD': [
      `🇨🇦 Canadian crypto investors can use platforms like Newton, Bitbuy, and Shakepay for CAD deposits.`,
      `🇨🇦 The CRA treats crypto as commodities for tax purposes - report capital gains and trading income.`,
      `🇨🇦 Consider crypto ETFs approved by Canadian securities regulators for regulated exposure.`
    ],
    'JPY': [
      `🇯🇵 Japan has progressive crypto regulations with exchanges registered with the FSA for consumer protection.`,
      `🇯🇵 Japanese crypto profits are classified as miscellaneous income and taxed at rates up to 55%.`,
      `🇯🇵 Major Japanese platforms like bitFlyer and Coincheck offer local banking integration.`
    ]
  };

  // Combine general and region-specific tips
  let fallbackTips = [...generalTips];
  
  // Add region-specific tips if available
  const regionTips = regionSpecificTips[userCurrency];
  if (regionTips && regionTips.length > 0) {
    fallbackTips = fallbackTips.concat(regionTips);
  }

  // Return 2-3 random fallback tips
  const shuffledTips = fallbackTips.sort(() => Math.random() - 0.5);
  return shuffledTips.slice(0, 3);
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

// Get crypto price trend indicator
const getPriceTrendIcon = (percentage) => {
  if (!percentage) return '↔️';
  if (percentage > 5) return '🚀';
  if (percentage > 2) return '📈';
  if (percentage > 0) return '↗️';
  if (percentage < -5) return '📉';
  if (percentage < -2) return '↘️';
  if (percentage < 0) return '↓';
  return '↔️';
};

// Get current crypto market summary
export const getCryptoMarketSummary = async (userCurrency = 'USD') => {
  try {
    const cryptoData = await getCryptoStats();
    
    if (!cryptoData) {
      return "Unable to fetch current crypto market data. Check your internet connection.";
    }

    // Get market sentiment
    const sentiment = getMarketSentiment(cryptoData);
    const sentimentEmoji = sentiment.sentiment === 'bullish' ? '🐂' : (sentiment.sentiment === 'bearish' ? '🐻' : '🦘');

    let summary = `📊 Crypto Market Summary ${sentimentEmoji}\n`;
    
    // Add global market data if available
    if (cryptoData.marketTrends?.data) {
      const globalData = cryptoData.marketTrends.data;
      const marketCap = globalData.total_market_cap.usd;
      const marketCapChange = globalData.market_cap_change_percentage_24h_usd;
      const btcDominance = globalData.market_cap_percentage.btc;
      
      summary += `Market Cap: ${formatCurrency(marketCap, 'USD')} (${marketCapChange > 0 ? '+' : ''}${marketCapChange.toFixed(2)}%)\n`;
      summary += `BTC Dominance: ${btcDominance.toFixed(2)}%\n\n`;
    }
    
    // Add top cryptocurrencies
    if (cryptoData.topCryptos && cryptoData.topCryptos.length > 0) {
      summary += "Top Cryptocurrencies:\n";
      
      // Add top 5 cryptocurrencies with price and 24h change
      cryptoData.topCryptos.slice(0, 5).forEach(coin => {
        const priceInUserCurrency = convertFromUSD(coin.current_price, userCurrency);
        const change24h = coin.price_change_percentage_24h;
        const trendIcon = getPriceTrendIcon(change24h);
        
        summary += `• ${coin.name} (${coin.symbol.toUpperCase()}): ${formatCurrency(priceInUserCurrency, userCurrency)} ${trendIcon} ${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%\n`;
      });
    } else {
      // Fallback to Blockchair data if CoinGecko data is unavailable
      if (cryptoData.bitcoin && cryptoData.bitcoin.market_price_usd) {
        const btcPriceInUserCurrency = convertFromUSD(cryptoData.bitcoin.market_price_usd, userCurrency);
        summary += `• Bitcoin (BTC): ${formatCurrency(btcPriceInUserCurrency, userCurrency)}\n`;
      }
      
      if (cryptoData.ethereum && cryptoData.ethereum.market_price_usd) {
        const ethPriceInUserCurrency = convertFromUSD(cryptoData.ethereum.market_price_usd, userCurrency);
        summary += `• Ethereum (ETH): ${formatCurrency(ethPriceInUserCurrency, userCurrency)}\n`;
      }
    }

    // Add market sentiment insights
    summary += `\nMarket Insight: ${sentiment.reason}. `;
    
    if (sentiment.sentiment === 'bullish') {
      summary += "Consider taking profits at key resistance levels.";
    } else if (sentiment.sentiment === 'bearish') {
      summary += "Consider dollar-cost averaging at support levels.";
    } else {
      summary += "Focus on projects with strong fundamentals.";
    }

    summary += `\n\n⏰ Last updated: ${new Date().toLocaleString()}`;
    
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