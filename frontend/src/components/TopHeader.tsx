import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Radio,
  Zap,
  LogIn,
  LogOut,
  User as UserIcon,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { User, AlertItem } from '../types';

interface TopHeaderProps {
  currentView: string;
  onOpenFaultModal: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  currentUser: User | null;
  alerts: AlertItem[];
  activeFault: string | null;
  onRefresh: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentView,
  onOpenFaultModal,
  onOpenLogin,
  onLogout,
  currentUser,
  alerts,
  activeFault,
  onRefresh
}) => {
  const [time, setTime] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const viewTitles: Record<string, string> = {
    dashboard: 'Command Center',
    monitoring: 'Infrastructure Telemetry',
    services: 'Service Inventory & Topology',
    anomalies: 'Anomaly Intelligence',
    predictions: 'Predictive Failure Analysis',
    rca: 'Root Cause Analysis Workbench',
    assistant: 'AI Operations Assistant',
    incidents: 'Incident Management Center',
    recovery: 'Recovery Intelligence & Playbooks',
    sandbox: 'Recovery Sandbox Testing',
    verification: 'Recovery Verification',
    alerts: 'Alerts & Notifications',
    analytics: 'Reliability Analytics & Reports',
    audit: 'Audit & Activity Log',
    admin: 'Administration & RBAC',
    profile: 'User Profile & Credentials',
    settings: 'System Settings'
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');

  return (
    <header style={{
      height: '60px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(7, 12, 24, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      {/* Breadcrumb Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>PHOENIX</span>
        <span style={{ color: 'var(--border-medium)' }}>/</span>
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{viewTitles[currentView] || currentView}</span>
      </div>

      {/* Right Action Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Active Fault Indicator if any */}
        {activeFault && (
          <div className="badge badge-rose" style={{ animation: 'pulse 2s infinite' }}>
            <Zap size={12} />
            <span>FAULT: {activeFault.toUpperCase()} INJECTED</span>
          </div>
        )}

        {/* Live Stream Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--bg-surface-2)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          fontSize: '11px',
          fontWeight: 600,
          border: '1px solid var(--border-subtle)',
          color: 'var(--cyan-main)'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--cyan-main)',
            boxShadow: '0 0 8px var(--cyan-main)'
          }} />
          <Radio size={12} />
          <span>LIVE TELEMETRY</span>
        </div>

        {/* UTC Clock */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <Clock size={13} />
          <span>{time}</span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="btn-secondary btn-sm"
          title="Refresh Data"
          style={{ padding: '6px 8px' }}
        >
          <RefreshCw size={13} />
        </button>

        {/* Fault Injection Modal Trigger */}
        <button
          onClick={onOpenFaultModal}
          className="btn-outline btn-sm"
          style={{ gap: '6px' }}
        >
          <Zap size={13} />
          <span>Simulate Fault</span>
        </button>

        {/* Notifications Dropdown Trigger */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            className="btn-secondary btn-sm"
            style={{ padding: '6px 10px', position: 'relative' }}
          >
            <Bell size={14} />
            {activeAlerts.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--rose-main)',
                color: '#fff',
                borderRadius: 'var(--radius-full)',
                fontSize: '9px',
                fontWeight: 700,
                padding: '1px 5px',
                minWidth: '16px',
                textAlign: 'center'
              }}>
                {activeAlerts.length}
              </span>
            )}
          </button>

          {showAlertMenu && (
            <div style={{
              position: 'absolute',
              top: '36px',
              right: 0,
              width: '320px',
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: '12px',
              zIndex: 100
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>Notifications</span>
                <span className="badge badge-rose">{activeAlerts.length} active</span>
              </div>
              <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeAlerts.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center', padding: '12px 0' }}>
                    No unacknowledged alerts
                  </div>
                ) : (
                  activeAlerts.map(a => (
                    <div key={a.id} style={{
                      padding: '8px',
                      background: 'var(--bg-surface-2)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: '3px solid var(--rose-main)',
                      fontSize: '11px'
                    }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{a.title}</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '10px' }}>{a.service_name} • {new Date(a.created_at).toLocaleTimeString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="btn-secondary btn-sm"
            style={{ gap: '8px' }}
          >
            <UserIcon size={13} />
            <span>{currentUser ? currentUser.username : 'Login'}</span>
          </button>

          {showUserMenu && (
            <div style={{
              position: 'absolute',
              top: '36px',
              right: 0,
              width: '200px',
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: '8px',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {currentUser ? (
                <>
                  <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>{currentUser.full_name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{currentUser.role}</div>
                  </div>
                  <button
                    onClick={() => { setShowUserMenu(false); onLogout(); }}
                    className="btn btn-danger btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setShowUserMenu(false); onOpenLogin(); }}
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  <LogIn size={13} />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
