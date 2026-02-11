# Trading Project 📈

An AI-powered stock market analysis and trading signals application with real-time market data, news sentiment analysis, and intelligent trading recommendations.

## Features

- 🤖 **AI Trading Signals** - Real-time market analysis using EMA and RSI indicators
- 📊 **Live Market Data** - Connected to Upstox API for real-time stock quotes
- 📰 **Smart News Feed** - Symbol-focused headlines with sentiment analysis
- 🔔 **Alerts & Notifications** - Price alerts and market condition monitoring
- 💹 **Trading Strategies** - Multiple strategy templates for different market conditions
- 🔐 **Secure Authentication** - User registration and JWT-based login
- 📱 **Responsive Dashboard** - Mobile-friendly trading dashboard

## Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB (local or Atlas)
- MongoDB Compass for database management
- Upstox API integration

**Frontend:**
- HTML5 / CSS3
- Vanilla JavaScript
- Real-time WebSocket updates

## Prerequisites

- Node.js (v14+)
- MongoDB (running locally on localhost:27017)
- MongoDB Compass (optional, for visual DB management)
- Upstox API credentials

## Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/trading-project.git
cd trading-project/backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Setup environment variables:**
Create a `.env` file in the backend directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/stockproject
UPSTOX_API_KEY=your_api_key
UPSTOX_SECRET_KEY=your_secret_key
UPSTOX_ACCESS_TOKEN=your_access_token
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
JWT_SECRET=your_jwt_secret
GNEWS_API_KEY=your_gnews_api_key
NEWS_API_KEY=your_news_api_key
```

4. **Start MongoDB:**
- Open MongoDB Compass
- Ensure local server is running on `localhost:27017`

5. **Start the application:**
```bash
npm start
```

The app will be available at `http://localhost:5000`

## Project Structure

```
backend/
├── controllers/        # Business logic
│   ├── authController.js
│   ├── marketController.js
│   ├── newsController.js
│   └── userController.js
├── services/          # Business services
│   ├── authService.js
│   ├── emailService.js
│   ├── marketService.js
│   ├── newsService.js
│   └── strategyService.js
├── models/            # MongoDB schemas
│   ├── User.js
│   └── Signal.js
├── middleware/        # Express middleware
│   ├── auth.js
│   └── errorHandler.js
├── routes/           # API routes
│   ├── authRoutes.js
│   ├── marketRoutes.js
│   ├── newsRoutes.js
│   └── userRoutes.js
├── UI/               # Frontend files
│   ├── index.html
│   ├── signals.html
│   ├── profile.html
│   ├── style.css
│   └── logic.js
└── server.js         # Main application entry
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Market Data
- `GET /api/market/market-data?symbol=NIFTY` - Get market analysis

### News
- `GET /api/news?symbol=NIFTY&limit=100` - Get news articles with sentiment

### User
- `GET /api/user/profile` - Get user profile (requires auth)
- `PUT /api/user/profile` - Update user profile

## Usage

1. **Sign up** - Create a new account
2. **Login to Upstox** - Click "Login to Upstox" to connect your broker
3. **Analyze Markets** - Select a symbol and run analysis
4. **View Signals** - Check AI trading recommendations
5. **Monitor News** - Track relevant market news with sentiment

## Features in Detail

### Trading Signals
- **RSI Analysis** - Identifies oversold (RSI < 30) and overbought (RSI > 70) conditions
- **EMA Indicators** - 20-period and 50-period exponential moving averages
- **Signal Types** - BUY, SELL, HOLD recommendations based on indicators
- **Confidence Levels** - Medium, High, Verified signals

### News Analysis
- Real-time news aggregation from GNews and NewsAPI
- Sentiment analysis (Positive, Neutral, Negative)
- Breaking news alerts
- Source attribution and publish timestamps

### Market Status
- Live market hours tracking
- Countdown to market open/close
- Extended hours monitoring
- Market volatility indicators

## Database

MongoDB Collections:
- **users** - User accounts and authentication data
- **signals** - Generated trading signals
- **news** - Cached news articles

## Error Handling

The application includes comprehensive error handling:
- MongoDB connection timeout (→ 30s retry)
- API rate limiting for Upstox
- Email service fallback to console logging
- Graceful error messages for users

## Troubleshooting

**MongoDB Connection Error:**
- Verify MongoDB is running: `mongod` or MongoDB Compass is open
- Check connection string in `.env`
- Ensure port 27017 is accessible

**Upstox API Issues:**
- Regenerate access token (expires in ~6 hours)
- Click "Login to Upstox" button to re-authenticate
- Check API credentials in `.env`

**News Not Loading:**
- Verify API keys in `.env`
- Check API rate limits for GNews and NewsAPI
- Clear browser cache and reload

## Performance Optimizations

- Smooth scrolling in news feed
- GPU-accelerated transitions
- Lazy loading for news cards
- Containment layout for better rendering
- CSS will-change for scroll performance

## Future Enhancements

- [ ] Portfolio tracking
- [ ] Strategy backtesting
- [ ] Options calculator
- [ ] Multi-timeframe analysis
- [ ] Mobile app (React Native)
- [ ] Advanced charting
- [ ] Automated trades execution

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@tradingproject.com or open an issue on GitHub.

## Disclaimer

This application is for educational purposes. It provides trading signals and analysis but not financial advice. Always do your own research and consult with a financial advisor before making trading decisions.

---

**Made with ❤️ for traders and developers**
