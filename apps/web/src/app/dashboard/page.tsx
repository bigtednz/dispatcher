'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api, incidents, resources, stations, simulation, events } from '@/lib/api';
import { SOCKET_NAMESPACE, SOCKET_EVENTS } from '@dispatcher/shared';
import { io } from 'socket.io-client';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

type Incident = {
  id: string;
  type: string;
  status: string;
  priority: number;
  lat: number;
  lng: number;
  label?: string;
  severity: number;
  createdAt: string;
  assignments?: { resource: { callSign: string } }[];
};

type Resource = {
  id: string;
  callSign: string;
  stationId: string;
  station: { name: string };
  capabilities: string[];
  status: string;
  currentIncidentId?: string;
  etaMinutes?: number;
};

type EventEntry = {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export default function DashboardPage() {
  const { token, logout } = useAuth();
  const [incidentsList, setIncidentsList] = useState<Incident[]>([]);
  const [resourcesList, setResourcesList] = useState<Resource[]>([]);
  const [stationsList, setStationsList] = useState<{ id: string; name: string; lat: number; lng: number }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<EventEntry[]>([]);
  const [simState, setSimState] = useState<{ isRunning: boolean }>({ isRunning: false });
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  const resourcesForMap = useMemo(
    () =>
      resourcesList.map((r) => {
        const st = stationsList.find((s) => s.id === r.stationId);
        return {
          id: r.id,
          callSign: r.callSign,
          stationId: r.stationId,
          status: r.status,
          station: st ? { lat: st.lat, lng: st.lng } : undefined,
        };
      }),
    [resourcesList, stationsList]
  );

  const fetchAll = useCallback(async () => {
    if (!token) return;
    try {
      const [inc, res, st, ev, sim] = await Promise.all([
        incidents.list(),
        resources.list(),
        stations.list(),
        events.list(),
        simulation.state(),
      ]);
      setIncidentsList(inc as Incident[]);
      setResourcesList(res as Resource[]);
      setStationsList((st as { id: string; name: string; lat: number; lng: number }[]).map((s) => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng })));
      setEventLog((ev as EventEntry[]).slice(0, 50));
      setSimState({ isRunning: (sim as { isRunning: boolean }).isRunning });
    } catch (_) {}
  }, [token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const origin = apiUrl.replace(/\/api\/?$/, '') || 'http://localhost:4000';
    const socket = io(`${origin}${SOCKET_NAMESPACE}`, { transports: ['websocket'], auth: { token } });
    socketRef.current = socket;
    socket.on(SOCKET_EVENTS.INCIDENT_UPDATED, () => fetchAll());
    socket.on(SOCKET_EVENTS.RESOURCE_UPDATED, () => fetchAll());
    socket.on(SOCKET_EVENTS.EVENT_LOG_ENTRY, (payload: EventEntry) => {
      setEventLog((prev) => [payload, ...prev].slice(0, 100));
    });
    socket.on(SOCKET_EVENTS.SIMULATION_STATE, (s: { isRunning: boolean }) => setSimState(s));
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, fetchAll]);

  const selectedIncident = selectedId ? incidentsList.find((i) => i.id === selectedId) : null;
  const selectedDetail = selectedId ? incidentsList.find((i) => i.id === selectedId) : null;

  async function handleStartShift() {
    try {
      await api('/simulation/start', { method: 'POST' });
      setSimState({ isRunning: true });
    } catch (_) {}
  }

  async function handleStopShift() {
    try {
      await api('/simulation/stop', { method: 'POST' });
      setSimState({ isRunning: false });
    } catch (_) {}
  }

  if (typeof window !== 'undefined' && token === null && !localStorage.getItem('dispatcher_token')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-400">Redirecting to login…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-2">
        <h1 className="text-lg font-semibold">CAD — Fire Dispatch Simulator</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">
            Simulation: {simState.isRunning ? 'Running' : 'Stopped'}
          </span>
          <button
            onClick={simState.isRunning ? handleStopShift : handleStartShift}
            className="rounded bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600"
          >
            {simState.isRunning ? 'End shift' : 'Start shift'}
          </button>
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
            Home
          </Link>
          <button onClick={logout} className="text-sm text-slate-400 hover:text-slate-200">
            Log out
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-slate-700 bg-slate-900/50">
          <div className="p-2 font-medium text-slate-300">Call queue</div>
          <ul className="divide-y divide-slate-700">
            {incidentsList.map((inc) => (
              <li
                key={inc.id}
                onClick={() => setSelectedId(inc.id)}
                className={`cursor-pointer px-3 py-2 text-sm ${selectedId === inc.id ? 'bg-amber-900/30' : 'hover:bg-slate-800'}`}
              >
                <div className="font-mono text-xs text-slate-500">{inc.type}</div>
                <div>P{inc.priority} · {inc.status}</div>
                <div className="text-xs text-slate-400">{inc.label || `${inc.lat.toFixed(2)}, ${inc.lng.toFixed(2)}`}</div>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-slate-700 p-2">
            <div className="font-medium text-slate-300">Live transcript</div>
            <p className="mt-1 text-xs text-slate-500">Call updates appear here and in timeline.</p>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 relative">
            <MapView
              stations={stationsList}
              resources={resourcesForMap}
              incidents={incidentsList}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
          <div className="h-32 shrink-0 overflow-y-auto border-t border-slate-700 bg-slate-900/50">
            <div className="p-2 font-medium text-slate-300">Timeline (event log)</div>
            <ul className="space-y-0.5 px-2 pb-2 text-xs">
              {eventLog.map((e) => (
                <li key={e.id} className="text-slate-400">
                  <span className="text-slate-500">{new Date(e.createdAt).toLocaleTimeString()}</span>{' '}
                  {e.type} · {e.entityType} {e.entityId.slice(0, 8)}
                </li>
              ))}
            </ul>
          </div>
        </main>

        <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-700 bg-slate-900/50">
          <div className="p-2 font-medium text-slate-300">Dispatch panel</div>
          {selectedDetail ? (
            <DispatchPanel incidentId={selectedDetail.id} onClose={() => setSelectedId(null)} />
          ) : (
            <p className="p-4 text-sm text-slate-500">Select an incident from the call queue.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

function DispatchPanel({ incidentId, onClose }: { incidentId: string; onClose: () => void }) {
  const [incident, setIncident] = useState<{
    id: string;
    type: string;
    status: string;
    recommended?: { requiredCapabilities: string[]; minimumCounts?: Record<string, number>; explanation: string };
    assignments?: { resourceId: string; resource: { callSign: string; capabilities: string[] } }[];
  } | null>(null);
  const [resourcesList, setResourcesList] = useState<Resource[]>([]);
  const [dispatching, setDispatching] = useState(false);

  useEffect(() => {
    incidents
      .get(incidentId)
      .then((data) => setIncident(data as typeof incident))
      .catch(() => setIncident(null));
    resources.list().then((r) => setResourcesList(r as Resource[]));
  }, [incidentId]);

  if (!incident) return <div className="p-4 text-slate-500">Loading…</div>;

  const available = resourcesList.filter((r) => r.status === 'AVAILABLE');
  const assigned = incident.assignments ?? [];

  async function handleDispatch(resourceIds: string[]) {
    setDispatching(true);
    try {
      await incidents.dispatch(
        incidentId,
        resourceIds.map((resourceId) => ({ resourceId }))
      );
      const updated = await incidents.get(incidentId);
      setIncident(updated as typeof incident);
    } finally {
      setDispatching(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between">
        <h2 className="font-medium">{incident.type} — {incident.status}</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">×</button>
      </div>
      {incident.recommended && (
        <div className="rounded bg-slate-800 p-3 text-sm">
          <div className="text-slate-400">Recommended</div>
          <p className="mt-1">{incident.recommended.explanation}</p>
          <p className="mt-1 text-slate-400">
            Capabilities: {incident.recommended.requiredCapabilities?.join(', ') || '—'}
          </p>
        </div>
      )}
      <div>
        <div className="text-slate-400 text-sm">Assigned</div>
        <ul className="mt-1 space-y-1">
          {assigned.map((a) => (
            <li key={a.resourceId} className="text-sm">{a.resource.callSign}</li>
          ))}
        </ul>
      </div>
      {incident.status !== 'CLOSED' && (
        <>
          <div className="text-slate-400 text-sm">Available resources</div>
          <ul className="space-y-1">
            {available.slice(0, 8).map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => handleDispatch([...assigned.map((a) => a.resourceId), r.id])}
                  disabled={dispatching}
                  className="w-full rounded bg-slate-700 px-2 py-1 text-left text-sm hover:bg-slate-600 disabled:opacity-50"
                >
                  {r.callSign} — {r.capabilities.join(', ')}
                </button>
              </li>
            ))}
          </ul>
          <Link
            href={`/incident/${incidentId}`}
            className="block rounded bg-amber-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-amber-500"
          >
            Open incident
          </Link>
          {incident.status !== 'NEW' && incident.status !== 'TRIAGED' && (
            <Link
              href={`/aar/${incidentId}`}
              className="mt-2 block text-center text-sm text-slate-400 hover:text-slate-200"
            >
              AAR (when closed)
            </Link>
          )}
        </>
      )}
    </div>
  );
}
