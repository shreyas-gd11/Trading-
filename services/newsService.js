const axios = require('axios');

const NEWS_ENDPOINT = 'https://gnews.io/api/v4/search';
const NEWS_API_ENDPOINT = 'https://newsapi.org/v2/everything';
const DEFAULT_MAX = 100;
const DEFAULT_LANG = process.env.NEWS_LANG || 'en';
const DEFAULT_COUNTRY = process.env.NEWS_COUNTRY || 'in';
const CACHE_MS = Number(process.env.NEWS_CACHE_MS || 120000);

// Mock news data for fallback
const MOCK_ARTICLES = [
  {
    source: { name: 'Economic Times' },
    title: 'Nifty 50 hits fresh all-time high on global cues and FII inflows',
    description: 'The Nifty 50 index reached its highest level ever, driven by strong foreign investor inflows and positive global market sentiment.',
    url: 'https://economictimes.indiatimes.com/news',
    urlToImage: 'https://via.placeholder.com/400x300?text=Nifty+50',
    publishedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    content: 'Strong buying momentum in IT and financial stocks pushed indices to new peaks.'
  },
  {
    source: { name: 'Moneycontrol' },
    title: 'Reliance Industries shows strong growth in Q3 earnings',
    description: 'Reliance Industries reported better-than-expected Q3 earnings with strong cash flow generation.',
    url: 'https://moneycontrol.com/news',
    urlToImage: 'https://via.placeholder.com/400x300?text=Reliance',
    publishedAt: new Date(Date.now() - 1 * 60 * 60000).toISOString(),
    content: 'Strong operational performance drives investor optimism on the stock.'
  },
  {
    source: { name: 'BSE' },
    title: 'TCS shares rally on strong order book and digital transformation',
    description: 'TCS saw investor enthusiasm following announcements of significant new client wins.',
    url: 'https://bseindia.com/news',
    urlToImage: 'https://via.placeholder.com/400x300?text=TCS',
    publishedAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    content: 'Digital transformation trends continue to drive demand for TCS services.'
  },
  {
    source: { name: 'Livemint' },
    title: 'HDFC Bank announces shareholder returns and expansion plans',
    description: 'HDFC Bank declared interim dividend and announced plans for expansion in retail banking.',
    url: 'https://livemint.com/news',
    urlToImage: 'https://via.placeholder.com/400x300?text=HDFC+Bank',
    publishedAt: new Date(Date.now() - 3 * 60 * 60000).toISOString(),
    content: 'The bank aims to strengthen its digital banking capabilities and customer base.'
  },
  {
    source: { name: 'Financial Express' },
    title: 'Infosys wins major contract from Fortune 500 company',
    description: 'Infosys announced a significant digital transformation contract worth $150 million.',
    url: 'https://financialexpress.com/news',
    urlToImage: 'https://via.placeholder.com/400x300?text=Infosys',
    publishedAt: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
    content: 'The contract highlights growing demand for digital services in the enterprise sector.'
  },
  {
    source: { name: 'NSE News' },
    title: 'BREAKING: RBI signals pause in rate hikes; bond market rallies',
    description: 'The Reserve Bank of India indicates a possible pause in the interest rate hiking cycle.',
    url: 'https://nseindia.com/news',
    urlToImage: 'https://via.placeholder.com/400x300?text=RBI+News',
    publishedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    content: 'Market participants expect a shift in monetary policy stance going forward.'
  }
];

const SYMBOL_QUERIES = {
  NIFTY: 'NIFTY OR "Nifty 50" OR "Nifty50" OR NSE',
  BANKNIFTY: '"Bank Nifty" OR BANKNIFTY OR "Nifty Bank"',
  FINNIFTY: '"Fin Nifty" OR FINNIFTY OR "Nifty Financial Services"',
  RELIANCE: '"Reliance Industries" OR RELIANCE',
  TCS: '"Tata Consultancy Services" OR TCS',
  INFY: 'Infosys OR INFY',
  HDFCBANK: '"HDFC Bank" OR HDFCBANK'
};

const POSITIVE_TERMS = [
  'gain','gains','surge','surges','rise','rises','rally','rallies','jump','jumps',
  'beat','beats','record','strong','stronger','upgrade','upgraded','profit','profits',
  'growth','expands','expansion','bull','bullish','outperform','buyback','win','wins'
];

