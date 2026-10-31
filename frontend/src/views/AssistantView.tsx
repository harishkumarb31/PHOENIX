import React, { useState } from 'react';
import { Bot, Send, Sparkles, CheckCircle2, HelpCircle, ArrowRight, CornerDownLeft } from 'lucide-react';
import { api } from '../services/api';

export const AssistantView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text?: string; data?: any }>>([
    {
      sender: 'assistant',
      text: 'Hello. I am the PHOENIX AI Operations Assistant. I analyze live telemetry, active incidents, root causes, and recovery execution states grounded directly in operational database records. How can I assist with infrastructure reliability today?'
    }
  ]);

  const quickPrompts = [
    'What is the current infrastructure health?',
    'Which service has the highest resource utilization?',
    'Why was the latest incident created?',
    'Which recovery playbook is recommended?',
    'Did the latest recovery operation succeed?'
  ];

  const handleSend = async (qText?: string) => {
    const textToSend = qText || query;
    if (!textToSend.trim() || loading) return;

    const userMsg = { sender: 'user' as const, text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.askAssistant(textToSend);
      setMessages(prev => [...prev, { sender: 'assistant', data: res }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { sender: 'assistant', text: `Error retrieving operational data: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800 }}>AI Operations Assistant</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Operational reasoning assistant grounded in live PHOENIX database telemetry, active incident records, and root-cause evidence. Distinguishes verifiable facts from diagnostic hypotheses.
        </p>
      </div>

      {/* Chat Terminal Window */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        {/* Messages Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              {m.sender === 'user' ? (
                <div style={{
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                  color: '#060a14',
                  borderRadius: '16px 16px 2px 16px',
                  fontWeight: 600,
                  fontSize: '13px',
                  maxWidth: '75%'
                }}>
                  {m.text}
                </div>
              ) : (
                <div style={{
                  padding: '16px',
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px 16px 16px 2px',
                  fontSize: '13px',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                    <Bot size={16} color="var(--cyan-main)" />
                    <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--cyan-main)' }}>PHOENIX SRE ASSISTANT</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginLeft: 'auto' }}>GROUNDED OPERATIONAL SYNTHESIS</span>
                  </div>

                  {m.text && <div style={{ color: 'var(--text-main)', lineHeight: '1.5' }}>{m.text}</div>}

                  {m.data && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {m.data.headline}
                      </div>

                      {/* Verifiable Facts */}
                      {m.data.facts?.length > 0 && (
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyan-main)' }}>VERIFIABLE OPERATIONAL FACTS:</span>
                          <ul style={{ paddingLeft: '18px', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            {m.data.facts.map((f: string, i: number) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Diagnostic Hypotheses */}
                      {m.data.hypotheses?.length > 0 && (
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--amber-main)' }}>DIAGNOSTIC HYPOTHESES:</span>
                          <ul style={{ paddingLeft: '18px', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            {m.data.hypotheses.map((h: string, i: number) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommendations */}
                      {m.data.recommendations?.length > 0 && (
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>RECOMMENDED NEXT ACTIONS:</span>
                          <ul style={{ paddingLeft: '18px', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            {m.data.recommendations.map((r: string, i: number) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Referenced Records */}
                      {m.data.referenced_records?.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-dim)' }}>
                          <span>REFERENCED RECORDS:</span>
                          {m.data.referenced_records.map((rec: string, i: number) => (
                            <span key={i} className="badge badge-cyan" style={{ fontSize: '10px' }}>{rec}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyan-main)', fontSize: '12px', padding: '10px' }}>
              <Bot size={16} />
              <span>Querying operational telemetry and database records...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Bar */}
        <div style={{ padding: '8px 16px', background: 'var(--bg-surface-2)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', whiteSpace: 'nowrap' }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '10px', background: 'var(--bg-surface-1)' }}>
          <input
            type="text"
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about infrastructure health, root causes, resource utilization, or recovery..."
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !query.trim()}
            className="btn btn-primary"
            style={{ padding: '0 18px' }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
