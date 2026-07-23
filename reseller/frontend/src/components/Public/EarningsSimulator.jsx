import React, { useState, useEffect } from 'react';  
  
const EarningsSimulator = () => {  
  const [visitors, setVisitors] = useState(1000);  
  const [convRate, setConvRate] = useState(3.5);  
  const [avgComm, setAvgComm] = useState(2500);  
  
  const [daily, setDaily] = useState(0);  
  const [monthly, setMonthly] = useState(0);  
  const [annual, setAnnual] = useState(0);  
  
  useEffect(() => {  
    const conversions = visitors * (convRate / 100);  
    const dailyVal = conversions * avgComm / 30;  
    const monthlyVal = conversions * avgComm;  
    const annualVal = monthlyVal * 12;  
    setDaily(dailyVal);  
    setMonthly(monthlyVal);  
    setAnnual(annualVal);  
  }, [visitors, convRate, avgComm]);  
  
  return (  
    <div>  
      <h3 style={{fontWeight:'700',fontSize:'1.1rem'}}>Earnings Simulator</h3>  
      <p className="text-muted">Adjust the sliders to see your potential income.</p>  
      <div className="earnings-sliders">  
        <div className="slider-group">  
          <label>Monthly Visitors <span className="slider-value">{visitors.toLocaleString()}</span></label>  
          <input type="range" min="100" max="10000" step="100" value={visitors} onChange={(e) => setVisitors(Number(e.target.value))} />  
        </div>  
        <div className="slider-group">  
          <label>Conversion Rate (%) <span className="slider-value">{convRate}</span></label>  
          <input type="range" min="0.5" max="10" step="0.1" value={convRate} onChange={(e) => setConvRate(Number(e.target.value))} />  
        </div>  
        <div className="slider-group">  
          <label>Average Commission (PKR) <span className="slider-value">₨ {avgComm.toLocaleString()}</span></label>  
          <input type="range" min="500" max="10000" step="100" value={avgComm} onChange={(e) => setAvgComm(Number(e.target.value))} />  
        </div>  
      </div>  
      <div className="earnings-result">  
        <div className="stat"><div className="num">₨ {Math.round(daily).toLocaleString()}</div><div className="label">Daily</div></div>  
        <div className="stat"><div className="num">₨ {Math.round(monthly).toLocaleString()}</div><div className="label">Monthly</div></div>  
        <div className="stat"><div className="num">₨ {Math.round(annual).toLocaleString()}</div><div className="label">Annual</div></div>  
      </div>  
      <p className="text-muted text-center" style={{fontSize:'0.75rem',marginTop:'8px'}}>* Illustrative examples only. Actual earnings depend on performance.</p>  
    </div>  
  );  
};  
  
export default EarningsSimulator;
