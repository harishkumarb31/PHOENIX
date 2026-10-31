import React, { useState } from 'react';
import { ShieldCheck, Play, CheckCircle2, RotateCcw, AlertTriangle, ArrowRight, Zap } from 'lucide-react';
import { RecoveryPlaybookItem, RecoveryPlanItem, IncidentItem } from '../types';
import { api } from '../services/api';

interface RecoveryIntelligenceViewProps {
  playbooks: RecoveryPlaybookItem[];
  incidents: IncidentItem[];
  onRefresh: () => void;
  onNavigateSandbox: (planId: number) => void;
}

export const RecoveryIntelligenceView: React.FC<RecoveryIntelligenceViewProps> = ({
  playbooks,
  incidents,
  onRefresh,
  onNavigateSandbox
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<number>(
    incidents.length > 0 ? incidents[0].id : 0
  );
  const [createdPlan, setCreatedPlan] = useState<RecoveryPlanItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);

  const handleGeneratePlan = async () => {
    if (!selectedIncidentId) return;
    setLoading(true);
    setExecutionResult(null);
    try {
      const plan = await api.createRecoveryPlan(selectedIncidentId);
      setCreatedPlan(plan);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndExecute = async () => {
    if (!createdPlan) return;
    setLoading(true);
    try {
      await api.approveRecoveryPlan(createdPlan.id);
      const res = await api.executeRecoveryPlan(createdPlan.id);
      setExecutionResult(res);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Recovery Intelligence & Self-Healing Playbooks</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Autonomous response engine: Formulate context-aware playbooks, calculate operational blast radius, enforce operator approval gates, and execute verified mitigations.
        </p>
      </div>

      {/* Plan Generation Workbench */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 25, 49, 0.7) 0%, rgba(11, 17, 34, 0.9) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span className="badge badge-cyan">APPROVAL-GATED ORCHESTRATION</span>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>Formulate Incident Recovery Plan</h2>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={selectedIncidentId}
              onChange={(e) => setSelectedIncidentId(parseInt(e.target.value, 10))}
              className="input"
              style={{ width: '280px', fontSize: '12px' }}
            >
              {incidents.length === 0 ? (
                <option value="0">No active incidents</option>
              ) : (
                incidents.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.incident_number}: {i.affected_service_name} ({i.severity})
                  </option>
                ))
              )}
            </select>

            <button
              onClick={handleGeneratePlan}
              disabled={loading || incidents.length === 0}
              className="btn btn-primary"
            >
              <ShieldCheck size={14} />
              <span>{loading ? 'Synthesizing...' : 'Formulate Plan'}</span>
            </button>
          </div>
        </div>

        {/* Generated Plan Details */}
        {createdPlan && (
          <div style={{
            padding: '18px',
            background: 'var(--bg-surface-1)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-cyan">{createdPlan.action_type}</span>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px' }}>{createdPlan.title}</h3>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge badge-amber">IMPACT: {createdPlan.estimated_impact}</span>
                <span className="badge badge-emerald">STATUS: {createdPlan.status.toUpperCase()}</span>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              <b>Risk Assessment:</b> {createdPlan.risk_assessment}
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '6px' }}>
                STAGED REMEDIATION STEPS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {createdPlan.steps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <CheckCircle2 size={13} color="var(--cyan-main)" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-dim)', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
              <b>Rollback Strategy:</b> {createdPlan.rollback_plan}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={() => onNavigateSandbox(createdPlan.id)}
                className="btn btn-secondary"
              >
                <Zap size={14} />
                <span>Test in Sandbox</span>
              </button>
              <button
                onClick={handleApproveAndExecute}
                disabled={loading}
                className="btn btn-primary"
              >
                <Play size={14} />
                <span>Approve & Execute Remediation</span>
              </button>
            </div>
          </div>
        )}

        {/* Execution & Verification Result */}
        {executionResult && (
          <div style={{
            padding: '16px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid var(--emerald-main)',
            borderRadius: 'var(--radius-md)',
            marginTop: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 700, fontSize: '14px' }}>
              <CheckCircle2 size={16} />
              <span>Remediation Execution #{executionResult.execution_id} Completed</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '6px' }}>
              Post-remediation verification status: <b>{executionResult.verification?.status?.toUpperCase()}</b>.
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {executionResult.verification?.notes}
            </p>
          </div>
        )}
      </div>

      {/* Playbook Catalog */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Standard Self-Healing Playbook Library</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {playbooks.map((pb) => (
            <div key={pb.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="badge badge-cyan">{pb.playbook_code}</span>
                  <span className="badge badge-emerald">{pb.safety_tier}</span>
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginTop: '10px' }}>{pb.title}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {pb.description}
                </p>

                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>PROCEDURAL STEPS:</span>
                  <ol style={{ paddingLeft: '16px', fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {pb.steps.slice(0, 3).map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                    {pb.steps.length > 3 && <li>... +{pb.steps.length - 3} more verification steps</li>}
                  </ol>
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-dim)' }}>
                <span>IMPACT: {pb.estimated_impact}</span>
                <span>HANDLER: {pb.action_handler}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
