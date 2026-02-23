import type { Capability, IncidentType, IncidentStatus, ResourceStatus, EventType } from './enums';

export interface Location {
  lat: number;
  lng: number;
  label?: string;
}

export interface RuleRecommendation {
  requiredCapabilities: Capability[];
  minimumCounts?: Partial<Record<Capability, number>>;
  maxTravelMinutes?: number;
}

export interface RuleCondition {
  [key: string]: unknown;
}

export interface RuleScoreWeights {
  [key: string]: number;
}

export interface DispatchRecommendation {
  requiredCapabilities: Capability[];
  minimumCounts: Partial<Record<Capability, number>>;
  maxTravelMinutes?: number;
  explanation: string;
  ruleName?: string;
}

export interface IncidentSummary {
  id: string;
  type: IncidentType;
  status: IncidentStatus;
  priority: number;
  location: Location;
  label?: string;
  severity: number;
  createdAt: string;
  recommended?: DispatchRecommendation;
}

export interface ResourceSummary {
  id: string;
  stationId: string;
  callSign: string;
  capabilities: Capability[];
  status: ResourceStatus;
  currentIncidentId?: string;
  etaMinutes?: number;
}

export interface EventLogEntry {
  id: string;
  type: EventType;
  entityType: 'incident' | 'resource' | 'system';
  entityId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AARSummary {
  incidentId: string;
  type: IncidentType;
  recommended: DispatchRecommendation;
  sent: { resourceId: string; callSign: string; capabilities: Capability[] }[];
  timings: {
    firstUnitOnScene?: string;
    timeToContainment?: string;
    closedAt?: string;
  };
  scores: {
    responseTime: number;
    appropriateness: number;
    efficiency: number;
    outcome: number;
    overall: number;
  };
  narrative: string;
}
