'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { incidents, events } from '@/lib/api';

type IncidentDetail = {
  id: string;
  type: string;
  status: string;
  priority: number;
  lat: number;
  lng: number;
  label?: string;
  severity: number;
  createdAt: string;
  closedAt?: string;
  recommended?: { requiredCapabilities: string[]; minimumCounts?: Record<string, number>; explanation: string };
  assignments?: { resource: { callSign: string; capabilities: string[] } }[];
};

type EventEntry = { id: string; type: string; entityType: string; entityId: string; payload: Record<string, unknown>; createdAt: string };

export default function IncidentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [eventLog, setEventLog] = useState<EventEntry[]>([]);

  useEffect(() => {
    incidents.get(id).then(setIncident).catch(() => setIncident(null));
    events.list(id).then((e) => setEventLog(e as EventEntry[]));
  }, [id]);

  async function handleClose() {
    try {
      await incidents.close(id);
      const updated = await incidents.get(id);
      setIncident(updated as IncidentDetail);
    } catch (_) {}
  }

  if (!incident) return <div className="p-8">Loading…</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-200">← Dashboard</Link>
        <h1 className="mt-4 text-2xl font-bold">{incident.type} — {incident.status}</h1>
        <p className="text-slate-400">Priority {incident.priority} · Severity {incident.severity}</p>
        <p className="text-slate-400">Location: {incident.label || `${incident.lat}, ${incident.lng}`}</p>

        {incident.recommended && (
          <section className="mt-6 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
            <h2 className="font-medium text-slate-300">Recommended response</h2>
            <p className="mt-1 text-sm">{incident.recommended.explanation}</p>
            <p className="mt-1 text-sm text-slate-400">Capabilities: {incident.recommended.requiredCapabilities?.join(', ') || '—'}</p>
          </section>
        )}

        <section className="mt-6 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
          <h2 className="font-medium text-slate-300">Dispatched units</h2>
          <ul className="mt-2 space-y-1">
            {(incident.assignments ?? []).map((a) => (
              <li key={a.resource.id} className="text-sm">{a.resource.callSign} — {a.resource.capabilities.join(', ')}</li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
          <h2 className="font-medium text-slate-300">Event timeline</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-400">
            {eventLog.map((e) => (
              <li key={e.id}>
                {new Date(e.createdAt).toLocaleString()} — {e.type}
              </li>
            ))}
          </ul>
        </section>

        {incident.status !== 'CLOSED' && (
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleClose}
              className="rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-500"
            >
              Close incident
            </button>
            <Link href={`/aar/${id}`} className="rounded border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-800">
              AAR (after close)
            </Link>
          </div>
        )}

        {incident.status === 'CLOSED' && (
          <Link
            href={`/aar/${id}`}
            className="mt-6 inline-block rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-500"
          >
            View After Action Review
          </Link>
        )}
      </div>
    </div>
  );
}
