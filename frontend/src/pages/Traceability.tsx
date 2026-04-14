import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MapView from '../components/MapView';
import {
  useGetAllBatchesQuery,
  useGetBatchDetailsQuery,
  useGetBlockchainProofQuery,
} from '../redux-slice/pharmaApiSlice';

const fmtDateTime = (value?: string) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const shorten = (value?: string, size = 10) => {
  if (!value) return 'N/A';
  if (value.length <= size) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const Traceability: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  const { data: batchesResponse, isLoading: loadingBatches } = useGetAllBatchesQuery();
  const batches = (batchesResponse as any)?.data || [];

  const selected = useMemo(() => {
    if (!selectedBatchId && batches.length > 0) return batches[0];
    return batches.find((b: any) => b.batchId === selectedBatchId) || batches[0];
  }, [batches, selectedBatchId]);

  const { data: detailsResponse, isLoading: loadingDetails } = useGetBatchDetailsQuery(selected?.batchId || '', {
    skip: !selected?.batchId,
  });
  const details = (detailsResponse as any)?.data;

  const { data: proofResponse } = useGetBlockchainProofQuery(selected?.batchId || '', {
    skip: !selected?.batchId,
  });
  const proof = (proofResponse as any)?.data;

  const stages = (details?.stages || []).map((stage: any, index: number, arr: any[]) => ({
    stage: stage.name || stage.stage || stage.location,
    location: stage.location,
    timestamp: stage.timestamp,
    temperature: stage.temperature,
    status: index === arr.length - 1 ? 'current' as const : 'completed' as const,
    coordinates: stage.coordinates
      ? {
          lat: typeof stage.coordinates.lat === 'string' ? parseFloat(stage.coordinates.lat) : stage.coordinates.lat,
          lng: typeof stage.coordinates.lng === 'string' ? parseFloat(stage.coordinates.lng) : stage.coordinates.lng,
        }
      : undefined,
  }));

  const filtered = useMemo(() => {
    if (!query.trim()) return batches;
    const q = query.toLowerCase();
    return batches.filter((b: any) =>
      String(b.batchId || '').toLowerCase().includes(q) ||
      String(b.medicineName || '').toLowerCase().includes(q)
    );
  }, [batches, query]);

  return (
    <div style={{ minHeight: '100vh', background: '#eef2f7', color: '#1f2d3d' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh' }}>
        <aside style={{ background: 'linear-gradient(180deg, #0d2c5a, #0b1f3e)', color: '#d8e4ff' }}>
          <div style={{ padding: '18px 18px', borderBottom: '1px solid rgba(255,255,255,0.15)', fontWeight: 700, fontSize: '24px' }}>
            🧬 Pharma SCM
          </div>
          <nav style={{ padding: '12px' }}>
            {[
              ['Dashboard', '/'],
              ['Traceability', '/traceability'],
              ['Inventory', '/inventory'],
              ['Compliance', '/verify'],
              ['Cold Chain', '/cold-chain'],
              ['Recalls', '/inventory'],
              ['Blockchain Health', '/verify'],
              ['Rust Secure OS', '/secure-terminal'],
            ].map(([label, path]) => (
              <Link
                key={label}
                to={path}
                style={{
                  display: 'block',
                  padding: '10px 12px',
                  marginBottom: '8px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: label === 'Traceability' ? '#fff' : '#d8e4ff',
                  background: label === 'Traceability' ? 'rgba(41, 110, 255, 0.55)' : 'transparent',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <div>
          <header style={{ background: '#1756c6', color: '#fff', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Batch ID, Serial Number..."
              style={{
                width: '100%',
                maxWidth: '520px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.35)',
                padding: '10px 12px',
                outline: 'none',
              }}
            />
            <button
              style={{
                border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: '6px',
                padding: '10px 18px',
                background: '#1d4fb1',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              onClick={() => {
                const first = filtered[0];
                if (first) setSelectedBatchId(first.batchId);
              }}
            >
              Search
            </button>
            <div style={{ marginLeft: 'auto', fontSize: '13px', opacity: 0.95 }}>
              🔔 Admin
            </div>
          </header>

          <main style={{ padding: '16px 20px' }}>
            <h2 style={{ fontSize: '28px', marginBottom: '12px', color: '#173f7a' }}>Batch Overview</h2>

            {loadingBatches || loadingDetails || !selected ? (
              <div style={{ background: '#fff', borderRadius: '10px', padding: '18px', border: '1px solid #dbe3ef' }}>Loading...</div>
            ) : (
              <>
                <section style={{ background: '#fff', borderRadius: '10px', padding: '16px', border: '1px solid #dbe3ef', marginBottom: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '15px' }}>
                    <div>
                      <div><strong>Batch ID:</strong> {selected.batchId}</div>
                      <div style={{ marginTop: '8px' }}><strong>Drug:</strong> {selected.medicineName}</div>
                      <div style={{ marginTop: '8px' }}><strong>Origin:</strong> {selected.origin}</div>
                      <div style={{ marginTop: '8px' }}><strong>Status:</strong> <span style={{ color: '#0f9d58', fontWeight: 700 }}>{selected.status}</span></div>
                    </div>
                    <div>
                      <div><strong>Current Location:</strong> {selected.destination}</div>
                      <div style={{ marginTop: '8px' }}><strong>Current Stage:</strong> {selected.currentStage}</div>
                      <div style={{ marginTop: '8px' }}><strong>Temperature:</strong> {selected.temperature}°C</div>
                      <div style={{ marginTop: '8px' }}><strong>Target Range:</strong> {selected.targetTempMin}°C - {selected.targetTempMax}°C</div>
                    </div>
                  </div>
                </section>

                <section style={{ background: '#fff', borderRadius: '10px', border: '1px solid #dbe3ef', marginBottom: '14px' }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #e7edf5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '24px', color: '#173f7a' }}>Shipment Journey</h3>
                    <Link to={`/batch/${selected.batchId}`} style={{ textDecoration: 'none', fontSize: '13px', color: '#1756c6', fontWeight: 700 }}>View Full Journey</Link>
                  </div>

                  <div style={{ padding: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, stages.length)}, minmax(160px, 1fr))`, gap: '8px', marginBottom: '14px' }}>
                      {stages.map((s: any, idx: number) => (
                        <div key={`${s.stage}-${idx}`} style={{ padding: '10px', borderRadius: '8px', background: s.status === 'current' ? '#e6f0ff' : '#f4f7fb', border: '1px solid #dbe3ef' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700 }}>{s.stage}</div>
                          <div style={{ fontSize: '12px', color: '#4d617a', marginTop: '4px' }}>{fmtDateTime(s.timestamp)}</div>
                        </div>
                      ))}
                    </div>
                    <MapView stages={stages} height="260px" />
                  </div>
                </section>

                <section style={{ background: '#fff', borderRadius: '10px', border: '1px solid #dbe3ef' }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #e7edf5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '24px', color: '#173f7a' }}>Blockchain Verification</h3>
                    <span style={{ fontSize: '13px', color: '#1756c6', fontWeight: 700 }}>Verify on Blockchain</span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead style={{ background: '#f4f7fb' }}>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e7edf5' }}>Transaction Hash</th>
                          <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e7edf5' }}>Block ID</th>
                          <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e7edf5' }}>Timestamp</th>
                          <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e7edf5' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(proof?.events && proof.events.length > 0 ? proof.events : [{
                          transactionHash: proof?.transactionHash,
                          blockNumber: proof?.blockNumber,
                          timestamp: proof?.timestamp,
                          event: 'HashStored'
                        }]).map((row: any, idx: number) => (
                          <tr key={`${row.transactionHash || 'row'}-${idx}`}>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f3f8', fontFamily: 'monospace' }}>{shorten(row.transactionHash || selected.blockchainHash, 18)}</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f3f8' }}>{row.blockNumber || 'N/A'}</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f3f8' }}>{fmtDateTime(row.timestamp)}</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid #f0f3f8', color: '#0f9d58', fontWeight: 700 }}>● Verified</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Traceability;
