import React, { useState } from 'react';
import { Server, Plus, ArrowRight, ShieldCheck, Activity, Globe, Cpu, Database, CheckCircle2 } from 'lucide-react';
import { ServiceItem, ServiceDependencyItem } from '../types';
import { api } from '../services/api';

interface ServiceInventoryViewProps {
  services: ServiceItem[];
  dependencies: { nodes: any[]; edges: ServiceDependencyItem[] };
  onRefresh: () => void;
}

export const ServiceInventoryView: React.FC<ServiceInventoryViewProps> = ({
  services,
  dependencies,
  onRefresh
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [host, setHost] = useState('10.0.1.30');
  const [port, setPort] = useState('8080');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createService({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        host,
        port: parseInt(port, 10),
        description,
        environment: 'production'
      });
      setShowAddModal(false);
      setName('');
      setDescription('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to register service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Service & Infrastructure Inventory</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Full catalog of monitored microservice clusters, endpoint configurations, health telemetry, and upstream/downstream dependency mesh.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus size={14} />
          <span>Register Target</span>
        </button>
      </div>

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {services.map((svc) => (
          <div key={svc.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--cyan-main)'
                  }}>
                    <Server size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700 }}>{svc.name}</h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {svc.host}:{svc.port}
                    </div>
                  </div>
                </div>
                <span className={`badge ${svc.status === 'healthy' ? 'badge-emerald' : svc.status === 'degraded' ? 'badge-amber' : 'badge-rose'}`}>
                  {svc.status}
                </span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', minHeight: '34px' }}>
                {svc.description || 'Microservice handling ingress traffic and processing tasks.'}
              </p>

              {/* Health Score & Stats */}
              <div style={{ marginTop: '14px', padding: '10px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>CPU</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{svc.cpu}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>MEM</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{svc.memory}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>LATENCY</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{svc.latency}ms</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>UPTIME</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#34d399' }}>{svc.availability}%</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-dim)' }}>
              <span>ENV: {svc.environment.toUpperCase()}</span>
              <span>HEALTH: {svc.health_score}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Dependency Topology Visualizer */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Service Dependency Mesh Topology</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Active architectural call-graph connections between ingress nodes, authentication, APIs, and data stores.</p>
          </div>
          <span className="badge badge-cyan">{dependencies?.edges?.length || 4} DEPENDENCIES</span>
        </div>

        <div style={{
          padding: '24px',
          background: 'var(--bg-surface-2)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {dependencies?.edges?.map((edge, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--bg-surface-1)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 700, color: 'var(--cyan-main)' }}>{edge.source_name}</span>
                <ArrowRight size={14} color="var(--text-dim)" />
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{edge.target_name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  PROTOCOL: {edge.type}
                </span>
                <span className={`badge ${edge.is_critical ? 'badge-rose' : 'badge-emerald'}`}>
                  {edge.is_critical ? 'Critical Link' : 'Non-Critical'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Register New Monitoring Target</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>SERVICE NAME</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. notification-service" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>HOST IP</label>
                  <input className="input" value={host} onChange={(e) => setHost(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>PORT</label>
                  <input className="input" value={port} onChange={(e) => setPort(e.target.value)} required />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>DESCRIPTION</label>
                <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Service role and description" />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center', marginTop: '10px' }}>
                {loading ? 'Registering...' : 'Register Target'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

