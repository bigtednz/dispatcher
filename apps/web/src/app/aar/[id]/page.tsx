'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { incidents } from '@/lib/api';

type AAR = {
  incidentId: string;
  type: string;
  recommended: { requiredCapabilities: string[]; minimumCounts?: Record<string, number>; explanation: string };
  sent: { resourceId: string; callSign: string; capabilities: string[] }[];
  timings: { firstUnitOnScene?: string; timeToContainment?: string; closedAt?: string };
  scores: { responseTime: number; appropriateness: number; efficiency: number; outcome: number; overall: number };
  narrative: string;
};

export default function AARPage() {
  const params = useParams();
  const id = params.id as string;
  const [aar, setAar] = useState<AAR | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    incidents
      .aar(id)
      .then((data) => setAar(data as AAR | null))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load AAR'));
  }, [id]);

  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!aar) return <div className="p-8">Loading…</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-200">← Dashboard</Link>
        <h1 className="mt-4 text-2xl font-bold">After Action Review</h1>
        <p className="text-slate-400">{aar.type} · Incident {aar.incidentId.slice(0, 8)}</p>

        <section className="mt-6 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
          <h2 className="font-medium text-slate-300">Recommended vs sent</h2>
          <p className="mt-2 text-sm">{aar.recommended.explanation}</p>
          <p className="mt-1 text-sm text-slate-400">Required capabilities: {aar.recommended.requiredCapabilities?.join(', ') || '—'}</p>
          <div className="mt-3 text-sm">
            <span className="text-slate-400">Sent: </span>
            {aar.sent.map((s) => s.callSign).join(', ')} ({aar.sent.map((s) => s.capabilities.join('/')).join('; ')})
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
          <h2 className="font-medium text-slate-300">Key timings</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-400">
            {aar.timings.firstUnitOnScene && <li>First unit on scene: {new Date(aar.timings.firstUnitOnScene).toLocaleString()}</li>}
            {aar.timings.timeToContainment && <li>Time to containment: {aar.timings.timeToContainment}</li>}
            {aar.timings.closedAt && <li>Closed: {new Date(aar.timings.closedAt).toLocaleString()}</li>}
          </ul>
        </section>

        <section className="mt-6 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
          <h2 className="font-medium text-slate-300">Scores</h2>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>Response time: <span className="text-amber-400">{aar.scores.responseTime}</span></div>
            <div>Appropriateness: <span className="text-amber-400">{aar.scores.appropriateness}</span></div>
            <div>Efficiency: <span className="text-amber-400">{aar.scores.efficiency}</span></div>
            <div>Outcome: <span className="text-amber-400">{aar.scores.outcome}</span></div>
            <div className="col-span-2 font-medium">Overall: <span className="text-amber-400">{aar.scores.overall}</span></div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
          <h2 className="font-medium text-slate-300">Narrative</h2>
          <p className="mt-2 text-sm text-slate-300">{aar.narrative}</p>
        </section>

        <Link href="/dashboard" className="mt-6 inline-block rounded bg-slate-700 px-4 py-2 text-slate-200 hover:bg-slate-600">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
