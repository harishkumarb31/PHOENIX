import React, { useState } from 'react';
import { AlertTriangle, Filter, Sparkles, Activity, ShieldAlert, Cpu, Database, HardDrive, Clock } from 'lucide-react';
import { AnomalyItem } from '../types';

interface AnomalyIntelligenceViewProps {
  anomalies: AnomalyItem[];
  onNavigateIncident: (incidentId: number) => void;
}

export const AnomalyIntelligenceView: React.FC<AnomalyIntelligenceViewProps> = ({
  anomalies,
  onNavigateIncident
}) => {
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filtered = anomalies.filter(a => {
    if (methodFilter !== 'all' && a.detection_method !== methodFilter) return false;
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Intelligent Anomaly Detection</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Modular multi-tier anomaly engine combining deterministic SLA threshold checking, rolling standard-deviation Z-score spikes, and Scikit-Learn Isolation Forest unsupervised outlier analysis.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="input"
            style={{ width: '180px', padding: '6px 10px', fontSize: '12px' }}
          >
            <option value="all">All Detection Methods</option>
            <option value="threshold_rule">Rule-Based Threshold</option>
            <option value="statistical_zscore">Statistical Z-Score Spike</option>
            <option value="ml_isolation_forest">Scikit-Learn Isolation Forest</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="input"
            style={{ width: '140px', padding: '6px 10px', fontSize: '12px' }}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>
        </div>
      </div>

      {/* Detection Tiers Breakdown Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-cyan">TIER 1</span>
            <span style={{ fontSize: '12px', fontWeight: 700 }}>Static SLA Thresholds</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Deterministic boundaries (CPU &gt; 85%, RAM &gt; 88%, Latency &gt; 650ms, Availability &lt; 98.5%). Instantaneous SLA breach alerting.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-amber">TIER 2</span>
            <span style={{ fontSize: '12px', fontWeight: 700 }}>Statistical Z-Score Analysis</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Rolling mean and standard deviation windowing (&gt; 2.8σ). Catches sudden non-linear rate-of-change spikes before full saturation.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-violet">TIER 3</span>
            <span style={{ fontSize: '12px', fontWeight: 700 }}>Isolation Forest (Scikit-Learn)</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Unsupervised multivariate distribution outlier model (v1.4.2). Detects multi-dimensional telemetry covariance anomalies.
          </p>
        </div>
      </div>

      {/* Anomaly Stream Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="var(--amber-main)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Live Anomaly Detection Stream</h3>
            <span className="badge badge-amber">{filtered.length} records</span>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>SERVICE</th>
                <th>METRIC</th>
                <th>OBSERVED / EXPECTED</th>
                <th>DEVIATION</th>
                <th>SEVERITY</th>
                <th>DETECTION ENGINE</th>
                <th>EXPLANATION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                    No anomalies found matching current filter parameters.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const methodLabel = (
                    a.detection_method === 'ml_isolation_forest' ? 'Isolation Forest ML' :
                    a.detection_method === 'statistical_zscore' ? 'Statistical Z-Score' : 'Threshold SLA'
                  );
                  const methodColor = (
                    a.detection_method === 'ml_isolation_forest' ? 'badge-violet' :
                    a.detection_method === 'statistical_zscore' ? 'badge-amber' : 'badge-cyan'
                  );
                  return (
                    <tr key={a.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                        {a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : 'now'}
                      </td>
                      <td style={{ fontWeight: 600 }}>{a.service_name}</td>
                      <td>
                        <span style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          {a.metric_name}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        <span style={{ color: a.severity === 'critical' ? 'var(--rose-main)' : 'var(--amber-main)', fontWeight: 700 }}>
                          {a.current_value}
                        </span>
                        <span style={{ color: 'var(--text-dim)', margin: '0 4px' }}>/</span>
                        <span style={{ color: 'var(--text-dim)' }}>{a.expected_value}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--rose-main)', fontWeight: 600 }}>
                        +{a.deviation_pct}%
                      </td>
                      <td>
                        <span className={`badge ${a.severity === 'critical' ? 'badge-rose' : a.severity === 'high' ? 'badge-amber' : 'badge-cyan'}`}>
                          {a.severity}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${methodColor}`}>
                          {methodLabel}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '360px' }}>
                        {a.explanation}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

