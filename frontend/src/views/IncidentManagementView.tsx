import React, { useState } from 'react';
import { Flame, CheckCircle, Search, Filter, ShieldCheck, CheckCheck, MessageSquare, ArrowRight } from 'lucide-react';
import { IncidentItem } from '../types';
import { api } from '../services/api';

interface IncidentManagementViewProps {
  incidents: IncidentItem[];
  onRefresh: () => void;
  onFormulatePlan: (incidentId: number) => void;
  onNavigateRCA: (incidentId: number) => void;
}

export const IncidentManagementView: React.FC<IncidentManagementViewProps> = ({
  incidents,
  onRefresh,
  onFormulatePlan,
  onNavigateRCA
}) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = incidents.filter(i => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        i.title.toLowerCase().includes(q) ||
        i.incident_number.toLowerCase().includes(q) ||
        i.affected_service_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAcknowledge = async (id: number) => {
    try {
      await api.acknowledgeIncident(id, 'Acknowledged by operator');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge');
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingId) return;
    setLoading(true);
    try {
      await api.resolveIncident(resolvingId, resolutionNotes || 'Resolved manually by SRE operator');
      setResolvingId(null);
      setResolutionNotes('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Incident Management Center</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Track and remediate operational events throughout the full lifecycle: Detect → Acknowledge → Diagnose → Recover → Verify → Resolve.
          </p>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: '32px', width: '220px', fontSize: '12px' }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
            style={{ width: '150px', fontSize: '12px' }}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="recovery_pending">Recovery Pending</option>
            <option value="recovering">Recovering</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="input"
            style={{ width: '130px', fontSize: '12px' }}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Incident Queue Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>INCIDENT</th>
                <th>SEVERITY</th>
                <th>STATUS</th>
                <th>AFFECTED SERVICE</th>
                <th>TITLE / DIAGNOSIS</th>
                <th>CREATED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                    No incidents found matching current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((inc) => (
                  <tr key={inc.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyan-main)', whiteSpace: 'nowrap' }}>
                      {inc.incident_number}
                    </td>
                    <td>
                      <span className={`badge ${inc.severity === 'critical' ? 'badge-rose' : inc.severity === 'high' ? 'badge-amber' : 'badge-cyan'}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${inc.status === 'resolved' ? 'badge-emerald' : inc.status === 'open' ? 'badge-rose' : 'badge-amber'}`}>
                        {inc.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{inc.affected_service_name}</td>
                    <td style={{ maxWidth: '340px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '12px' }}>{inc.title}</div>
                      {inc.root_cause_summary && (
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                          Root Cause: {inc.root_cause_summary}
                        </div>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                      {inc.created_at ? new Date(inc.created_at).toLocaleTimeString() : 'now'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {inc.status === 'open' && (
                          <button
                            onClick={() => handleAcknowledge(inc.id)}
                            className="btn btn-secondary btn-sm"
                            title="Acknowledge incident"
                          >
                            ACK
                          </button>
                        )}
                        <button
                          onClick={() => onNavigateRCA(inc.id)}
                          className="btn btn-secondary btn-sm"
                          title="View Root Cause Analysis"
                        >
                          RCA
                        </button>
                        {inc.status !== 'resolved' && inc.status !== 'closed' && (
                          <>
                            <button
                              onClick={() => onFormulatePlan(inc.id)}
                              className="btn btn-primary btn-sm"
                              title="Generate recovery plan"
                            >
                              Recover
                            </button>
                            <button
                              onClick={() => setResolvingId(inc.id)}
                              className="btn btn-secondary btn-sm"
                              title="Resolve incident"
                            >
                              Resolve
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Resolve Modal */}
      {resolvingId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Resolve Incident #{resolvingId}</h3>
              <button onClick={() => setResolvingId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleResolve} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>RESOLUTION SUMMARY</label>
                <textarea
                  className="input"
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe root cause remediation and post-fix validation..."
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setResolvingId(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

