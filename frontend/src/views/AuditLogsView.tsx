import React, { useState, useEffect } from 'react';
import { ScrollText, Filter, RefreshCw, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';
import { AuditLogItem } from '../types';
import { api } from '../services/api';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const fetchLogs = () => {
    setLoading(true);
    api.getAuditLogs(50, eventTypeFilter)
      .then(data => setLogs(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [eventTypeFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Audit & Activity Trail</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Immutable security and operational event log recording all user logins, fault injections, plan approvals, playbook executions, and verifications.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="input"
            style={{ width: '180px', fontSize: '12px' }}
          >
            <option value="all">All Event Types</option>
            <option value="auth_login">Authentication Logins</option>
            <option value="incident_created">Incident Creations</option>
            <option value="recovery_execution">Recovery Executions</option>
            <option value="recovery_verification">Verifications</option>
            <option value="fault_scenario_injected">Fault Injections</option>
          </select>

          <button onClick={fetchLogs} className="btn btn-secondary btn-sm">
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>ACTOR</th>
                <th>ROLE</th>
                <th>EVENT TYPE</th>
                <th>TARGET RESOURCE</th>
                <th>RESULT</th>
                <th>METADATA</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                    No audit logs recorded for this criteria.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                      {l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : 'now'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{l.actor_username}</td>
                    <td>
                      <span className="badge badge-cyan">{l.actor_role}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>
                      {l.event_type}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-main)' }}>{l.target_resource}</td>
                    <td>
                      <span className={`badge ${l.result === 'success' || l.result === 'verified_healthy' ? 'badge-emerald' : 'badge-rose'}`}>
                        {l.result}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {JSON.stringify(l.metadata)}
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
