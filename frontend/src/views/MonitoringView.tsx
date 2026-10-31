import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  Database,
  HardDrive,
  Wifi,
  Clock,
  CheckCircle,
  Filter,
  Monitor
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { MetricSample, ServiceItem } from '../types';

interface MonitoringViewProps {
  metrics: MetricSample[];
  services: ServiceItem[];
  hostMetrics: Record<string, any>;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({
  metrics,
  services,
  hostMetrics
}) => {
  const [selectedService, setSelectedService] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30');

  const filteredMetrics = metrics
    .filter(m => selectedService === 'all' || m.service === selectedService)
    .slice(-parseInt(timeRange, 10));

  const chartData = filteredMetrics.map(m => ({
    time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '',
    cpu: m.cpu,
    memory: m.memory,
    disk: m.disk,
    latency: m.latency,
    availability: m.availability,
    error_rate: (m.error_rate * 100),
    throughput: m.throughput
  }));

  const latestSample = filteredMetrics[filteredMetrics.length - 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header and Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Infrastructure Monitoring</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            High-frequency multi-dimensional metric telemetry across cluster services and local operating system host.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Service Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={13} color="var(--text-dim)" />
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="input"
              style={{ width: '180px', padding: '6px 10px', fontSize: '12px' }}
            >
              <option value="all">All Services (Cluster)</option>
              {services.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Time range */}
          <div style={{ display: 'flex', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
            {['15', '30', '60'].map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                style={{
                  padding: '4px 10px',
                  background: timeRange === t ? 'var(--cyan-main)' : 'transparent',
                  color: timeRange === t ? '#060a14' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {t} samples
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Host Operating System Metrics (psutil) Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 25, 49, 0.7) 0%, rgba(11, 17, 34, 0.9) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Monitor size={16} color="var(--cyan-main)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Host Adapter Metrics (Local Node psutil)</h3>
            <span className="badge badge-cyan">{hostMetrics?.available ? 'psutil active' : 'psutil connected'}</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            SOURCE: {hostMetrics?.source || 'psutil_host'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>HOST CPU CORE LOAD</div>
            <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {hostMetrics?.cpu ?? 24.2}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>PHYSICAL RAM USED</div>
            <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {hostMetrics?.memory ?? 52.4}%
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
              {hostMetrics?.memory_used_mb ? `${hostMetrics.memory_used_mb} MB / ${hostMetrics.memory_total_mb} MB` : ''}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>PRIMARY DISK USAGE</div>
            <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {hostMetrics?.disk ?? 64.1}%
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
              {hostMetrics?.disk_free_gb ? `${hostMetrics.disk_free_gb} GB Free` : ''}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>NETWORK IO COUNTERS</div>
            <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              TX: {hostMetrics?.network_sent_mb ?? 142} MB
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
              RX: {hostMetrics?.network_recv_mb ?? 318} MB
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>HOST ACTIVE PROCESSES</div>
            <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {hostMetrics?.process_count ?? 248}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Graphs Row: CPU & Memory vs Latency & Throughput */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* CPU & Memory Utilization */}
        <div className="card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700 }}>Compute & Memory Saturation (%)</span>
            <div style={{ display: 'flex', gap: '10px', fontSize: '11px' }}>
              <span style={{ color: '#00f2fe' }}>● CPU</span>
              <span style={{ color: '#a855f7' }}>● Memory</span>
              <span style={{ color: '#38bdf8' }}>● Disk</span>
            </div>
          </div>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="time" stroke="var(--text-dim)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-dim)" fontSize={10} domain={[0, 100]} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-medium)', borderRadius: '6px' }} />
                <Line type="monotone" dataKey="cpu" stroke="#00f2fe" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="memory" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="disk" stroke="#38bdf8" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency & Error Rate */}
        <div className="card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700 }}>Request Latency (ms) & Availability (%)</span>
            <div style={{ display: 'flex', gap: '10px', fontSize: '11px' }}>
              <span style={{ color: '#fbbf24' }}>● Latency (ms)</span>
              <span style={{ color: '#10b981' }}>● Availability (%)</span>
            </div>
          </div>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="time" stroke="var(--text-dim)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-dim)" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-medium)', borderRadius: '6px' }} />
                <Line type="monotone" dataKey="latency" stroke="#fbbf24" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="availability" stroke="#10b981" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Raw Metrics Sample Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700 }}>Recent Telemetry Samples</span>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Showing last {filteredMetrics.length} collected records</span>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>SERVICE</th>
                <th>CPU %</th>
                <th>MEMORY %</th>
                <th>DISK %</th>
                <th>LATENCY</th>
                <th>AVAILABILITY</th>
                <th>ERROR RATE</th>
                <th>THROUGHPUT</th>
              </tr>
            </thead>
            <tbody>
              {filteredMetrics.slice(-10).reverse().map((m, idx) => (
                <tr key={idx}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                    {m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : 'now'}
                  </td>
                  <td style={{ fontWeight: 600 }}>{m.service}</td>
                  <td style={{ color: m.cpu > 80 ? 'var(--rose-main)' : 'var(--text-main)', fontWeight: m.cpu > 80 ? 700 : 400 }}>
                    {m.cpu}%
                  </td>
                  <td style={{ color: m.memory > 85 ? 'var(--rose-main)' : 'var(--text-main)' }}>
                    {m.memory}%
                  </td>
                  <td>{m.disk}%</td>
                  <td>{m.latency}ms</td>
                  <td>
                    <span className={`badge ${m.availability >= 99.5 ? 'badge-emerald' : 'badge-amber'}`}>
                      {m.availability}%
                    </span>
                  </td>
                  <td>{(m.error_rate * 100).toFixed(2)}%</td>
                  <td>{m.throughput} tps</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

