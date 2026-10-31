import React, { useState, useMemo } from 'react';
import {
  Network,
  Server,
  Database,
  Shield,
  Zap,
  Globe,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Cpu,
  Layers,
  Radio,
  X
} from 'lucide-react';
import { ServiceItem } from '../types';
import { api } from '../services/api';

interface InfrastructureMapViewProps {
  services: ServiceItem[];
  dependencies: { nodes: any[]; edges: any[] };
  onRefresh: () => void;
  onSimulateFault: (serviceSlug?: string) => void;
}

interface TopologyNode {
  id: string;
  serviceId?: number;
  label: string;
  type: 'gateway' | 'auth' | 'service' | 'db' | 'storage' | 'worker' | 'monitor';
  x: number;
  y: number;
  status: 'healthy' | 'degraded' | 'critical' | 'isolated';
  cpu: number;
  memory: number;
  latency: number;
  errorRate: number;
  throughput: number;
  environment: string;
}

interface TopologyEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  rps: number;
  isCritical?: boolean;
}

export const InfrastructureMapView: React.FC<InfrastructureMapViewProps> = ({
  services,
  dependencies,
  onRefresh,
  onSimulateFault
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('gateway');
  const [envFilter, setEnvFilter] = useState<'all' | 'production' | 'staging'>('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Map backend services or defaults to topology coordinates
  const nodes: TopologyNode[] = useMemo(() => {
    // Default topology layout
    const baseNodes: TopologyNode[] = [
      {
        id: 'gateway',
        label: 'API Gateway',
        type: 'gateway',
        x: 120,
        y: 220,
        status: 'healthy',
        cpu: 24,
        memory: 38,
        latency: 18,
        errorRate: 0.001,
        throughput: 1450,
        environment: 'production'
      },
      {
        id: 'auth',
        label: 'Auth Service',
        type: 'auth',
        x: 360,
        y: 110,
        status: 'healthy',
        cpu: 31,
        memory: 42,
        latency: 28,
        errorRate: 0.002,
        throughput: 620,
        environment: 'production'
      },
      {
        id: 'orders',
        label: 'Order Service',
        type: 'service',
        x: 360,
        y: 330,
        status: 'healthy',
        cpu: 45,
        memory: 58,
        latency: 42,
        errorRate: 0.004,
        throughput: 840,
        environment: 'production'
      },
      {
        id: 'postgres',
        label: 'Primary Postgres DB',
        type: 'db',
        x: 640,
        y: 130,
        status: 'healthy',
        cpu: 52,
        memory: 68,
        latency: 12,
        errorRate: 0.000,
        throughput: 1980,
        environment: 'production'
      },
      {
        id: 'redis',
        label: 'Redis Cache Cluster',
        type: 'storage',
        x: 640,
        y: 310,
        status: 'healthy',
        cpu: 18,
        memory: 49,
        latency: 3,
        errorRate: 0.000,
        throughput: 3200,
        environment: 'production'
      },
      {
        id: 'worker',
        label: 'Background Worker',
        type: 'worker',
        x: 880,
        y: 220,
        status: 'healthy',
        cpu: 39,
        memory: 61,
        latency: 65,
        errorRate: 0.003,
        throughput: 410,
        environment: 'production'
      },
      {
        id: 'telemetry',
        label: 'PHOENIX Telemetry',
        type: 'monitor',
        x: 500,
        y: 470,
        status: 'healthy',
        cpu: 22,
        memory: 34,
        latency: 14,
        errorRate: 0.000,
        throughput: 2100,
        environment: 'production'
      }
    ];

    // Enrich with live backend services data if matched
    services.forEach(svc => {
      const match = baseNodes.find(n =>
        n.label.toLowerCase().includes(svc.name.toLowerCase()) ||
        svc.slug.toLowerCase().includes(n.id) ||
        svc.name.toLowerCase().includes(n.id)
      );
      if (match) {
        match.serviceId = svc.id;
        match.status = svc.status as any;
        match.cpu = Math.round(svc.cpu);
        match.memory = Math.round(svc.memory);
        match.latency = Math.round(svc.latency);
        match.errorRate = svc.error_rate;
        match.throughput = Math.round(svc.throughput);
        match.environment = svc.environment;
      }
    });

    if (envFilter === 'all') return baseNodes;
    return baseNodes.filter(n => n.environment === envFilter);
  }, [services, envFilter]);

  const edges: TopologyEdge[] = [
    { id: 'e1', from: 'gateway', to: 'auth', label: 'OAuth/JWT', rps: 620, isCritical: true },
    { id: 'e2', from: 'gateway', to: 'orders', label: 'HTTP REST', rps: 840, isCritical: true },
    { id: 'e3', from: 'auth', to: 'postgres', label: 'Auth Store', rps: 340, isCritical: true },
    { id: 'e4', from: 'orders', to: 'postgres', label: 'Read/Write', rps: 760, isCritical: true },
    { id: 'e5', from: 'orders', to: 'redis', label: 'Cache Sync', rps: 1820 },
    { id: 'e6', from: 'orders', to: 'worker', label: 'AMQP Queue', rps: 410 },
    { id: 'e7', from: 'gateway', to: 'telemetry', label: 'gRPC Metrics', rps: 1450 },
    { id: 'e8', from: 'orders', to: 'telemetry', label: 'Tracing', rps: 840 }
  ];

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'var(--cyan-main)';
      case 'degraded': return 'var(--amber-main)';
      case 'critical': return 'var(--orange-phoenix)';
      case 'isolated': return 'var(--violet-main)';
      default: return 'var(--text-dim)';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'gateway': return Globe;
      case 'auth': return Shield;
      case 'db': return Database;
      case 'storage': return Layers;
      case 'worker': return Cpu;
      case 'monitor': return Radio;
      default: return Server;
    }
  };

  // Node actions
  const handleRestart = async () => {
    if (!selectedNode.serviceId) {
      setActionFeedback('Service not linked to database entity');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.restartService(selectedNode.serviceId);
      setActionFeedback(res.message);
      onRefresh();
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleIsolate = async () => {
    if (!selectedNode.serviceId) {
      setActionFeedback('Service not linked to database entity');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.isolateService(selectedNode.serviceId);
      setActionFeedback(res.message);
      onRefresh();
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecover = async () => {
    if (!selectedNode.serviceId) {
      setActionFeedback('Service not linked to database entity');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.recoverService(selectedNode.serviceId);
      setActionFeedback(res.message);
      onRefresh();
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Network size={20} color="var(--cyan-main)" />
            <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Infrastructure Topology Mesh</h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Real-time interactive dependency graph, ingress traffic routing, throughput telemetry, and service node state inspection.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Environment Filter */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-surface-2)',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            padding: '2px'
          }}>
            {(['all', 'production', 'staging'] as const).map(env => (
              <button
                key={env}
                onClick={() => setEnvFilter(env)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  background: envFilter === env ? 'var(--cyan-main)' : 'transparent',
                  color: envFilter === env ? '#080B12' : 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                {env}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <RefreshCw size={13} />
            <span>Sync Mesh</span>
          </button>
        </div>
      </div>

      {/* Main Graph & Inspector Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        {/* SVG Interactive Canvas */}
        <div className="card" style={{
          padding: '24px',
          background: 'radial-gradient(circle at 50% 50%, #101827 0%, #080B12 100%)',
          minHeight: '560px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Legend Banner */}
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '20px',
            display: 'flex',
            gap: '16px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cyan-main)', boxShadow: '0 0 8px var(--cyan-main)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Healthy</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--amber-main)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Degraded</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--orange-phoenix)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Critical / Faulted</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--violet-main)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Isolated</span>
            </div>
          </div>

          <svg
            viewBox="0 0 1020 540"
            style={{ width: '100%', height: '520px', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(57, 213, 255, 0.6)" />
                <stop offset="100%" stopColor="rgba(152, 120, 255, 0.4)" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Render Connection Edges */}
            {edges.map(edge => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const midX = (fromNode.x + toNode.x) / 2;
              const midY = (fromNode.y + toNode.y) / 2;

              return (
                <g key={edge.id}>
                  {/* Base Line */}
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="2"
                    strokeDasharray={edge.isCritical ? 'none' : '4 4'}
                  />
                  {/* Glowing Animated Flow Line */}
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="url(#edgeGrad)"
                    strokeWidth="2"
                    opacity="0.8"
                    filter="url(#glow)"
                  />
                  {/* Edge throughput pill */}
                  <rect
                    x={midX - 35}
                    y={midY - 10}
                    width="70"
                    height="20"
                    rx="10"
                    fill="#101827"
                    stroke="rgba(57, 213, 255, 0.3)"
                    strokeWidth="1"
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    fill="var(--cyan-main)"
                    fontSize="9"
                    fontFamily="var(--font-mono)"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {edge.rps} rps
                  </text>
                </g>
              );
            })}

            {/* Render Nodes */}
            {nodes.map(node => {
              const isSelected = selectedNode?.id === node.id;
              const statusColor = getStatusColor(node.status);
              const Icon = getNodeIcon(node.type);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Node Outer Selection Ring */}
                  {isSelected && (
                    <circle
                      r="42"
                      fill="none"
                      stroke={statusColor}
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      opacity="0.9"
                    />
                  )}

                  {/* Node Background Disc */}
                  <circle
                    r="32"
                    fill="#101827"
                    stroke={statusColor}
                    strokeWidth={isSelected ? '3' : '2'}
                    filter="url(#glow)"
                  />

                  {/* Status Indicator Pip */}
                  <circle
                    cx="22"
                    cy="-22"
                    r="6"
                    fill={statusColor}
                    stroke="#080B12"
                    strokeWidth="2"
                  />

                  {/* Icon */}
                  <foreignObject x="-14" y="-14" width="28" height="28">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusColor }}>
                      <Icon size={20} />
                    </div>
                  </foreignObject>

                  {/* Node Label */}
                  <text
                    y="48"
                    textAnchor="middle"
                    fill="var(--text-main)"
                    fontSize="12"
                    fontWeight="600"
                    fontFamily="var(--font-sans)"
                  >
                    {node.label}
                  </text>

                  {/* Metric Pill */}
                  <text
                    y="63"
                    textAnchor="middle"
                    fill="var(--text-dim)"
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                  >
                    {node.cpu}% CPU • {node.latency}ms
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node Inspector Drawer */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                color: 'var(--cyan-main)',
                letterSpacing: '0.05em'
              }}>
                NODE INSPECTOR
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px' }}>
                {selectedNode.label}
              </h2>
            </div>
            <div
              className={`badge badge-${selectedNode.status === 'healthy' ? 'emerald' : selectedNode.status === 'degraded' ? 'amber' : 'rose'}`}
            >
              {selectedNode.status.toUpperCase()}
            </div>
          </div>

          {/* Metrics Overview */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            background: 'var(--bg-surface-2)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>CPU USAGE</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                {selectedNode.cpu}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>MEMORY USAGE</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                {selectedNode.memory}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>LATENCY (P99)</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                {selectedNode.latency}ms
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>THROUGHPUT</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cyan-main)', fontFamily: 'var(--font-mono)' }}>
                {selectedNode.throughput} rps
              </div>
            </div>
          </div>

          {/* Action Feedback alert */}
          {actionFeedback && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(57, 213, 255, 0.1)',
              border: '1px solid var(--border-accent)',
              fontSize: '12px',
              color: 'var(--cyan-main)'
            }}>
              {actionFeedback}
            </div>
          )}

          {/* Direct Node Control Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
              LIVE REMEDIATION & CONTROLS
            </span>

            <button
              onClick={handleRestart}
              disabled={actionLoading}
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', fontSize: '12px' }}
            >
              <RotateCcw size={14} color="var(--cyan-main)" />
              <span>Restart Service Node</span>
            </button>

            <button
              onClick={handleIsolate}
              disabled={actionLoading}
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', fontSize: '12px' }}
            >
              <ShieldAlert size={14} color="var(--amber-main)" />
              <span>Isolate From Traffic Mesh</span>
            </button>

            <button
              onClick={handleRecover}
              disabled={actionLoading}
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', fontSize: '12px' }}
            >
              <CheckCircle2 size={14} color="var(--emerald-main)" />
              <span>Restore To Active Pool</span>
            </button>

            <button
              onClick={() => onSimulateFault(selectedNode.id)}
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', fontSize: '12px', borderColor: 'rgba(255, 121, 71, 0.3)' }}
            >
              <Zap size={14} color="var(--orange-phoenix)" />
              <span>Inject Chaos Fault for Node</span>
            </button>
          </div>

          {/* Upstream / Downstream Connections */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
              CONNECTED DEPENDENCY LINKS
            </span>
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {edges
                .filter(e => e.from === selectedNode.id || e.to === selectedNode.id)
                .map(e => (
                  <div key={e.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    background: 'var(--bg-surface-2)'
                  }}>
                    <span style={{ color: 'var(--text-main)' }}>
                      {e.from === selectedNode.id ? `→ ${e.to}` : `← ${e.from}`}
                    </span>
                    <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {e.label}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

