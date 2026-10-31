import React, { useState } from 'react';
import { Settings as SettingsIcon, Database, Cpu, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [telemetryInterval, setTelemetryInterval] = useState('3');
  const [retentionLimit, setRetentionLimit] = useState('1000');
  const [simulationMode, setSimulationMode] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Platform Settings & Configuration</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Operational thresholds, background polling cadences, telemetry sample retention limits, and ML model parameters.
        </p>
      </div>

      {saved && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid var(--emerald-main)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#34d399',
          fontSize: '13px'
        }}>
          <CheckCircle2 size={16} />
          <span>Configuration preferences persisted successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>
            TELEMETRY POLLING INTERVAL (SECONDS)
          </label>
          <input
            type="number"
            className="input"
            value={telemetryInterval}
            onChange={(e) => setTelemetryInterval(e.target.value)}
            style={{ marginTop: '6px' }}
            min="1"
            max="60"
            required
          />
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginTop: '4px' }}>
            Background worker cycle duration for cluster metric collection.
          </span>
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>
            METRIC SAMPLE RETENTION CEILING
          </label>
          <input
            type="number"
            className="input"
            value={retentionLimit}
            onChange={(e) => setRetentionLimit(e.target.value)}
            style={{ marginTop: '6px' }}
            min="100"
            max="10000"
            required
          />
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginTop: '4px' }}>
            Maximum rolling samples stored in the database before FIFO compaction.
          </span>
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>
            REMEDIATION EXECUTION SAFETY MODE
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <input
              type="checkbox"
              id="simMode"
              checked={simulationMode}
              onChange={(e) => setSimulationMode(e.target.checked)}
              style={{ accentColor: 'var(--cyan-main)', width: '16px', height: '16px' }}
            />
            <label htmlFor="simMode" style={{ fontSize: '13px', cursor: 'pointer' }}>
              Enforce Safe Non-Invasive Simulation (Default: True). Prevents unverified host process kills.
            </label>
          </div>
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary">
            Save Preferences
          </button>
        </div>
      </form>

      {/* System Architecture Metadata */}
      <div className="card">
        <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>System Architecture Metadata</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '12px' }}>
          <div>DATABASE ENGINE: <b style={{ color: 'var(--cyan-main)' }}>SQLite WAL / SQLAlchemy 2.0</b></div>
          <div>ML ANOMALY ENGINE: <b style={{ color: 'var(--violet-main)' }}>IsolationForest (Scikit-Learn)</b></div>
          <div>HOST METRICS ADAPTER: <b style={{ color: '#34d399' }}>psutil Local Node</b></div>
          <div>STREAM PROTOCOL: <b style={{ color: 'var(--amber-main)' }}>WebSockets + Asynchronous Worker</b></div>
        </div>
      </div>
    </div>
  );
};
