const indicatorService = {
  // Calculate Exponential Moving Average
  calculateEMA(prices, period) {
    if (prices.length < period) {
      return prices[prices.length - 1]; // Return last price if not enough data
    }

    const multiplier = 2 / (period + 1);
    
    // Calculate initial SMA
    let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
    
    // Calculate EMA for remaining prices
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  },

  // Calculate Relative Strength Index
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) {
      return 50; // Return neutral RSI if not enough data
    }

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    // Calculate average gains and losses
    let avgGain = 0;
    let avgLoss = 0;

    // Initial averages
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) {
        avgGain += changes[i];
      } else {
        avgLoss += Math.abs(changes[i]);
      }
    }
    avgGain /= period;
    avgLoss /= period;

    // Smoothed averages
    for (let i = period; i < changes.length; i++) {
      if (changes[i] > 0) {
        avgGain = (avgGain * (period - 1) + changes[i]) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(changes[i])) / period;
      }
    }

    // Calculate RSI
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
  },

  // Calculate Simple Moving Average (helper function)
  calculateSMA(prices, period) {
    if (prices.length < period) {
      return prices.reduce((sum, price) => sum + price, 0) / prices.length;
    }

    const relevantPrices = prices.slice(-period);
    return relevantPrices.reduce((sum, price) => sum + price, 0) / period;
  }
};

module.exports = indicatorService;