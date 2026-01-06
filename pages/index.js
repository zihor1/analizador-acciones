import React, { useState } from 'react';

export default function StockAnalyzer() {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const API_KEY = 'K8M6NGXSXV0X8GQ3';

  const analyzeStock = async () => {
    if (!symbol.trim()) {
      setError('Ingresa un símbolo válido');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const sym = symbol.toUpperCase().trim();
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${sym}&apikey=${API_KEY}&outputsize=compact`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data['Error Message']) {
        setError(`Símbolo "${sym}" no encontrado`);
        setLoading(false);
        return;
      }
      
      if (data['Note']) {
        setError('Límite de API alcanzado. Espera 1 minuto.');
        setLoading(false);
        return;
      }

      const timeSeries = data['Time Series (Daily)'];
      if (!timeSeries) {
        setError('No se obtuvieron datos');
        setLoading(false);
        return;
      }

      const dates = Object.keys(timeSeries).slice(0, 30);
      const prices = dates.map(d => parseFloat(timeSeries[d]['4. close']));
      const currentPrice = prices[0];
      
      // Calcular RSI simple
      let gains = 0, losses = 0;
      for (let i = 1; i <= 14 && i < prices.length; i++) {
        const change = prices[i-1] - prices[i];
        if (change > 0) gains += change;
        else losses -= change;
      }
      const rsi = 100 - (100 / (1 + (gains/14) / (losses/14)));
      
      // Determinar señal
      let decision = 'MANTENER';
      if (rsi < 30) decision = 'COMPRAR';
      else if (rsi > 70) decision = 'VENDER';
      
      setResult({
        symbol: sym,
        price: currentPrice,
        rsi: rsi.toFixed(1),
        decision
      });
      
    } catch (err) {
      setError('Error de conexión');
    }
    
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #1e293b, #1e40af, #1e293b)', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ background: 'linear-gradient(to right, #2563eb, #7c3aed)', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', color: 'white' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Analizador de Acciones</h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>Busca cualquier acción - Datos reales de Alpha Vantage</p>
        </div>

        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Símbolo de la Acción</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && analyzeStock()}
              placeholder="AAPL, MSFT, GOOGL..."
              style={{ flex: 1, padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '1.1rem' }}
            />
            <button
              onClick={analyzeStock}
              disabled={loading}
              style={{ padding: '0.75rem 2rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
            >
              {loading ? 'Analizando...' : 'Analizar'}
            </button>
          </div>
          
          {error && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#fee2e2', border: '2px solid #ef4444', borderRadius: '0.5rem', color: '#991b1b' }}>
              {error}
            </div>
          )}
        </div>

        {result && (
          <div style={{ background: result.decision === 'COMPRAR' ? '#10b981' : result.decision === 'VENDER' ? '#ef4444' : '#eab308', borderRadius: '1rem', padding: '2rem', color: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{result.decision}</h2>
                <p style={{ fontSize: '1.3rem', opacity: 0.9 }}>RSI: {result.rsi}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', opacity: 0.8, marginBottom: '0.3rem' }}>{result.symbol}</div>
                <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>${result.price.toFixed(2)}</div>
              </div>
            </div>
            
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1rem' }}>Interpretación:</h3>
              {result.decision === 'COMPRAR' && (
                <p>✅ RSI en sobreventa. Posible oportunidad de compra. Entra con stop-loss del 7-10%.</p>
              )}
              {result.decision === 'VENDER' && (
                <p>⚠️ RSI en sobrecompra. Considera tomar ganancias o activar stop-loss.</p>
              )}
              {result.decision === 'MANTENER' && (
                <p>⏸️ RSI neutral. Sin señal clara. Mantén posición con stop-loss o espera mejor momento para entrar.</p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
