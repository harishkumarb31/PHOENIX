import React, { useState } from 'react';
import { X, ShieldCheck, Key, UserCheck, Lock } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(username, password);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(user, pass);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
              color: '#060a14',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}>
              <ShieldCheck size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Authenticate Session</h2>
              <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Role-Based Access Control</p>
            </div>
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

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--rose-main)',
              color: '#fca5a5',
              fontSize: '12px'
            }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>USERNAME</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              style={{ marginTop: '6px' }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>PASSWORD</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ marginTop: '6px' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to PHOENIX'}
          </button>

          {/* Quick Demo Credentials */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
              ONE-CLICK DEMO PROFILES
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', justifyContent: 'center' }}
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('operator', 'operator123')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', justifyContent: 'center' }}
              >
                SRE Operator
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('viewer', 'viewer123')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '11px', justifyContent: 'center' }}
              >
                Viewer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

