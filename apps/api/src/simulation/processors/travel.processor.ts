import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { EventsService } from '../../events/events.service';
import { DispatchGateway } from '../../realtime/dispatch.gateway';

@Processor('travel')
@Injectable()
export class TravelProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly gateway: DispatchGateway
  ) {
    super();
  }

  async process(job: Job<{ resourceId: string; incidentId: string; phase: string; etaMinutes?: number }>) {
    const { resourceId, incidentId, phase } = job.data;
    const resource = await this.prisma.resource.findUnique({ where: { id: resourceId }, include: { station: true } });
    if (!resource) return;

    const updated = await this.prisma.resource.update({
      where: { id: resourceId },
      data: {
        status: phase as 'ENROUTE' | 'ON_SCENE',
        etaMinutes: phase === 'ON_SCENE' ? null : job.data.etaMinutes ?? null,
        statusChangedAt: new Date(),
      },
      include: { station: true },
    });
    this.gateway.broadcastResourceUpdated(updated);

    const eventType = phase === 'ENROUTE' ? 'RESOURCE_ENROUTE' : 'RESOURCE_ON_SCENE';
    await this.events.append({
      type: eventType as 'RESOURCE_ENROUTE' | 'RESOURCE_ON_SCENE',
      entityType: 'resource',
      entityId: resourceId,
      payload: { incidentId, callSign: resource.callSign },
      incidentId,
    });

    if (phase === 'ON_SCENE') {
      const incident = await this.prisma.incident.findUnique({ where: { id: incidentId } });
      if (incident?.status === 'DISPATCHED') {
        await this.prisma.incident.update({
          where: { id: incidentId },
          data: { status: 'ACTIVE' },
        });
        await this.events.append({
          type: 'INCIDENT_ACTIVE',
          entityType: 'incident',
          entityId: incidentId,
          payload: {},
          incidentId,
        });
      }
    }
  }
}
