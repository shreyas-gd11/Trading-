const axios = require("axios");
const indicatorService = require("./indicatorService");
const strategyService = require("./strategyService");
const Signal = require("../models/Signal");

const INSTRUMENTS = {
  NIFTY: "NSE_INDEX|Nifty 50",
  BANKNIFTY: "NSE_INDEX|Nifty Bank",
  FINNIFTY: "NSE_INDEX|Nifty Financial Services"
};

const marketService = {

  // ================= MAIN ANALYSIS =================
  async analyzeMarket(symbol = "NIFTY") {
    try {
      const marketData = await this.fetchMarketData(symbol);
      const vix = await this.fetchVIX();

      const timeframes = {};

      for (const [tf, candles] of Object.entries(marketData)) {
        const analysis = this.analyzeTimeframe(candles);
        timeframes[tf] = analysis;
      }

      // Use 5m timeframe for final decision
      const decision = strategyService.evaluateStrategies(
        marketData["5m"]
      );

      // --- Risk-Reward & Signal Saving ---
      const currentPrice = marketData["5m"][marketData["5m"].length - 1].close;
      let stopLoss = 0, target = 0;

      // Simple 1:2 Risk-Reward logic for demo (adjust based on ATR or Strategy)
      if (decision.Final === 'BUY') {
        stopLoss = currentPrice * 0.995; // 0.5% SL
        target = currentPrice * 1.01;    // 1.0% Target
      } else if (decision.Final === 'SELL') {
        stopLoss = currentPrice * 1.005;
        target = currentPrice * 0.99;
      }

      const rrRatio = this.calculateRiskReward(currentPrice, stopLoss, target);

      if (decision.Final === 'BUY' || decision.Final === 'SELL') {
        await this.saveSignal(symbol, decision, currentPrice, stopLoss, target, rrRatio);
      }
      // -----------------------------------

      return {
        symbol,
        vix,
        timestamp: new Date().toISOString(),
        timeframes,
        finalSignal: decision.Final,
        riskReward: rrRatio,
        levels: { stopLoss: stopLoss.toFixed(2), target: target.toFixed(2) },
        confidence: decision.Confidence,
        strategies: {
          SMA: decision.SMA,
          Breakout: decision.Breakout,
          RSI: decision.RSI,
          Scalping: decision.Scalping
        }
      };

    } catch (error) {
      console.error("Market analysis error:", error.message);
      throw error;
    }
  },

  // ================= ANALYZE ONE TF =================
  analyzeTimeframe(candles) {
    return strategyService.evaluateStrategies(candles);
  },

  // ================= TREND DETECTION =================
  detectTrend(price, ema20, ema50) {
    if (price > ema20 && ema20 > ema50) return "BULLISH";
    if (price < ema20 && ema20 < ema50) return "BEARISH";
    return "SIDEWAYS";
  },

  // ================= LIVE DATA FROM UPSTOX =================
  async fetchMarketData(symbol) {
    const inst = INSTRUMENTS[symbol];
    if (!inst) throw new Error("Invalid symbol");

    return {
      "5m": await this.getCandles(inst, "5minute"),
      "15m": await this.getCandles(inst, "15minute"),
      "1H": await this.getCandles(inst, "30minute"), 
      "1D": await this.getCandles(inst, "day")
    };
  },

  // ================= HELPER: FETCH CANDLES =================
  async getCandles(inst, interval) {
    const url = `https://api.upstox.com/v2/historical-candle/${inst}/${interval}`;

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`
      }
    });

    return res.data.data.candles.map(c => ({
      timestamp: c[0],
      open: c[1],
      high: c[2],
      low: c[3],
      close: c[4],
      volume: c[5]
    }));
  },

  // ================= VIX (OPTIONAL REAL) =================
  async fetchVIX() {
    try {
      const url = `https://api.upstox.com/v2/market-quote/NSE_INDEX|India VIX`;

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`
        }
      });

      return res.data.data.last_price;

    } catch {
      return 15; // fallback value
    }
  },

  // ================= RISK-REWARD CALCULATOR =================
  calculateRiskReward(entry, stopLoss, target) {
    if (!entry || !stopLoss || !target) return "N/A";
    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(target - entry);
    if (risk === 0) return "0:0";
    const ratio = reward / risk;
    return `1:${ratio.toFixed(2)}`;
  },

  // ================= SAVE SIGNAL TO DB =================
  async saveSignal(symbol, decision, price, sl, tgt, rr) {
    try {
      const newSignal = new Signal({
        symbol,
        signal: decision.Final,
        price,
        stopLoss: sl.toFixed(2),
        target: tgt.toFixed(2),
        riskRewardRatio: rr,
        reason: decision.SMA || "Strategy Signal",
        confidence: decision.Confidence
      });
      await newSignal.save();
      console.log(`Signal saved: ${symbol} ${decision.Final} @ ${price}`);
    } catch (err) {
      console.error("Failed to save signal:", err.message);
    }
  }

};

module.exports = marketService;
