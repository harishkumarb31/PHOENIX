import React from 'react';
import {
  Activity,
  Flame,
  Clock,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Server,
  ArrowRight,
  ChevronRight,
  Zap,
  Cpu,
  Database,
  HardDrive
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { DashboardOverview, MetricSample } from '../types';

interface CommandCenterViewProps {
  overview: DashboardOverview | null;
  metrics: MetricSample[];
  onNavigate: (view: string) => void;
  onSimulateFault: () => void;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  overview,
  metrics,
  onNavigate,
  onSimulateFault
}) => {
  if (!overview) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Loading Command Center telemetry...</div>
      </div>
    );
  }

  // Format metric samples for chart
  const chartData = metrics.slice(-25).map(m => ({
    time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '',
    cpu: m.cpu,
    memory: m.memory,
    latency: m.latency
  }));

  const riskClass = overview.risk.classification.toLowerCase();
  const riskBadge = riskClass === 'critical' ? 'badge-rose' : riskClass === 'high' ? 'badge-amber' : riskClass === 'moderate' ? 'badge-amber' : 'badge-emerald';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Welcome Banner */}
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(11, 17, 34, 0.9) 0%, rgba(16, 25, 49, 0.8) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-cyan">AUTONOMOUS SRE PLATFORM</span>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>SYSTEM STATUS:</span>
            <span className={`badge ${overview.counts.critical_services > 0 ? 'badge-rose' : 'badge-emerald'}`}>
              {overview.status.toUpperCase()}
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Command <span style={{ color: 'var(--cyan-main)' }}>Center</span>
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '640px' }}>
            Continuous real-time telemetry observation, explainable multi-tier anomaly detection, predictive failure risk modeling, and approval-gated self-healing remediation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onNavigate('monitoring')}
            className="btn btn-secondary"
          >
            <Activity size={14} />
            <span>Telemetry Inspector</span>
          </button>
          <button
            onClick={onSimulateFault}
            className="btn btn-primary"
          >
            <Zap size={14} />
            <span>Simulate Anomaly</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Monitored Services Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>MONITORED SERVICES</span>
            <Server size={16} color="var(--cyan-main)" />
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {overview.counts.total_services}
            </span>
            <span style={{ fontSize: '12px', color: '#10b981' }}>
              {overview.counts.healthy_services} healthy
            </span>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
            {overview.counts.degraded_services > 0 && (
              <span className="badge badge-amber" style={{ fontSize: '10px' }}>{overview.counts.degraded_services} degraded</span>
            )}
            {overview.counts.critical_services > 0 && (
              <span className="badge badge-rose" style={{ fontSize: '10px' }}>{overview.counts.critical_services} critical</span>
            )}
          </div>
        </div>

        {/* Compute Utilization */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>COMPUTE UTILIZATION</span>
            <Cpu size={16} color="var(--blue-main)" />
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {overview.averages.cpu}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>%</span>
          </div>
          <div className="track" style={{ marginTop: '12px' }}>
            <div
              className="track-bar"
              style={{
                width: `${Math.min(100, overview.averages.cpu)}%`,
                background: overview.averages.cpu > 85 ? 'var(--rose-main)' : overview.averages.cpu > 70 ? 'var(--amber-main)' : 'var(--cyan-main)'
              }}
            />
          </div>
        </div>

        {/* Memory Pressure */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>MEMORY PRESSURE</span>
            <Database size={16} color="var(--violet-main)" />
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {overview.averages.memory}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>%</span>
          </div>
          <div className="track" style={{ marginTop: '12px' }}>
            <div
              className="track-bar"
              style={{
                width: `${Math.min(100, overview.averages.memory)}%`,
                background: overview.averages.memory > 85 ? 'var(--rose-main)' : overview.averages.memory > 75 ? 'var(--amber-main)' : 'var(--violet-main)'
              }}
            />
          </div>
        </div>

        {/* Infrastructure Risk Index */}
        <div className="card" style={{ borderColor: overview.risk.score > 70 ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>FAILURE RISK SCORE</span>
            <TrendingUp size={16} color="var(--amber-main)" />
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {overview.risk.score}
            </span>
            <span className={`badge ${riskBadge}`}>{overview.risk.classification.toUpperCase()}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>
            Forecast horizon: 15 min • Heuristic trend model
          </div>
        </div>
      </div>

      {/* Main Grid: Telemetry Chart & Failure Risk Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Telemetry Stream Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '360px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.5px' }}>
                OBSERVABILITY / 01
              </span>
              <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Real-Time Cluster Telemetry</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f2fe' }} />
                <span>CPU %</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7' }} />
                <span>Memory %</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} />
                <span>Latency ms</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="time" stroke="var(--text-dim)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-dim)" fontSize={10} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface-2)',
                    borderColor: 'var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    color: 'var(--text-main)'
                  }}
                />
                <Line type="monotone" dataKey="cpu" stroke="#00f2fe" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="memory" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <span>SAMPLE INTERVAL: 3 SECONDS</span>
            <span>ROLLING SAMPLES: 25 WINDOW</span>
          </div>
        </div>

        {/* Predictive Failure Risk & Top Consumers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Resource Consuming Services */}
          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>TOP RESOURCE CONSUMERS</span>
              <button
                onClick={() => onNavigate('services')}
                style={{ background: 'transparent', border: 'none', color: 'var(--cyan-main)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                All Services <ChevronRight size={12} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {overview.top_consumers.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.status === 'healthy' ? '#10b981' : '#ef4444' }} />
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--font-mono)' }}>
                    <span>CPU: {c.cpu}%</span>
                    <span style={{ color: 'var(--text-dim)' }}>MEM: {c.memory}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SRE Reliability Performance Card */}
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 25, 49, 0.6) 0%, rgba(22, 34, 66, 0.4) 100%)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>SRE RELIABILITY BENCHMARK</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '12px' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>MEAN TIME TO DETECT</div>
                <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--cyan-main)' }}>
                  {overview.averages.mttd_seconds}s
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>MEAN TIME TO RESOLVE</div>
                <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                  {overview.averages.mttr_minutes}m
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>AVAILABILITY SLA</div>
                <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {overview.averages.availability}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>ROUNDTRIP LATENCY</div>
                <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {overview.averages.latency}ms
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Row: Open Incidents & Recent Recovery Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Active Open Incidents */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={16} color="var(--rose-main)" />
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Active Incident Queue</h3>
              <span className="badge badge-rose">{overview.open_incidents.length}</span>
            </div>
            <button
              onClick={() => onNavigate('incidents')}
              style={{ background: 'transparent', border: 'none', color: 'var(--cyan-main)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Open Incident Center <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {overview.open_incidents.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>
                No active incidents detected. All services operating nominally.
              </div>
            ) : (
              overview.open_incidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => onNavigate('incidents')}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-2)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-main)' }}>{inc.incident_number}</span>
                      <span className={`badge ${inc.severity === 'critical' ? 'badge-rose' : 'badge-amber'}`}>{inc.severity}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>• {inc.affected_service_name}</span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px', color: 'var(--text-main)' }}>
                      {inc.title}
                    </div>
                  </div>
                  <ChevronRight size={15} color="var(--text-dim)" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Recovery Operations */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="var(--cyan-main)" />
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Recovery Remediation Log</h3>
            </div>
            <button
              onClick={() => onNavigate('recovery')}
              style={{ background: 'transparent', border: 'none', color: 'var(--cyan-main)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Playbooks <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {overview.recent_executions.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>
                No recent recovery executions recorded.
              </div>
            ) : (
              overview.recent_executions.map((e) => (
                <div
                  key={e.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>Execution #{e.id}</span>
                    <span style={{ color: 'var(--text-dim)', marginLeft: '8px' }}>Incident #{e.incident_id}</span>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
                      Operator: {e.operator} • {e.started_at ? new Date(e.started_at).toLocaleTimeString() : ''}
                    </div>
                  </div>
                  <span className="badge badge-emerald">{e.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
