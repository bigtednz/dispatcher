/**
 * Shared enums for the fire dispatch simulator.
 * British English where applicable (e.g. mobilisation).
 */

export const CAPABILITIES = [
  'PUMP',
  'RESCUE',
  'COMMAND',
  'WATER_SUPPLY_SUPPORT',
  'HAZMAT_SUPPORT',
  'MEDICAL_SUPPORT',
] as const;
export type Capability = (typeof CAPABILITIES)[number];

export const INCIDENT_TYPES = [
  'HOUSE_FIRE',
  'VEHICLE_CRASH',
  'VEGETATION_FIRE',
  'MEDICAL_ASSIST',
  'HAZMAT_SUSPECTED',
  'ALARM_ACTIVATION',
] as const;
export type IncidentType = (typeof INCIDENT_TYPES)[number];

export const INCIDENT_STATUSES = [
  'NEW',
  'TRIAGED',
  'DISPATCHED',
  'ACTIVE',
  'CONTAINED',
  'CLOSED',
] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const RESOURCE_STATUSES = [
  'AVAILABLE',
  'MOBILISED',
  'ENROUTE',
  'ON_SCENE',
  'RETURNING',
  'OFFLINE',
] as const;
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

export const EVENT_TYPES = [
  'INCIDENT_CREATED',
  'INCIDENT_TRIAGED',
  'INCIDENT_DISPATCHED',
  'INCIDENT_ACTIVE',
  'INCIDENT_CONTAINED',
  'INCIDENT_CLOSED',
  'RESOURCE_MOBILISED',
  'RESOURCE_ENROUTE',
  'RESOURCE_ON_SCENE',
  'RESOURCE_RETURNING',
  'RESOURCE_AVAILABLE',
  'CALL_UPDATE',
  'SEVERITY_CHANGE',
  'RECOMMENDATION_CHANGED',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];
