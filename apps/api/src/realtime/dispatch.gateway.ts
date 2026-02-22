import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { SOCKET_NAMESPACE, SOCKET_EVENTS } from '@dispatcher/shared';

@WebSocketGateway({
  namespace: SOCKET_NAMESPACE,
  cors: { origin: process.env.WEB_ORIGIN || 'http://localhost:3000' },
})
export class DispatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection() {
    // Optional: verify JWT from handshake auth
  }

  handleDisconnect() {}

  broadcastIncidentUpdated(payload: unknown) {
    this.server.emit(SOCKET_EVENTS.INCIDENT_UPDATED, payload);
  }

  broadcastResourceUpdated(payload: unknown) {
    this.server.emit(SOCKET_EVENTS.RESOURCE_UPDATED, payload);
  }

  broadcastEventLog(payload: unknown) {
    this.server.emit(SOCKET_EVENTS.EVENT_LOG_ENTRY, payload);
  }

  broadcastSimulationState(payload: unknown) {
    this.server.emit(SOCKET_EVENTS.SIMULATION_STATE, payload);
  }
}
