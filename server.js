require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const marketRoutes = require('./routes/marketRoutes');
const newsRoutes = require('./routes/newsRoutes');
const errorHandler = require('./middleware/errorHandler');
const Signal = require('./models/Signal');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// Global token (dynamic)
let UPSTOX_ACCESS_TOKEN = process.env.UPSTOX_ACCESS_TOKEN || "";

// ===== STATIC UI =====
const uiPath = path.join(__dirname,'UI');
app.use(express.static(uiPath));

app.get('/',(req,res)=>{
 res.sendFile(path.join(uiPath,'index.html'));
});

// ===== DB =====
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  retryWrites: true,
  w: 'majority'
})
.then(()=>{
  console.log('✓ MongoDB Connected successfully');
  console.log(`  Database: ${mongoose.connection.name}`);
  console.log(`  Host: ${mongoose.connection.host}`);
  console.log(`  Collections: users, signals, etc.`);
})
.catch(err=>{
  console.error('✗ MongoDB Connection Error:', err.message);
  process.exit(1);
});

// ===== ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/news', newsRoutes);

// ===== INDICATORS =====
function EMA(p,n){
 const k=2/(n+1);
 let e=p[0];
 for(let i=1;i<p.length;i++) e=p[i]*k+e*(1-k);
 return e;
}

function RSI(p,n=14){
 if(p.length<n+1) return 50;
 let g=0,l=0;
 for(let i=1;i<=n;i++){
  const d=p[i]-p[i-1];
  d>0?g+=d:l+=Math.abs(d);
 }
 let ag=g/n,al=l/n;
 return al===0?100:100-(100/(1+ag/al));
}

// ===== INSTRUMENTS =====
const INSTRUMENTS={
 NIFTY:'NSE_INDEX|Nifty 50',
 BANKNIFTY:'NSE_INDEX|Nifty Bank',
 FINNIFTY:'NSE_INDEX|Nifty Financial Services'
};

