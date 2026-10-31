import React, { useState, useEffect } from 'react';
import { GitBranch, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Search, ListChecks } from 'lucide-react';
import { IncidentItem, RootCauseHypothesisItem } from '../types';
import { api } from '../services/api';

interface RootCauseAnalysisViewProps {
  incidents: IncidentItem[];
  onFormulatePlan: (incidentId: number) => void;
}

export const RootCauseAnalysisView: React.FC<RootCauseAnalysisViewProps> = ({
  incidents,
  onFormulatePlan
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(
    incidents.length > 0 ? incidents[0].id : null
  );
  const [detail, setDetail] = useState<(IncidentItem & { hypotheses: RootCauseHypothesisItem[] }) | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedIncidentId) {
      setLoading(true);
      api.getIncidentDetail(selectedIncidentId)
        .then(data => setDetail(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [selectedIncidentId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Root Cause Analysis Intelligence</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Explainable causal inference engine: correlates multi-service telemetry signals, dependency graphs, and historical baselines to generate ranked diagnostic hypotheses.
        </p>
      </div>

      {/* Main Grid: Incident Selector vs Hypotheses Workbench */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr', gap: '20px' }}>
        {/* Left Column: Incidents List */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '700px', overflowY: 'auto' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.8px' }}>
            SELECT INCIDENT FOR DIAGNOSIS
          </span>

          {incidents.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
              No incidents available for RCA.
            </div>
          ) : (
            incidents.map((inc) => {
              const isSelected = selectedIncidentId === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncidentId(inc.id)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(0, 242, 254, 0.1)' : 'var(--bg-surface-2)',
                    border: isSelected ? '1px solid var(--cyan-main)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-main)' }}>
                      {inc.incident_number}
                    </span>
                    <span className={`badge ${inc.severity === 'critical' ? 'badge-rose' : 'badge-amber'}`}>
                      {inc.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                    {inc.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>
                    Service: {inc.affected_service_name} • {new Date(inc.created_at).toLocaleTimeString()}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Hypotheses & Supporting Evidence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
              Retrieving diagnostic telemetry and computing causal hypotheses...
            </div>
          ) : detail ? (
            <>
              {/* Incident Header Summary Card */}
              <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 25, 49, 0.8) 0%, rgba(11, 17, 34, 0.9) 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--cyan-main)' }}>
                        {detail.incident_number}
                      </span>
                      <span className={`badge ${detail.severity === 'critical' ? 'badge-rose' : 'badge-amber'}`}>
                        {detail.severity}
                      </span>
                      <span className="badge badge-cyan">{detail.status}</span>
                    </div>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, marginTop: '8px' }}>{detail.title}</h2>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Primary Suspected Root Cause: <b style={{ color: 'var(--text-main)' }}>{detail.root_cause_summary || 'Analysis in progress'}</b>
                    </p>
                  </div>

                  <button
                    onClick={() => onFormulatePlan(detail.id)}
                    className="btn btn-primary"
                  >
                    <ShieldCheck size={14} />
                    <span>Generate Recovery Plan</span>
                  </button>
                </div>
              </div>

              {/* Ranked Hypotheses */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.8px' }}>
                  RANKED DIAGNOSTIC HYPOTHESES
                </span>

                {detail.hypotheses.length === 0 ? (
                  <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No hypotheses generated yet. Telemetry within normal limits.
                  </div>
                ) : (
                  detail.hypotheses.map((hyp) => (
                    <div key={hyp.id} className="card" style={{ borderLeft: hyp.ranking === 1 ? '4px solid var(--cyan-main)' : '4px solid var(--border-medium)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge ${hyp.ranking === 1 ? 'badge-cyan' : 'badge-amber'}`}>
                            {hyp.ranking === 1 ? 'PRIMARY CAUSE' : `ALTERNATIVE #${hyp.ranking}`}
                          </span>
                          <h3 style={{ fontSize: '14px', fontWeight: 700 }}>{hyp.title}</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>CONFIDENCE:</span>
                          <span style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--cyan-main)' }}>
                            {Math.round(hyp.confidence_score * 100)}%
                          </span>
                        </div>
                      </div>

                      {/* Supporting Evidence */}
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '6px' }}>
                          SUPPORTING TELEMETRY EVIDENCE
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {hyp.evidence.map((ev, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                              <CheckCircle2 size={13} color="var(--cyan-main)" />
                              <span>{ev}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Affected Components */}
                      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>AFFECTED COMPONENTS:</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {hyp.affected_components.map((comp, idx) => (
                            <span key={idx} className="badge badge-violet">{comp}</span>
                          ))}
                        </div>
                      </div>

                      {/* Recommended Investigation Steps */}
                      <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '6px' }}>
                          RECOMMENDED SRE ACTIONS
                        </div>
                        <ol style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {hyp.recommended_steps.map((st, sidx) => (
                            <li key={sidx}>{st}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)' }}>
              Select an incident from the queue to inspect root cause hypotheses.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
