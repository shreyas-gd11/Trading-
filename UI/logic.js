let timerInterval; // Global timer variable

async function analyzeMarket() {
    const btn = document.querySelector('.analyze-btn');
    const symbol = document.getElementById('instrument').value;
    
    btn.textContent = 'ANALYZING...';
    btn.style.opacity = '0.6';

    try {
        // Call our local backend server
        const response = await fetch(`http://localhost:5000/api/analyze?symbol=${symbol}`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        updateUI(data);
        
    } catch (error) {
        console.error('Analysis failed:', error);
        document.getElementById('signal-reason').textContent = "Error connecting to market data server. Please ensure the backend is running.";
        document.getElementById('signal-output').textContent = "ERR";
        document.getElementById('signal-output').className = "signal-value sell";
    } finally {
        btn.textContent = 'RUN ANALYSIS';
        btn.style.opacity = '1';
    }
}

function updateUI(scenario) {
    // Update Section 2
    document.getElementById('overall-trend').textContent = scenario.overallTrend;
    document.getElementById('overall-trend').className = 'status-value ' + scenario.overallTrend.toLowerCase();
    
    document.getElementById('vix-level').textContent = scenario.vix;
    document.getElementById('vix-env').textContent = scenario.environment;
    document.getElementById('news-events').textContent = scenario.news;

    // Update Section 3
    document.getElementById('daily-trend').textContent = scenario.daily;
    document.getElementById('daily-trend').className = 'timeframe-trend ' + scenario.daily.toLowerCase();
    
    document.getElementById('hourly-trend').textContent = scenario.hourly;
    document.getElementById('hourly-trend').className = 'timeframe-trend ' + scenario.hourly.toLowerCase();
    
    document.getElementById('minute-trend').textContent = scenario.minute;
    document.getElementById('minute-trend').className = 'timeframe-trend ' + scenario.minute.toLowerCase();

    // Update indicator status
    const indicatorStatus = scenario.rsi;
    const indicatorDot = indicatorStatus === 'Neutral' ? 'neutral' : 
                       indicatorStatus === 'Oversold' ? 'confirmed' : 'rejected';
    
    document.getElementById('indicator-status').innerHTML = `
        <div class="indicator-item">
            <div class="indicator-name">RSI</div>
            <div class="indicator-status">
                <span class="indicator-dot ${indicatorDot}"></span>
                <span>${indicatorStatus}</span>
            </div>
        </div>
    `;

    // Update confluence checks
    const timeframeAligned = scenario.daily === scenario.hourly && scenario.hourly === scenario.minute;
    const volatilityFavorable = scenario.environment !== 'High Volatility';
    const indicatorConfirmed = scenario.rsi !== 'Neutral';
    const newsImpactClear = scenario.news === 'No';

    document.getElementById('confluence-checks').innerHTML = `
        <div class="confluence-item">
            <div class="confluence-label">Timeframe Alignment</div>
            <div class="confluence-value">
                <span class="check-icon">${timeframeAligned ? '&check;' : '&times;'}</span>
                <span>${timeframeAligned ? 'Aligned' : 'Not Aligned'}</span>
            </div>
        </div>
        <div class="confluence-item">
            <div class="confluence-label">Volatility Check</div>
            <div class="confluence-value">
                <span class="check-icon">${volatilityFavorable ? '&check;' : '&times;'}</span>
                <span>${volatilityFavorable ? 'Favorable' : 'High Risk'}</span>
            </div>
        </div>
        <div class="confluence-item">
            <div class="confluence-label">Indicator Confirmation</div>
            <div class="confluence-value">
                <span class="check-icon">${indicatorConfirmed ? '&check;' : '&times;'}</span>
                <span>${indicatorConfirmed ? 'Confirmed' : 'Neutral'}</span>
            </div>
        </div>
        <div class="confluence-item">
            <div class="confluence-label">News Impact</div>
            <div class="confluence-value">
                <span class="check-icon">${newsImpactClear ? '&check;' : '&times;'}</span>
                <span>${newsImpactClear ? 'Clear' : 'Event Risk'}</span>
            </div>
        </div>
    `;

    // Update signal output
    document.getElementById('signal-output').textContent = scenario.signal;
    document.getElementById('signal-output').className = 'signal-value ' + scenario.signal.toLowerCase();
    document.getElementById('signal-reason').textContent = scenario.reason;

    // --- COUNTDOWN TIMER ---
    const timerElem = document.getElementById('market-timer') || createTimerElement();
    
    if (timerInterval) clearInterval(timerInterval);
    
    let ms = scenario.timeToEvent;
    
    const tick = () => {
        if (ms <= 0) {
            timerElem.textContent = "Status updating...";
            clearInterval(timerInterval);
            return;
        }
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        timerElem.textContent = `${scenario.nextEventLabel} ${h}h ${m}m ${s}s`;
        ms -= 1000;
    };
    
    tick();
    timerInterval = setInterval(tick, 1000);
}

function createTimerElement() {
    const trend = document.getElementById('overall-trend');
    if(trend && trend.parentNode) {
        const div = document.createElement('div');
        div.id = 'market-timer';
        div.style.cssText = "font-size: 0.9rem; margin-top: 5px; color: #888; font-weight: bold;";
        trend.parentNode.appendChild(div);
        return div;
    }
    return { textContent: '' };
}
    // Initialize with placeholder data or leave empty
    // updateUI(marketScenarios.scenario1); 

