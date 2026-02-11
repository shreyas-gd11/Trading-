const strategyService = {
  // Apply strategy rules and return decision
  getDecision(timeframes, vix) {
    const tf1D = timeframes['1D'];
    const tf1H = timeframes['1H'];
    const tf5m = timeframes['5m'];

    const vixThreshold = 15;
    const rsiThreshold = 70;

    // Rule 1: If 1D trend is Bearish → AVOID
    if (tf1D.trend === 'BEARISH') {
      return {
        action: 'AVOID',
        reason: 'Daily timeframe is in a bearish trend. Avoid trading until trend reverses.'
      };
    }

    // Rule 2: If 1D and 1H and 5m are Bullish AND VIX < 15 AND RSI < 70 → TRADE
    const allBullish = tf1D.trend === 'BULLISH' && 
                       tf1H.trend === 'BULLISH' && 
                       tf5m.trend === 'BULLISH';
    
    const vixLow = vix < vixThreshold;
    const rsiOk = parseFloat(tf5m.indicators.rsi) < rsiThreshold;

    if (allBullish && vixLow && rsiOk) {
      return {
        action: 'TRADE',
        reason: `All timeframes bullish, VIX is low (${vix.toFixed(2)} < ${vixThreshold}), and RSI is healthy (${tf5m.indicators.rsi} < ${rsiThreshold}). Good trading opportunity.`
      };
    }

    // Rule 3: Otherwise → WAIT
    const reasons = [];
    
    if (!allBullish) {
      const nonBullish = [];
      if (tf1D.trend !== 'BULLISH') nonBullish.push('Daily');
      if (tf1H.trend !== 'BULLISH') nonBullish.push('1H');
      if (tf5m.trend !== 'BULLISH') nonBullish.push('5m');
      reasons.push(`Not all timeframes are bullish (${nonBullish.join(', ')} ${nonBullish.length === 1 ? 'is' : 'are'} ${nonBullish.map((tf, i) => {
        const trendMap = { 'Daily': tf1D.trend, '1H': tf1H.trend, '5m': tf5m.trend };
        return trendMap[tf];
      }).join(', ')})`);
    }
    
    if (!vixLow) {
      reasons.push(`VIX is elevated (${vix.toFixed(2)} >= ${vixThreshold})`);
    }
    
    if (!rsiOk) {
      reasons.push(`RSI is overbought (${tf5m.indicators.rsi} >= ${rsiThreshold})`);
    }

    return {
      action: 'WAIT',
      reason: `Waiting for better conditions. ${reasons.join('. ')}.`
    };
  }
};

module.exports = strategyService;