const NEGATIVE_TERMS = [
  'fall','falls','drop','drops','slump','slumps','decline','declines','miss','misses',
  'weak','weaker','downgrade','downgraded','loss','losses','cut','cuts','bear','bearish',
  'selloff','plunge','plunges','lawsuit','probe','fraud','risk'
];

const cache = new Map();

function buildQuery(symbol, overrideQuery) {
  if (overrideQuery && overrideQuery.trim()) return overrideQuery.trim();
  const key = (symbol || 'NIFTY').toUpperCase();
  return SYMBOL_QUERIES[key] || key;
}

function scoreSentiment(text) {
  const content = (text || '').toLowerCase();
  let score = 0;

  for (const term of POSITIVE_TERMS) {
    const re = new RegExp(`\\b${term}\\b`, 'g');
    score += (content.match(re) || []).length;
  }
  for (const term of NEGATIVE_TERMS) {
    const re = new RegExp(`\\b${term}\\b`, 'g');
    score -= (content.match(re) || []).length;
  }

  if (score >= 2) return { sentiment: 'positive', score };
  if (score <= -2) return { sentiment: 'negative', score };
  return { sentiment: 'neutral', score };
}

function isBreaking(publishedAt) {
  if (!publishedAt) return false;
  const published = new Date(publishedAt).getTime();
  if (Number.isNaN(published)) return false;
  return Date.now() - published <= 60 * 60 * 1000;
}

function normalizeArticle(article) {
  const title = article?.title || 'Untitled';
  const description = article?.description || '';
  const source = article?.source?.name || 'Unknown';
  const url = article?.url || '';
  const image = article?.image || '';
  const publishedAt = article?.publishedAt || null;
  const sentiment = scoreSentiment(`${title} ${description}`);
  const breaking = isBreaking(publishedAt);

  return {
    title,
    description,
    source,
    url,
    image,
    publishedAt,
    sentiment: sentiment.sentiment,
    sentimentScore: sentiment.score,
    isBreaking: breaking
  };
}

async function fetchNews({ symbol, query, limit }) {
  const max = Math.max(1, Math.min(Number(limit) || DEFAULT_MAX, 100));
  const finalQuery = buildQuery(symbol, query);
  const cacheKey = `${finalQuery}|${max}|${DEFAULT_LANG}|${DEFAULT_COUNTRY}`;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_MS) {
    return cached.payload;
  }

  let articles = [];
  
  // Primary: Try GNEWS_API_KEY
  const apiKey = process.env.GNEWS_API_KEY;
  
  if (apiKey) {
    try {
      console.log(`[News] Attempting to fetch from GNews API for symbol: ${symbol}`);
      const response = await axios.get(NEWS_ENDPOINT, {
        params: {
          q: finalQuery,
          lang: DEFAULT_LANG,
          country: DEFAULT_COUNTRY,
          max,
          sortby: 'publishedAt',
          in: 'title,description',
          apikey: apiKey
        },
        timeout: 12000
      });

      articles = Array.isArray(response.data?.articles) ? response.data.articles : [];
      if (articles.length > 0) {
        console.log(`✓ [News] Fetched ${articles.length} articles from GNews API`);
      } else {
        throw new Error('No articles returned from GNews API');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.errors?.[0] || error.message;
      console.warn(`⚠ [News] GNews API failed: ${errorMsg}`);
      console.log('[News] Falling back to mock data...');
      articles = MOCK_ARTICLES;
    }
  } else {
    console.log('[News] No API key configured, using mock data');
    articles = MOCK_ARTICLES;
  }

  const toTime = (value) => {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  const normalized = articles.map(normalizeArticle).sort((a, b) => {
    return toTime(b.publishedAt) - toTime(a.publishedAt);
  });

  const summary = {
    total: normalized.length,
    positive: 0,
    negative: 0,
    neutral: 0,
    breaking: 0
  };

  for (const item of normalized) {
    if (summary[item.sentiment] !== undefined) {
      summary[item.sentiment] += 1;
    }
    if (item.isBreaking) summary.breaking += 1;
  }

  const payload = {
    symbol: (symbol || 'NIFTY').toUpperCase(),
    query: finalQuery,
    refreshedAt: new Date().toISOString(),
    summary,
    topHeadline: normalized[0] || null,
    articles: normalized
  };

  cache.set(cacheKey, { timestamp: Date.now(), payload });
  return payload;
}

module.exports = { fetchNews };
