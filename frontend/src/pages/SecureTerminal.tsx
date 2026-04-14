import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLazyGetSecureOsVerificationQuery } from '../redux-slice/pharmaApiSlice';

interface Line {
  type: 'cmd' | 'ok' | 'err' | 'info';
  text: string;
}

const lineColor = (type: Line['type']) => {
  if (type === 'ok') return '#79ff97';
  if (type === 'err') return '#ff6b6b';
  if (type === 'info') return '#7ed7ff';
  return '#d2ffe4';
};

const SecureTerminal: React.FC = () => {
  const [command, setCommand] = useState('');
  const [batchContext, setBatchContext] = useState('');
  const [lines, setLines] = useState<Line[]>([
    { type: 'info', text: 'ORION SECURE OPS TERMINAL v1.0' },
    { type: 'info', text: 'Type help to list available commands.' }
  ]);

  const [verifyBatch, { isFetching }] = useLazyGetSecureOsVerificationQuery();

  const prompt = useMemo(() => `secure-os${batchContext ? `:${batchContext}` : ''} $`, [batchContext]);

  const push = (line: Line) => setLines((prev) => [...prev, line]);

  const runCommand = async (raw: string) => {
    const input = raw.trim();
    if (!input) return;

    push({ type: 'cmd', text: `${prompt} ${input}` });

    const [cmd, arg] = input.split(/\s+/);

    if (cmd === 'help') {
      push({ type: 'info', text: 'Commands: help | clear | verify <BATCHID> | allow <BATCHID>' });
      return;
    }

    if (cmd === 'clear') {
      setLines([{ type: 'info', text: 'Screen cleared.' }]);
      return;
    }

    if ((cmd === 'verify' || cmd === 'allow') && arg) {
      const batchId = arg.toUpperCase();
      setBatchContext(batchId);

      try {
        const res = await verifyBatch(batchId).unwrap();
        const data = res.data;

        push({ type: 'info', text: `Batch ${batchId} mode: ${data.mode}` });
        push({ type: data.allowed ? 'ok' : 'err', text: data.reason });
        push({ type: 'info', text: `Checks => onChain:${data.checks.onChainVerified} tempInRange:${data.checks.temperatureInRange} recalledBlocked:${!data.checks.notRecalled}` });
        if (data.security) {
          push({ type: 'ok', text: `Rust Policy: ${data.security.policyVersion} | Score: ${data.security.securityScore}` });
          push({ type: 'info', text: `Estimated Failure: ${data.security.estimatedFailure}% | Active Alerts: ${data.security.activeAlerts}` });
        }

        if (data.proof?.transactionHash) {
          push({ type: 'ok', text: `Transaction Hash: ${data.proof.transactionHash}` });
        }
        if (data.proof?.timestamp) {
          push({ type: 'ok', text: `Timestamp: ${new Date(data.proof.timestamp).toLocaleString()}` });
        }

        const events = data.proof?.events || [];
        if (events.length > 0) {
          push({ type: 'info', text: `Events (${events.length}):` });
          events.slice(0, 3).forEach((e: any) => {
            push({ type: 'info', text: `- ${e.event} @ block ${e.blockNumber}` });
          });
        }

        if (cmd === 'allow') {
          push({ type: data.allowed ? 'ok' : 'err', text: data.allowed ? `ACCESS GRANTED for ${batchId}` : `ACCESS DENIED for ${batchId}` });
        }
      } catch (error: any) {
        push({ type: 'err', text: error?.data?.error || 'Verification request failed' });
      }
      return;
    }

    push({ type: 'err', text: 'Unknown command. Use help.' });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = command;
    setCommand('');
    await runCommand(input);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#041b1c,#031213)', color: '#d2ffe4' }}>
      <nav style={{ borderBottom: '1px solid rgba(126,215,255,0.3)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '14px', color: '#7ed7ff' }}>Orion Secure OS Layer</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/" style={{ color: '#d2ffe4', textDecoration: 'none', fontSize: '13px' }}>Dashboard</Link>
          <Link to="/verify" style={{ color: '#d2ffe4', textDecoration: 'none', fontSize: '13px' }}>Verify</Link>
        </div>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: '14px', color: '#7ed7ff', fontSize: '13px' }}>
          Critical operations run through a secure verification layer. Only verified batches are allowed.
        </div>

        <div style={{ background: '#031717', border: '1px solid rgba(126,215,255,0.28)', borderRadius: '12px', minHeight: '70vh', padding: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {lines.map((line, idx) => (
              <div key={idx} style={{ color: lineColor(line.type) }}>{line.text}</div>
            ))}
          </div>

          <form onSubmit={onSubmit} style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'monospace', color: '#7ed7ff' }}>{prompt}</span>
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={isFetching}
              autoFocus
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#d2ffe4',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}
            />
          </form>
        </div>
      </main>
    </div>
  );
};

export default SecureTerminal;
