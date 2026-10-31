import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, Key, Zap, Pause, Play, Plus, RefreshCw } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';

interface AdministrationViewProps {
  onSimulateFault: () => void;
}

export const AdministrationView: React.FC<AdministrationViewProps> = ({
  onSimulateFault
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [streamRunning, setStreamRunning] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    api.getUsers()
      .then(data => setUsers(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStream = async () => {
    try {
      const res = await api.toggleStream(!streamRunning);
      setStreamRunning(res.running);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle stream');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Administration & Role-Based Access Control</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          System governance, RBAC role assignments, telemetry streaming engines, and chaos engineering controls.
        </p>
      </div>

      {/* Control Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Stream Toggle Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="badge badge-cyan">TELEMETRY INGESTION ENGINE</span>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px' }}>Background Polling Stream</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                State: <b>{streamRunning ? 'Active & Polling (3s)' : 'Paused'}</b>
              </p>
            </div>
            <button
              onClick={handleToggleStream}
              className={`btn ${streamRunning ? 'btn-secondary' : 'btn-primary'}`}
            >
              {streamRunning ? <Pause size={14} /> : <Play size={14} />}
              <span>{streamRunning ? 'Pause Ingestion' : 'Resume Ingestion'}</span>
            </button>
          </div>
        </div>

        {/* Chaos Engineering */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="badge badge-rose">CHAOS ENGINEERING</span>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px' }}>Fault Scenario Simulation</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Inject synthetic compute, memory, disk, or latency anomalies.
              </p>
            </div>
            <button onClick={onSimulateFault} className="btn btn-primary">
              <Zap size={14} />
              <span>Inject Fault</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={16} color="var(--cyan-main)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Authorized Operator Accounts</h3>
          </div>
          <button onClick={fetchUsers} className="btn btn-secondary btn-sm">
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>USER ID</th>
                <th>USERNAME</th>
                <th>FULL NAME</th>
                <th>ROLE LEVEL</th>
                <th>PERMISSIONS</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const roleBadge = (
                  u.role === 'super_admin' ? 'badge-rose' :
                  u.role === 'infra_admin' ? 'badge-amber' :
                  u.role === 'sre_operator' ? 'badge-cyan' : 'badge-emerald'
                );
                const roleDesc = (
                  u.role === 'super_admin' ? 'Full System & Policy Administration' :
                  u.role === 'infra_admin' ? 'Manage Targets & Alert Rules' :
                  u.role === 'sre_operator' ? 'Approve & Execute Remediation Playbooks' : 'Read-Only Observability'
                );
                return (
                  <tr key={u.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{u.id}</td>
                    <td style={{ fontWeight: 600 }}>{u.username}</td>
                    <td>{u.full_name}</td>
                    <td>
                      <span className={`badge ${roleBadge}`}>{u.role.replace('_', ' ')}</span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{roleDesc}</td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-emerald' : 'badge-rose'}`}>
                        {u.is_active ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
