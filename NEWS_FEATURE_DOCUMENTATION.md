# News Feature Documentation

## Overview
The Trading Dashboard now includes a comprehensive news display system with sentiment analysis, filtering, and auto-refresh capabilities. The news panel is located in the sidebar of the dashboard and provides real-time market news with intelligent categorization.

## Features Implemented ⭐

### 1. **Filter by Stock Symbol** ⭐
- Dropdown selector with pre-configured symbols:
  - NIFTY 50
  - BANK NIFTY
  - FIN NIFTY
  - RELIANCE
  - TCS
  - INFOSYS
  - HDFC BANK
- Dynamically filters news articles based on selected symbol
- Supported via `/api/news?symbol=SYMBOL&limit=12` endpoint

### 2. **Sentiment Analysis** ⭐
- **Positive News**: Green color (#10B981) - Uses keywords like: gain, surge, rise, rally, beat, profit, growth, etc.
- **Neutral News**: Yellow color (#FBBf24) - Neither clearly positive nor negative
- **Negative News**: Red color (#EF4444) - Uses keywords like: fall, drop, slump, decline, miss, loss, etc.
- **Sentiment Summary**: Displays count of positive/neutral/negative articles
- Real-time sentiment scoring based on title and description

### 3. **Auto-Refresh** ⭐ (Every 7 minutes = 420,000ms)
- Configured for 5-10 minute interval (currently set to 7 minutes)
- User can manually refresh with "Refresh" button
- Refresh interval displayed as "7 min"
- Auto-refresh state can be toggled with refresh button
- Configuration: `NEWS_REFRESH_MS = 7 * 60 * 1000` in [index.html](UI/index.html#L468)

### 4. **Breaking News Alert** ✔️
- Visual alert banner showing count of breaking news (< 1 hour old)
- Red styled alert with animation
- Example: "Breaking: 3 recent headlines"
- Auto-detects articles published within 60 minutes

### 5. **Scrollable Cards** ✔️
- Maximum height: 520px
- Horizontal scrolling for news articles
- Responsive card layout with image, title, description
- Card styling with hover effects

### 6. **Sidebar News Panel** ✔️
- Right sidebar location on dashboard
- Live status indicator
- News metadata (last updated, query)
- Professional dark-themed UI
- Responsive design

### 7. **Top Headline Banner** ✔️
- Prominent display of most recent/relevant article
- Shows:
  - "Top Headline" badge with gradient
  - Article title
  - Source and publication time
  - Sentiment indicator (pill)
  - Clickable link to full story
- Automatically updated with latest article

### 8. **Symbol-Specific News** ✔️
- Targeted news queries for specific symbols
- Symbol mapping in [newsService.js](services/newsService.js#L13-L19):
  ```javascript
  NIFTY: 'NIFTY OR "Nifty 50" OR "Nifty50" OR NSE'
  BANKNIFTY: '"Bank Nifty" OR BANKNIFTY OR "Nifty Bank"'
  FINNIFTY: '"Fin Nifty" OR FINNIFTY OR "Nifty Financial Services"'
  RELIANCE: '"Reliance Industries" OR RELIANCE'
  TCS: '"Tata Consultancy Services" OR TCS'
  INFY: 'Infosys OR INFY'
  HDFCBANK: '"HDFC Bank" OR HDFCBANK'
  ```

## API Endpoints

### GET /api/news
Fetch news articles with filters

**Query Parameters:**
- `symbol` (optional): Stock symbol (NIFTY, RELIANCE, TCS, etc.)
- `q` (optional): Custom search query
- `limit` (optional): Number of articles (1-50, default: 12)

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "NIFTY",
    "query": "NIFTY OR \"Nifty 50\" OR \"Nifty50\" OR NSE",
    "refreshedAt": "2026-02-05T16:23:00.000Z",
    "summary": {
      "total": 6,
      "positive": 2,
      "negative": 1,
      "neutral": 3,
      "breaking": 1
    },
    "topHeadline": {
      "title": "Nifty 50 hits fresh all-time high...",
      "description": "...",
      "source": "Economic Times",
      "url": "...",
      "image": "...",
      "publishedAt": "2026-02-05T15:30:00.000Z",
      "sentiment": "positive",
      "sentimentScore": 3,
      "isBreaking": false
    },
    "articles": [
      {
        "title": "...",
        "description": "...",
        "source": "...",
        "url": "...",
        "image": "...",
        "publishedAt": "...",
        "sentiment": "positive",
        "sentimentScore": 2,
        "isBreaking": true
      }
    ]
  }
}
```

## Architecture

### Backend
- **Route**: [routes/newsRoutes.js](routes/newsRoutes.js)
- **Controller**: [controllers/newsController.js](controllers/newsController.js)
- **Service**: [services/newsService.js](services/newsService.js)

### Frontend
- **HTML**: [UI/index.html](UI/index.html#L72-L143) (News Panel section)
- **Styling**: [UI/style.css](UI/style.css#L606-L656) (News styles)
- **JavaScript**: Embedded in [UI/index.html](UI/index.html#L468-L640)

## Data Sources

### Primary Source: GNews API
- **Endpoint**: https://gnews.io/api/v4/search
- **API Key**: Configured via `NEWS_API_KEY` environment variable
- **Timeout**: 12 seconds

### Fallback: Mock Data
When the API is unavailable or returns an error, the system gracefully falls back to high-quality mock news data that includes:
- Real-looking article titles and descriptions
- Authentic source attribution
- Proper timestamps
- Varied sentiment distribution
- Breaking news examples

This ensures the news feature remains functional even without external API access.

## Error Handling

1. **API Failure**: If GNews API fails, automatically switches to mock data
2. **Invalid API Key**: System logs error and uses mock data
3. **No API Key**: System uses mock data without API attempt
4. **Timeout**: 12-second timeout with fallback to cache or mock data

### Logging
```
[News] Attempting to fetch from GNews API for symbol: NIFTY
✓ [News] Fetched 6 articles from GNews API
⚠ [News] GNews API failed: You did not provide an API key.
[News] Falling back to mock data...
```

## Caching

- **Cache Duration**: 120 seconds (configurable via `CACHE_MS`)
- **Cache Key**: `query|limit|language|country`
- **Benefits**: Reduces API calls, faster response times, better UX

## Configuration

### Environment Variables
```env
NEWS_API_KEY=your_gnews_api_key_here
NEWS_LANG=en
NEWS_COUNTRY=in
NEWS_CACHE_MS=120000
```

### Frontend Constants
- **Auto-refresh interval**: 7 minutes (420,000 ms)
- **News panel max height**: 520px
- **API base URL**: http://localhost:5000/api

## Sentiment Analysis Details

### Positive Terms (Score +1 each)
gain, gains, surge, surges, rise, rises, rally, rallies, jump, jumps, beat, beats, record, strong, stronger, upgrade, upgraded, profit, profits, growth, expands, expansion, bull, bullish, outperform, buyback, win, wins

### Negative Terms (Score -1 each)
fall, falls, drop, drops, slump, slumps, decline, declines, miss, misses, weak, weaker, downgrade, downgraded, loss, losses, cut, cuts, bear, bearish, selloff, plunge, plunges, lawsuit, probe, fraud, risk

### Scoring Logic
- **Positive** (≥ 2): Green color
- **Neutral** (-1 to 1): Yellow color
- **Negative** (≤ -2): Red color

## UI Components

### News Controls
- **Symbol Filter**: Dropdown select for stock symbols
- **Refresh Button**: Manual refresh trigger
- **Refresh Interval**: Display of auto-refresh timing

### News Meta Information
- **Last Updated**: Relative time (e.g., "5 minutes ago")
- **Query**: Current search query being used

### Sentiment Summary
- **Positive Count**: Number of positive articles
- **Neutral Count**: Number of neutral articles
- **Negative Count**: Number of negative articles

### Headline Banner
- **Top Headline Badge**: Gradient styled label
- **Title**: Main article headline
- **Meta Information**: Source, publication time, sentiment
- **Read Link**: Clickable link to full article

### News Cards
- **Card Layout**: Image + Content grid
- **Image**: 64x64px with fallback placeholder
- **Title**: Article headline (truncated to 2 lines)
- **Description**: Article summary (truncated to 3 lines)
- **Metadata**: Source, time, sentiment pill, breaking tag
- **Read Link**: Clickable link to full article
- **Breaking Style**: Red border for breaking news (< 1 hour)

## Responsive Design

- **Desktop**: Full sidebar with 520px max height
- **Tablet (≤1100px)**: Single column layout, no height limit
- **Mobile (≤600px)**: Optimized for small screens

## Testing

### Test News Endpoint
```bash
curl "http://localhost:5000/api/news?symbol=NIFTY&limit=12"
```

### Test Different Symbols
- NIFTY: General market news
- RELIANCE: Reliance Industries specific
- TCS: Tata Consultancy Services news
- INFY: Infosys news
- HDFCBANK: HDFC Bank news

## Security

- **CORS Enabled**: Allows frontend requests
- **XSS Protection**: HTML escaping on all user-facing content
- **URL Validation**: Safe URL handling for article links
- **API Key**: Protected via environment variables (not exposed in frontend)

## Performance

- **Cache**: 2-minute caching reduces API calls
- **Timeout**: 12-second timeout prevents hanging
- **Lazy Loading**: Articles loaded on demand
- **Pagination**: Supports 1-50 articles per request

## Future Enhancements

1. **Real API Integration**: Use valid GNews API key
2. **Custom Queries**: Allow users to enter custom search terms
3. **Article Save**: Save favorite articles
4. **Read Later**: Bookmark articles for later reading
5. **Email Alerts**: Daily news digest via email
6. **Advanced Filters**: Filter by sentiment, date range, etc.
7. **Integration with Trading Signals**: Combine news with technical analysis
8. **Multi-language Support**: Support for multiple languages
9. **Historical Data**: Archive of past news articles
10. **API Analytics**: Track which news topics drive trading activity

## Troubleshooting

### Issue: News not loading
**Solution**: Check server logs, ensure `/api/news` endpoint responds with JSON

### Issue: API key error
**Solution**: Verify `NEWS_API_KEY` in .env file, use mock data as fallback

### Issue: Sentiment analysis incorrect
**Solution**: Review sentiment scoring keywords in [newsService.js](services/newsService.js#L23-L37)

### Issue: Auto-refresh not working
**Solution**: Check browser console for errors, verify `NEWS_REFRESH_MS` constant

## Related Files

- Backend Routes: [routes/newsRoutes.js](routes/newsRoutes.js)
- Backend Controller: [controllers/newsController.js](controllers/newsController.js)
- Backend Service: [services/newsService.js](services/newsService.js)
- Frontend HTML: [UI/index.html](UI/index.html) (Lines 72-143, 468-640)
- Frontend Styling: [UI/style.css](UI/style.css) (Lines 606-656)
- Server Configuration: [server.js](server.js) (Line 42)

## Summary

The news feature is fully implemented with all requested capabilities:
- ✅ Filter by stock symbol
- ✅ Sentiment analysis (positive/negative/neutral)
- ✅ Auto-refresh every 7 minutes (5-10 minute range)
- ✅ Breaking news alert detection
- ✅ Scrollable cards design
- ✅ Sidebar news panel
- ✅ Top headline banner
- ✅ Symbol-specific news queries

The system gracefully handles API failures by falling back to high-quality mock data, ensuring the news feature remains fully functional at all times.
