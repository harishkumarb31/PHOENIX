import React from 'react';
import { TrendingUp, AlertTriangle, ShieldCheck, Clock, Gauge, ArrowUpRight, Activity } from 'lucide-react';
import { PredictionItem } from '../types';

interface FailurePredictionViewProps {
  prediction: PredictionItem | null;
  history: PredictionItem[];
}

export const FailurePredictionView: React.FC<FailurePredictionViewProps> = ({
  prediction,
  history
}) => {
  const currentRisk = prediction ? prediction.risk_score : 14.5;
  const classification = prediction ? prediction.risk_classification : 'low';
  const confidence = prediction ? prediction.confidence_pct : 85.0;
  const horizon = prediction ? prediction.horizon_minutes : 15;
  const drivers = prediction?.drivers || {};

  const badgeColor = (
    classification === 'critical' ? 'badge-rose' :
    classification === 'high' ? 'badge-amber' :
    classification === 'moderate' ? 'badge-amber' : 'badge-emerald'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Predictive Failure Intelligence</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Forecast degradation probabilities, model time-series rate-of-change trajectories, and project service saturation horizons before downtime occurs.
        </p>
      </div>

      {/* Main Prediction Dashboard Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '20px' }}>
        {/* Risk Gauge Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '32px 24px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.8px' }}>
            INFRASTRUCTURE DEGRADATION RISK INDEX
          </span>

          {/* Large Visual Risk Circle */}
          <div style={{
            margin: '24px 0',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: `conic-gradient(${currentRisk > 75 ? '#ef4444' : currentRisk > 45 ? '#f59e0b' : '#00f2fe'} ${currentRisk * 3.6}deg, rgba(255, 255, 255, 0.05) 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: currentRisk > 75 ? '0 0 30px rgba(239, 68, 68, 0.3)' : '0 0 30px rgba(0, 242, 254, 0.2)'
          }}>
            <div style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: 'var(--bg-surface-1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '42px', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                {currentRisk}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>OUT OF 100</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700 }}>Risk Tier:</span>
            <span className={`badge ${badgeColor}`} style={{ fontSize: '13px', padding: '3px 12px' }}>
              {classification.toUpperCase()}
            </span>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-dim)' }}>
            <div>HORIZON: <b style={{ color: 'var(--text-main)' }}>{horizon} MIN</b></div>
            <div>CONFIDENCE: <b style={{ color: 'var(--text-main)' }}>{confidence}%</b></div>
          </div>

          <div style={{
            marginTop: '18px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-2)',
            fontSize: '11px',
            color: 'var(--text-dim)'
          }}>
            Transparent Heuristic Trajectory Model • Non-calibrated probability index
          </div>
        </div>

        {/* Dynamic Risk Drivers & Slope Trajectories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Active Stress Vectors & Rate-of-Change Slopes</h3>
              <span className="badge badge-cyan">FIRST DERIVATIVE (dM/dt)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* CPU Slope */}
              <div style={{ padding: '12px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600 }}>Compute Trajectory Velocity</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan-main)' }}>
                    +{drivers.cpu_rate_pct_sample ?? 0.8}% / sample
                  </span>
                </div>
                <div className="track">
                  <div className="track-bar" style={{ width: `${Math.min(100, (drivers.cpu_rate_pct_sample ?? 0.8) * 25)}%`, background: 'var(--cyan-main)' }} />
                </div>
              </div>

              {/* Memory Slope */}
              <div style={{ padding: '12px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600 }}>Memory Heap Acceleration Rate</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--violet-main)' }}>
                    +{drivers.memory_rate_pct_sample ?? 0.5}% / sample
                  </span>
                </div>
                <div className="track">
                  <div className="track-bar" style={{ width: `${Math.min(100, (drivers.memory_rate_pct_sample ?? 0.5) * 35)}%`, background: 'var(--violet-main)' }} />
                </div>
              </div>

              {/* Latency Slope */}
              <div style={{ padding: '12px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600 }}>API Latency Drift</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-main)' }}>
                    +{drivers.latency_rate_ms_sample ?? 4.2}ms / sample
                  </span>
                </div>
                <div className="track">
                  <div className="track-bar" style={{ width: `${Math.min(100, (drivers.latency_rate_ms_sample ?? 4.2) * 5)}%`, background: 'var(--amber-main)' }} />
                </div>
              </div>
            </div>

            {/* Saturation Estimate */}
            {drivers.projected_time_to_saturation_min && (
              <div style={{
                marginTop: '14px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--rose-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <AlertTriangle size={18} color="var(--rose-main)" />
                <div style={{ fontSize: '12px' }}>
                  <b>Projected Resource Exhaustion:</b> At current acceleration, memory ceiling will breach in approx <b>{drivers.projected_time_to_saturation_min} minutes</b>.
                </div>
              </div>
            )}
          </div>

          {/* Model Explanation Card */}
          <div className="card">
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>ANALYTICAL SYNTHESIS</span>
            <p style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '8px', lineHeight: '1.5' }}>
              {prediction?.explanation || "Operational telemetry is in steady-state equilibrium. Proximity to saturation limits is well within acceptable safety reserves."}
            </p>
          </div>
        </div>
      </div>

      {/* Historical Forecast Records */}
      <div className="card">
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Recent Prediction History</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>TARGET</th>
                <th>RISK SCORE</th>
                <th>CLASSIFICATION</th>
                <th>CONFIDENCE</th>
                <th>SYNTHESIS</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 8).map((p) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                    {p.timestamp ? new Date(p.timestamp).toLocaleTimeString() : 'now'}
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.service_name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{p.risk_score}</td>
                  <td>
                    <span className={`badge ${p.risk_classification === 'critical' ? 'badge-rose' : p.risk_classification === 'high' ? 'badge-amber' : 'badge-emerald'}`}>
                      {p.risk_classification}
                    </span>
                  </td>
                  <td>{p.confidence_pct}%</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.explanation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

