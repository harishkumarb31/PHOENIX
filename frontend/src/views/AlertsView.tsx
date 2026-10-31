import React from 'react';
import { Bell, CheckCircle, ShieldAlert, AlertTriangle, Clock } from 'lucide-react';
import { AlertItem } from '../types';
import { api } from '../services/api';

interface AlertsViewProps {
  alerts: AlertItem[];
  onRefresh: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onRefresh
}) => {
  const handleAcknowledge = async (id: number) => {
    try {
      await api.acknowledgeAlert(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge alert');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Alerts & Notification Center</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Real-time incident dispatching, threshold alerts, predictive warnings, and acknowledgement logs.
        </p>
      </div>

      {/* Active Alerts Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} color="var(--cyan-main)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Active Alert Notification Queue</h3>
            <span className="badge badge-amber">{alerts.length} total</span>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>SERVICE</th>
                <th>SEVERITY</th>
                <th>TITLE</th>
                <th>MESSAGE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                    No alerts in queue. Telemetry stream is healthy.
                  </td>
                </tr>
              ) : (
                alerts.map((al) => (
                  <tr key={al.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                      {al.created_at ? new Date(al.created_at).toLocaleTimeString() : 'now'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{al.service_name}</td>
                    <td>
                      <span className={`badge ${al.severity === 'critical' ? 'badge-rose' : 'badge-amber'}`}>
                        {al.severity}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{al.title}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{al.message}</td>
                    <td>
                      <span className={`badge ${al.status === 'active' ? 'badge-rose' : 'badge-emerald'}`}>
                        {al.status}
                      </span>
                    </td>
                    <td>
                      {al.status === 'active' ? (
                        <button
                          onClick={() => handleAcknowledge(al.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          ACK
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>ACKED</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

