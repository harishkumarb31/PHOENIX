import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  Activity,
  Server,
  AlertTriangle,
  TrendingUp,
  GitBranch,
  Flame,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Bell,
  BarChart3,
  Bot,
  ScrollText,
  UserCheck,
  Settings,
  Network,
  CornerDownLeft,
  X
} from 'lucide-react';
import { ServiceItem, IncidentItem } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (viewId: string) => void;
  onSimulateFault: (faultType?: string) => void;
  services: ServiceItem[];
  incidents: IncidentItem[];
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Services' | 'Incidents' | 'Chaos Actions';
  title: string;
  subtitle?: string;
  icon: any;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSimulateFault,
  services,
  incidents
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build searchable items list
  const baseItems: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard', category: 'Navigation', title: 'Command Center', subtitle: 'Overview, live incident triage, and reliability index', icon: LayoutDashboard, action: () => { onNavigate('dashboard'); onClose(); } },
    { id: 'nav-monitoring', category: 'Navigation', title: 'Live Infrastructure Telemetry', subtitle: 'Real-time host and microservice metrics stream', icon: Activity, action: () => { onNavigate('monitoring'); onClose(); } },
    { id: 'nav-topology', category: 'Navigation', title: 'Infrastructure Topology Map', subtitle: 'Interactive multi-tier service dependency mesh', icon: Network, action: () => { onNavigate('topology'); onClose(); } },
    { id: 'nav-anomalies', category: 'Navigation', title: 'Anomaly Intelligence', subtitle: 'Multi-tier Z-score and Isolation Forest detections', icon: AlertTriangle, action: () => { onNavigate('anomalies'); onClose(); } },
    { id: 'nav-predictions', category: 'Navigation', title: 'Predictive Failure Analysis', subtitle: 'Saturation forecasting and preventive triggers', icon: TrendingUp, action: () => { onNavigate('predictions'); onClose(); } },
    { id: 'nav-rca', category: 'Navigation', title: 'Root Cause Analysis Workbench', subtitle: 'Automated causal hypothesis generation', icon: GitBranch, action: () => { onNavigate('rca'); onClose(); } },
    { id: 'nav-incidents', category: 'Navigation', title: 'Incident Management Center', subtitle: 'Active incident lifecycle, MTTR, and escalation', icon: Flame, action: () => { onNavigate('incidents'); onClose(); } },
    { id: 'nav-recovery', category: 'Navigation', title: 'Recovery Intelligence & Playbooks', subtitle: 'Autonomous execution engine and playbooks', icon: ShieldCheck, action: () => { onNavigate('recovery'); onClose(); } },
    { id: 'nav-sandbox', category: 'Navigation', title: 'Recovery Sandbox Testing', subtitle: 'Pre-flight dry-run and risk simulation', icon: Zap, action: () => { onNavigate('sandbox'); onClose(); } },
    { id: 'nav-verification', category: 'Navigation', title: 'Post-Recovery Verification', subtitle: 'Telemetry stabilization audits & gatekeeper', icon: CheckCircle2, action: () => { onNavigate('verification'); onClose(); } },
    { id: 'nav-services', category: 'Navigation', title: 'Service Inventory & Catalog', subtitle: 'Registered services, health scoring and endpoints', icon: Server, action: () => { onNavigate('services'); onClose(); } },
    { id: 'nav-analytics', category: 'Navigation', title: 'Reliability Analytics & Reports', subtitle: 'SLA compliance, MTTR/MTTD charts & CSV exports', icon: BarChart3, action: () => { onNavigate('analytics'); onClose(); } },
    { id: 'nav-assistant', category: 'Navigation', title: 'AI Operations Assistant', subtitle: 'Interactive natural language SRE query engine', icon: Bot, action: () => { onNavigate('assistant'); onClose(); } },
    { id: 'nav-alerts', category: 'Navigation', title: 'Alert Rules & Notification Center', subtitle: 'Threshold rules, Webhooks and Slack dispatch', icon: Bell, action: () => { onNavigate('alerts'); onClose(); } },
    { id: 'nav-audit', category: 'Navigation', title: 'Audit Trail & Compliance Log', subtitle: 'Cryptographic hash chain of infrastructure events', icon: ScrollText, action: () => { onNavigate('audit'); onClose(); } },
    { id: 'nav-admin', category: 'Navigation', title: 'Administration & RBAC', subtitle: 'User roles, permissions and security controls', icon: UserCheck, action: () => { onNavigate('admin'); onClose(); } },
    { id: 'nav-settings', category: 'Navigation', title: 'System Settings & Guardrails', subtitle: 'Autonomy level, thresholds, and safety limits', icon: Settings, action: () => { onNavigate('settings'); onClose(); } },

    // Chaos actions
    { id: 'chaos-mem', category: 'Chaos Actions', title: 'Simulate Fault: Memory Leak', subtitle: 'Inject synthetic memory exhaustion on order-service', icon: Zap, action: () => { onSimulateFault('memory_leak'); onClose(); } },
    { id: 'chaos-cpu', category: 'Chaos Actions', title: 'Simulate Fault: CPU Saturation', subtitle: 'Inject heavy compute thread spinning on auth-service', icon: Zap, action: () => { onSimulateFault('cpu_spike'); onClose(); } },
    { id: 'chaos-net', category: 'Chaos Actions', title: 'Simulate Fault: Network Latency / Drop', subtitle: 'Introduce packet drop degradation on api-gateway', icon: Zap, action: () => { onSimulateFault('network_latency'); onClose(); } },
    { id: 'chaos-disk', category: 'Chaos Actions', title: 'Simulate Fault: Disk Saturation', subtitle: 'Trigger disk storage limit breach on telemetry-service', icon: Zap, action: () => { onSimulateFault('disk_full'); onClose(); } }
  ];

  // Add services
  services.forEach(svc => {
    baseItems.push({
      id: `svc-${svc.id}`,
      category: 'Services',
      title: svc.name,
      subtitle: `${svc.environment.toUpperCase()} • ${svc.host}:${svc.port} • Status: ${svc.status}`,
      icon: Server,
      action: () => { onNavigate('services'); onClose(); }
    });
  });

  // Add active incidents
  incidents.slice(0, 5).forEach(inc => {
    baseItems.push({
      id: `inc-${inc.id}`,
      category: 'Incidents',
      title: `${inc.incident_number}: ${inc.title}`,
      subtitle: `Severity: ${inc.severity.toUpperCase()} • Service: ${inc.affected_service_name || 'Cluster'} • State: ${inc.status}`,
      icon: Flame,
      action: () => { onNavigate('incidents'); onClose(); }
    });
  });

  // Filter
  const filtered = baseItems.filter(item => {
    if (!query) return true;
    const q = query.toLowerCase();
    return item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q);
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(filtered.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(filtered.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(4, 7, 13, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '12vh'
    }} onClick={onClose}>
      <div style={{
        width: '100%',
        maxWidth: '680px',
        background: '#101827',
        border: '1px solid var(--border-medium)',
        borderRadius: '14px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(57, 213, 255, 0.15)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={e => e.stopPropagation()}>
        {/* Input bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <Search size={20} color="var(--cyan-main)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, jump to a view, or search infrastructure..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '15px',
              fontFamily: 'var(--font-sans)'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '11px',
              background: 'var(--bg-surface-3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '2px 6px',
              color: 'var(--text-dim)',
              fontFamily: 'var(--font-mono)'
            }}>ESC</span>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div style={{
          maxHeight: '420px',
          overflowY: 'auto',
          padding: '8px'
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>
              No commands or infrastructure entities matched "{query}".
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(57, 213, 255, 0.12)' : 'transparent',
                    border: isSelected ? '1px solid rgba(57, 213, 255, 0.3)' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: isSelected ? 'var(--cyan-main)' : 'var(--bg-surface-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSelected ? '#080B12' : 'var(--cyan-main)'
                    }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                          {item.title}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-dim)',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--cyan-main)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      <span>SELECT</span>
                      <CornerDownLeft size={12} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-dim)'
        }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span><strong style={{ color: 'var(--text-muted)' }}>↑↓</strong> Navigate</span>
            <span><strong style={{ color: 'var(--text-muted)' }}>↵</strong> Select</span>
            <span><strong style={{ color: 'var(--text-muted)' }}>esc</strong> Close</span>
          </div>
          <div>PHOENIX Command Palette</div>
        </div>
      </div>
    </div>
  );
};
