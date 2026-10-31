import React, { useState } from 'react';
import { Zap, Play, CheckCircle2, ArrowRight, ShieldCheck, Activity, BarChart2 } from 'lucide-react';
import { api } from '../services/api';

interface RecoverySandboxViewProps {
  initialPlanId?: number;
}

export const RecoverySandboxView: React.FC<RecoverySandboxViewProps> = ({
  initialPlanId = 1
}) => {
  const [planId, setPlanId] = useState<number>(initialPlanId);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await api.simulateSandbox(planId);
      setSimulationResult(res);
    } catch (err: any) {
      alert(err.message || 'Sandbox simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Recovery Sandbox & Safe Simulation Testing</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Evaluate proposed remediation actions in an isolated digital twin sandbox without affecting live production traffic. Test expected outcomes, inspect before-and-after variance, and validate safety constraints.
        </p>
      </div>

      {/* Control Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 25, 49, 0.7) 0%, rgba(11, 17, 34, 0.9) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span className="badge badge-cyan">ISOLATED DIGITAL TWIN</span>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>Execute Virtual Simulation</h2>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Plan ID:</span>
            <input
              type="number"
              className="input"
              value={planId}
              onChange={(e) => setPlanId(parseInt(e.target.value, 10) || 1)}
              style={{ width: '80px', padding: '6px 10px', fontSize: '12px' }}
            />
            <button
              onClick={handleSimulate}
              disabled={loading}
              className="btn btn-primary"
            >
              <Zap size={14} />
              <span>{loading ? 'Simulating...' : 'Run Sandbox Simulation'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Results Comparison Panel */}
      {simulationResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Verdict Banner */}
          <div style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid var(--emerald-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldCheck size={24} color="#34d399" />
              <div>
                <div style={{ fontWeight: 800, fontSize: '14px', color: '#34d399' }}>
                  SAFETY VERDICT: {simulationResult.safety_verdict}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '2px' }}>
                  {simulationResult.expected_outcome}
                </div>
              </div>
            </div>
            <span className="badge badge-emerald">SIMULATION ID: {simulationResult.sandbox_id}</span>
          </div>

          {/* Before vs After Metric Comparison Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {/* CPU */}
            <div className="card">
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>COMPUTE CORE LOAD</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>BEFORE</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--rose-main)' }}>
                    {simulationResult.telemetry_comparison.before.cpu}%
                  </div>
                </div>
                <ArrowRight size={16} color="var(--text-dim)" />
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>PROJECTED</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                    {simulationResult.telemetry_comparison.projected_after.cpu}%
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#34d399', marginTop: '8px', fontWeight: 600 }}>
                Delta: {simulationResult.telemetry_comparison.variance_delta.cpu_delta}%
              </div>
            </div>

            {/* Memory */}
            <div className="card">
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>WORKING SET MEMORY</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>BEFORE</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--rose-main)' }}>
                    {simulationResult.telemetry_comparison.before.memory}%
                  </div>
                </div>
                <ArrowRight size={16} color="var(--text-dim)" />
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>PROJECTED</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                    {simulationResult.telemetry_comparison.projected_after.memory}%
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#34d399', marginTop: '8px', fontWeight: 600 }}>
                Delta: {simulationResult.telemetry_comparison.variance_delta.memory_delta}%
              </div>
            </div>

            {/* Storage */}
            <div className="card">
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>STORAGE UTILIZATION</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>BEFORE</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    {simulationResult.telemetry_comparison.before.disk}%
                  </div>
                </div>
                <ArrowRight size={16} color="var(--text-dim)" />
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>PROJECTED</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                    {simulationResult.telemetry_comparison.projected_after.disk}%
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#34d399', marginTop: '8px', fontWeight: 600 }}>
                Delta: {simulationResult.telemetry_comparison.variance_delta.disk_delta}%
              </div>
            </div>

            {/* Latency */}
            <div className="card">
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)' }}>RESPONSE LATENCY</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>BEFORE</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--amber-main)' }}>
                    {simulationResult.telemetry_comparison.before.latency}ms
                  </div>
                </div>
                <ArrowRight size={16} color="var(--text-dim)" />
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>PROJECTED</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                    {simulationResult.telemetry_comparison.projected_after.latency}ms
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#34d399', marginTop: '8px', fontWeight: 600 }}>
                Delta: {simulationResult.telemetry_comparison.variance_delta.latency_delta}ms
              </div>
            </div>
          </div>

          {/* Simulated Procedural Steps */}
          <div className="card">
            <span style={{ fontSize: '12px', fontWeight: 700 }}>Simulated Execution Sequence</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {simulationResult.steps_simulated.map((st: string, idx: number) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', padding: '8px 12px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                  <CheckCircle2 size={14} color="#34d399" />
                  <span>{st}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

