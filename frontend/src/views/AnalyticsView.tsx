import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Printer, TrendingUp, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export const AnalyticsView: React.FC = () => {
  const [summary, setSummary] = useState<any | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getAnalyticsSummary(days)
      .then(data => setSummary(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [days]);

  const handleDownloadCSV = () => {
    window.open('/api/v1/analytics/export-csv', '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Reliability Analytics & Executive Reports</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Service level objective (SLO) compliance, mean-time metrics, incident recurrence rates, and CSV audit reports calculated strictly from stored records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value, 10))}
            className="input"
            style={{ width: '130px', fontSize: '12px' }}
          >
            <option value="7">Last 7 Days</option>
            <option value="14">Last 14 Days</option>
            <option value="30">Last 30 Days</option>
          </select>

          <button onClick={handleDownloadCSV} className="btn btn-secondary btn-sm">
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button onClick={handlePrint} className="btn btn-primary btn-sm">
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Primary Reliability Metrics Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="card">
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>MEAN TIME TO DETECT</span>
            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '8px', color: 'var(--cyan-main)' }}>
              {summary.mttd_seconds}s
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>Autonomous anomaly engine</div>
          </div>

          <div className="card">
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>MEAN TIME TO RESOLVE</span>
            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '8px', color: '#34d399' }}>
              {summary.mttr_minutes}m
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>Approval to verified healthy</div>
          </div>

          <div className="card">
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>INFRASTRUCTURE AVAILABILITY</span>
            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '8px' }}>
              {summary.infrastructure_availability_pct}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>Across all monitored nodes</div>
          </div>

          <div className="card">
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>RECOVERY SUCCESS RATE</span>
            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '8px', color: 'var(--cyan-main)' }}>
              {summary.recovery_success_rate_pct}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>Verified remediation cycles</div>
          </div>

          <div className="card">
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>INCIDENT RECURRENCE RATE</span>
            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '8px', color: summary.recurrence_rate_pct > 15 ? 'var(--rose-main)' : 'var(--text-main)' }}>
              {summary.recurrence_rate_pct}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>Repeat failure prevention</div>
          </div>
        </div>
      )}

      {/* Incident Distribution Breakdown */}
      {summary && (
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Incident Severity & Remediation Distribution</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', textAlign: 'center' }}>
            <div style={{ padding: '16px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--rose-main)', fontWeight: 700 }}>CRITICAL INCIDENTS</div>
              <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
                {summary.severity_distribution.critical}
              </div>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--amber-main)', fontWeight: 700 }}>HIGH SEVERITY</div>
              <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
                {summary.severity_distribution.high}
              </div>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--cyan-main)', fontWeight: 700 }}>TOTAL RESOLVED</div>
              <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
                {summary.resolved_incidents} / {summary.total_incidents}
              </div>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--violet-main)', fontWeight: 700 }}>TOTAL EXECUTIONS</div>
              <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
                {summary.total_recovery_executions}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

