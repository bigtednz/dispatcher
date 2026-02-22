import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DispatchGateway } from '../realtime/dispatch.gateway';
import type { EventType } from '@dispatcher/shared';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: DispatchGateway
  ) {}

  async append(params: {
    type: EventType;
    entityType: 'incident' | 'resource' | 'system';
    entityId: string;
    payload: Record<string, unknown>;
    incidentId?: string;
  }) {
    const entry = await this.prisma.eventLog.create({
      data: {
        type: params.type,
        entityType: params.entityType,
        entityId: params.entityId,
        payload: params.payload,
        incidentId: params.incidentId,
      },
    });
    this.gateway.broadcastEventLog({
      id: entry.id,
      type: entry.type,
      entityType: entry.entityType,
      entityId: entry.entityId,
      payload: entry.payload as Record<string, unknown>,
      createdAt: entry.createdAt.toISOString(),
    });
    return entry;
  }

  async listByIncident(incidentId: string) {
    return this.prisma.eventLog.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async listRecent(limit = 100) {
    return this.prisma.eventLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
