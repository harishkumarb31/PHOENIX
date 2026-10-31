import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Server,
  AlertTriangle,
  TrendingUp,
  GitBranch,
  Flame,
  ShieldCheck,
  CheckCircle2,
  Bell,
  BarChart3,
  Bot,
  ScrollText,
  Settings as SettingsIcon,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Radio,
  Zap,
  Network
} from 'lucide-react';
import { User } from '../types';

interface NavigationProps {
  currentView: string;
  onSelectView: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  openIncidentsCount: number;
  currentUser: User | null;
  onOpenLogin: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onSelectView,
  collapsed,
  onToggleCollapse,
  openIncidentsCount,
  currentUser,
  onOpenLogin
}) => {
  const navSections = [
    {
      label: 'OBSERVABILITY & CORE',
      items: [
        { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
        { id: 'monitoring', label: 'Infrastructure Monitoring', icon: Activity },
        { id: 'topology', label: 'Infrastructure Topology', icon: Network },
        { id: 'services', label: 'Service Inventory', icon: Server }
      ]
    },
    {
      label: 'INTELLIGENCE ENGINES',
      items: [
        { id: 'anomalies', label: 'Anomaly Intelligence', icon: AlertTriangle },
        { id: 'predictions', label: 'Failure Prediction', icon: TrendingUp },
        { id: 'rca', label: 'Root Cause Analysis', icon: GitBranch },
        { id: 'assistant', label: 'AI Operations Assistant', icon: Bot }
      ]
    },
    {
      label: 'INCIDENT & REMEDIATION',
      items: [
        { id: 'incidents', label: 'Incident Management', icon: Flame, badge: openIncidentsCount > 0 ? openIncidentsCount : undefined, badgeColor: 'badge-rose' },
        { id: 'recovery', label: 'Recovery Intelligence', icon: ShieldCheck },
        { id: 'sandbox', label: 'Recovery Sandbox', icon: Zap },
        { id: 'verification', label: 'Recovery Verification', icon: CheckCircle2 }
      ]
    },
    {
      label: 'RELIABILITY & PLATFORM',
      items: [
        { id: 'alerts', label: 'Alerts & Notifications', icon: Bell },
        { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
        { id: 'audit', label: 'Audit & Activity Log', icon: ScrollText },
        { id: 'admin', label: 'Administration & Security', icon: UserCheck },
        { id: 'settings', label: 'Settings', icon: SettingsIcon }
      ]
    }
  ];

  return (
    <aside style={{
      width: collapsed ? '72px' : '260px',
      background: 'var(--bg-surface-1)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      zIndex: 50,
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{
        padding: collapsed ? '18px 12px' : '20px 20px 16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        {!collapsed ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#060a14',
                fontWeight: 900,
                fontSize: '14px',
                boxShadow: 'var(--shadow-cyan)'
              }}>
                P
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '1px' }}>
                  PHOENIX<span style={{ color: 'var(--cyan-main)' }}>.</span>
                </span>
                <span style={{
                  display: 'block',
                  fontSize: '9px',
                  color: 'var(--text-dim)',
                  fontWeight: 600,
                  letterSpacing: '0.8px'
                }}>
                  AUTONOMOUS SRE
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#060a14',
            fontWeight: 900,
            fontSize: '16px'
          }}>
            P
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="btn-secondary"
          style={{
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)'
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: collapsed ? '12px 6px' : '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        {navSections.map((sec, idx) => (
          <div key={idx}>
            {!collapsed && (
              <div style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--text-dim)',
                letterSpacing: '1px',
                padding: '0 8px 6px 8px'
              }}>
                {sec.label}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'space-between',
                      width: '100%',
                      padding: collapsed ? '10px 0' : '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: isActive ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
                      color: isActive ? 'var(--cyan-main)' : 'var(--text-muted)',
                      border: isActive ? '1px solid var(--border-accent)' : '1px solid transparent',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={17} color={isActive ? 'var(--cyan-main)' : 'currentColor'} />
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                    {!collapsed && item.badge !== undefined && (
                      <span className={`badge ${item.badgeColor || 'badge-rose'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User / Operator Snippet */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between'
      }}>
        {!collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #10b981 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px',
              color: '#fff'
            }}>
              {currentUser ? currentUser.username.substring(0, 2).toUpperCase() : 'OP'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser ? currentUser.full_name : 'System Operator'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--cyan-main)', fontWeight: 600, textTransform: 'uppercase' }}>
                {currentUser ? currentUser.role.replace('_', ' ') : 'SUPER ADMIN'}
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={onOpenLogin}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #10b981 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '12px',
              color: '#fff',
              cursor: 'pointer'
            }}
            title={currentUser ? currentUser.username : "Login"}
          >
            {currentUser ? currentUser.username.substring(0, 2).toUpperCase() : 'OP'}
          </div>
        )}
      </div>
    </aside>
  );
};

