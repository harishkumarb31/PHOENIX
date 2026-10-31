import React, { useState } from 'react';
import { Zap, X, Cpu, HardDrive, Database, Server, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface FaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFault: string | null;
  onFaultUpdated: () => void;
}

export const FaultModal: React.FC<FaultModalProps> = ({
  isOpen,
  onClose,
  activeFault,
  onFaultUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState('api-gateway');

  if (!isOpen) return null;

  const scenarios = [
    {
      type: 'cpu',
      title: 'CPU Saturation Surge',
      description: 'Injects sustained compute thread starvation (92-98% CPU) on selected ingress target.',
      icon: Cpu,
      severity: 'critical'
    },
    {
      type: 'memory',
      title: 'Memory Heap Pressure',
      description: 'Simulates unbounded heap growth and GC pause duration (92-97% RAM).',
      icon: Database,
      severity: 'critical'
    },
    {
      type: 'disk',
      title: 'Storage Capacity Exhaustion',
      description: 'Breaches 90% disk volume threshold via rapid journal write-amplification.',
      icon: HardDrive,
      severity: 'high'
    },
    {
      type: 'latency',
      title: 'Upstream Latency Spike',
      description: 'Simulates microservice socket latency degradation (850-1600ms roundtrip).',
      icon: Server,
      severity: 'high'
    },
    {
      type: 'outage',
      title: 'Total Service Outage',
      description: 'Simulates catastrophic availability failure (< 90% uptime SLA violation).',
      icon: Zap,
      severity: 'critical'
    }
  ];

  const handleInject = async (type: string) => {
    setLoading(true);
    try {
      await api.injectFault(type, selectedService);
      onFaultUpdated();
      onClose();
    } catch (e: any) {
      alert(e.message || 'Failed to inject fault');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    try {
      await api.injectFault('clear');
      onFaultUpdated();
      onClose();
    } catch (e: any) {
      alert(e.message || 'Failed to clear fault');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '580px' }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: 'var(--rose-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Zap size={14} />
              </div>
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Fault Scenario Injection</h2>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Trigger isolated chaos engineering scenarios to validate autonomous detection, prediction, RCA, and recovery verification.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.5px' }}>
              TARGET SERVICE
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="input"
              style={{ marginTop: '6px' }}
            >
              <option value="api-gateway">api-gateway (Ingress Proxy)</option>
              <option value="auth-service">auth-service (OAuth Authority)</option>
              <option value="billing-api">billing-api (Transactional Ledger)</option>
              <option value="database-proxy">database-proxy (Postgres Pool)</option>
              <option value="telemetry-worker">telemetry-worker (Metrics Ingest)</option>
              <option value="*">All Services (* Cluster-wide)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.5px' }}>
              SELECT FAULT SCENARIO
            </label>
            {scenarios.map((sc) => {
              const Icon = sc.icon;
              const isActive = activeFault === sc.type;
              return (
                <div
                  key={sc.type}
                  onClick={() => handleInject(sc.type)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-surface-2)',
                    border: isActive ? '1px solid var(--rose-main)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface-3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isActive ? 'var(--rose-main)' : 'var(--cyan-main)'
                    }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{sc.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sc.description}</div>
                    </div>
                  </div>
                  <span className={`badge ${sc.severity === 'critical' ? 'badge-rose' : 'badge-amber'}`}>
                    {sc.severity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <button
            onClick={handleClear}
            disabled={loading}
            className="btn btn-secondary"
            style={{ color: 'var(--cyan-main)', border: '1px solid var(--border-accent)' }}
          >
            <RefreshCw size={13} />
            <span>Clear Active Faults</span>
          </button>
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
