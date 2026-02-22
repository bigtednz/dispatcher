/**
 * Socket.IO event contracts for realtime updates.
 * Server broadcasts; clients subscribe and receive.
 */

export const SOCKET_NAMESPACE = '/dispatch';

export const SOCKET_EVENTS = {
  // Server -> Client
  INCIDENT_UPDATED: 'incident:updated',
  RESOURCE_UPDATED: 'resource:updated',
  EVENT_LOG_ENTRY: 'event:log',
  SIMULATION_STATE: 'simulation:state',

  // Client -> Server (optional subscriptions)
  SUBSCRIBE_INCIDENTS: 'subscribe:incidents',
  SUBSCRIBE_RESOURCES: 'subscribe:resources',
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