// ===== ANALYZE =====
app.get('/api/analyze', async(req,res)=>{
 try{
  if(!UPSTOX_ACCESS_TOKEN)
   return res.json({error:"Login to Upstox first"});

  const requestedSymbol = (req.query.symbol || "NIFTY").toUpperCase();
  const inst=INSTRUMENTS[requestedSymbol];
  if(!inst) return res.json({error:"Invalid symbol"});

  const quote = await axios.get(
    `https://api.upstox.com/v2/market-quote/ltp?instrument_key=${encodeURIComponent(inst)}`,
    { headers:{ Authorization:`Bearer ${UPSTOX_ACCESS_TOKEN}` }}
  );

  const quoteData = quote.data.data;

  if (!quoteData || Object.keys(quoteData).length === 0) {
    return res.json({ error: "No LTP data" });
  }

  const key = Object.keys(quoteData)[0];
  const ltp = quoteData[key].last_price;

  console.log("LTP:", ltp);


  const today=new Date().toISOString().split('T')[0];
  const prev=new Date(Date.now()-5*86400000).toISOString().split('T')[0];

  const candles=await axios.get(
   `https://api.upstox.com/v2/historical-candle/${encodeURIComponent(inst)}/30minute/${today}/${prev}`,
   {headers:{Authorization:`Bearer ${UPSTOX_ACCESS_TOKEN}`}}
  );

  const data=candles.data.data.candles||[];
  const closes=data.map(c=>c[4]);

  const ema=EMA(closes,20);
  const rsi=RSI(closes);

  let signal="HOLD";
  if(rsi<30) signal="BUY";
  else if(rsi>70) signal="SELL";
  else if(ltp>ema) signal="BUY";
  else signal="SELL";

  await Signal.create({
    symbol: requestedSymbol,
    signal,
    price: ltp,
    stopLoss: null,
    target: null,
    riskRewardRatio: null,
    reason: "Simple RSI/EMA signal",
    confidence: "Medium",
    rsi: Number(rsi.toFixed(2)),
    ema: Number(ema.toFixed(2))
  });

  const vix = 14.2;
  let environment="Calm";
  if(vix>=20) environment="High Volatility";
  else if(vix>=13) environment="Moderate";

  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const ist = new Date(utc + (3600000 * 5.5));
  const day = ist.getDay();
  const totalMins = ist.getHours() * 60 + ist.getMinutes();

  // Mon(1)-Fri(5), 09:15(555) - 15:30(930)
  const isMarketOpen = day >= 1 && day <= 5 && totalMins >= 555 && totalMins <= 930;

  // ===== COUNTDOWN LOGIC =====
  let nextEventLabel = "Opens in";
  let targetTime = new Date(ist);

  if (day === 0 || day === 6) {
    // Weekend -> Next Open (Monday)
    const daysToAdd = day === 6 ? 2 : 1;
    targetTime.setDate(ist.getDate() + daysToAdd);
    targetTime.setHours(9, 15, 0, 0);
  } else {
    if (totalMins < 555) { // Before 9:15 -> Opens Today
      targetTime.setHours(9, 15, 0, 0);
    } else if (totalMins < 930) { // Market Open -> Closes Today
      nextEventLabel = "Closes in";
      targetTime.setHours(15, 30, 0, 0);
    } else { // After 15:30 -> Opens Next Weekday
      targetTime.setDate(ist.getDate() + (day === 5 ? 3 : 1));
      targetTime.setHours(9, 15, 0, 0);
    }
  }
  const timeToEvent = targetTime.getTime() - ist.getTime();

  const reason = `RSI ${rsi.toFixed(2)} and LTP ${ltp.toFixed(2)} vs EMA ${ema.toFixed(2)} suggest ${signal}.`;

  res.json({
   marketStatus: isMarketOpen ? "Open" : "Closed",
   nextEventLabel,
   timeToEvent,
   overallTrend: ltp>ema ? "Bullish":"Bearish",
   vix,
   vixEnv: environment,
   environment,
   rsi: rsi.toFixed(2),
   signal,
   reason
  });

 }catch(err){
  console.error("Analyze error:", err.response?.data || err.message);
  res.status(500).json({
    error: "Analyze failed",
    details: err.response?.data?.message || err.message
  });
 }
});

// ===== OAUTH CALLBACK =====
app.get("/callback", async(req,res)=>{
 try{
   const code=req.query.code;
   console.log("AUTH CODE:",code);
   console.log("KEY:",process.env.UPSTOX_API_KEY);
   console.log("SECRET:",process.env.UPSTOX_API_SECRET || process.env.UPSTOX_SECRET_KEY);

   const r=await axios.post(
     "https://api.upstox.com/v2/login/authorization/token",
     new URLSearchParams({
       code,
       client_id:process.env.UPSTOX_API_KEY,
       client_secret:process.env.UPSTOX_API_SECRET || process.env.UPSTOX_SECRET_KEY,
       redirect_uri:"http://localhost:5000/callback",
       grant_type:"authorization_code"
     }),
     {headers:{"Content-Type":"application/x-www-form-urlencoded"}}
   );

   UPSTOX_ACCESS_TOKEN=r.data.access_token;
   console.log("NEW TOKEN:",UPSTOX_ACCESS_TOKEN);

   res.send("Success!");

 }catch(e){
   console.log("FULL ERROR:",e.response?.data || e.message);
   res.send("OAuth failed - check server console");
 }
});

// ===== TEST =====
app.get("/test",async(req,res)=>{
 try{
  const r=await axios.get(
   "https://api.upstox.com/v2/user/profile",
   {headers:{Authorization:`Bearer ${UPSTOX_ACCESS_TOKEN}`}}
  );
  res.json(r.data);
 }catch(e){
  res.json(e.response?.data||e.message);
 }
});

// ===== START =====
app.use(errorHandler);

app.listen(PORT,()=>console.log("Server running http://localhost:"+PORT));
