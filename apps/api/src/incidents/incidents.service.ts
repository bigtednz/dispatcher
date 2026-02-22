import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RulesService } from '../rules/rules.service';
import { EventsService } from '../events/events.service';
import { TravelJobService } from '../simulation/travel-job.service';
import { DispatchGateway } from '../realtime/dispatch.gateway';
import type { IncidentType } from '@dispatcher/shared';

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rules: RulesService,
    private readonly events: EventsService,
    private readonly travelJobs: TravelJobService,
    private readonly gateway: DispatchGateway
  ) {}

  async create(dto: {
    type: string;
    priority: number;
    lat: number;
    lng: number;
    label?: string;
    peopleInsideUnknown?: boolean;
    severity?: number;
  }) {
    const incident = await this.prisma.incident.create({
      data: {
        type: dto.type,
        priority: dto.priority,
        lat: dto.lat,
        lng: dto.lng,
        label: dto.label,
        severity: dto.severity ?? 50,
        peopleInsideUnknown: dto.peopleInsideUnknown ?? false,
      },
    });
    await this.events.append({
      type: 'INCIDENT_CREATED',
      entityType: 'incident',
      entityId: incident.id,
      payload: { type: incident.type, priority: incident.priority, location: { lat: incident.lat, lng: incident.lng } },
      incidentId: incident.id,
    });
    this.gateway.broadcastIncidentUpdated(incident);
    return incident;
  }

  async list(status?: string) {
    const where = status ? { status } : {};
    return this.prisma.incident.findMany({
      where,
      include: { assignments: { include: { resource: { include: { station: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: { assignments: { include: { resource: { include: { station: true } } } } },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    const recommended = await this.rules.evaluate({
      type: incident.type as IncidentType,
      priority: incident.priority,
      peopleInsideUnknown: incident.peopleInsideUnknown,
    });
    return {
      ...incident,
      recommended,
    };
  }

  async dispatch(id: string, assignments: { resourceId: string; role?: string }[]) {
    const incident = await this.prisma.incident.findUnique({ where: { id }, include: { assignments: true } });
    if (!incident) throw new NotFoundException('Incident not found');
    if (incident.status === 'CLOSED') throw new Error('Cannot dispatch closed incident');

    await this.prisma.$transaction(async (tx) => {
      for (const a of assignments) {
        await tx.assignment.upsert({
          where: {
            incidentId_resourceId: { incidentId: id, resourceId: a.resourceId },
          },
          create: { incidentId: id, resourceId: a.resourceId, role: a.role },
          update: { role: a.role },
        });
        await tx.resource.update({
          where: { id: a.resourceId },
          data: {
            status: 'MOBILISED',
            currentIncidentId: id,
            statusChangedAt: new Date(),
          },
        });
      }
      await tx.incident.update({
        where: { id },
        data: { status: 'DISPATCHED' },
      });
    });

    await this.events.append({
      type: 'INCIDENT_DISPATCHED',
      entityType: 'incident',
      entityId: id,
      payload: { assignments: assignments.map((a) => a.resourceId) },
      incidentId: id,
    });

    for (const a of assignments) {
      const resource = await this.prisma.resource.findUnique({
        where: { id: a.resourceId },
        include: { station: true },
      });
      if (resource) {
        await this.events.append({
          type: 'RESOURCE_MOBILISED',
          entityType: 'resource',
          entityId: resource.id,
          payload: { incidentId: id, callSign: resource.callSign },
          incidentId: id,
        });
        await this.travelJobs.scheduleTravel(resource.id, resource.stationId, id, incident.lat, incident.lng);
      }
    }

    const updated = await this.get(id);
    this.gateway.broadcastIncidentUpdated(updated);
    return updated;
  }

  async close(id: string) {
    const incident = await this.prisma.incident.findUnique({ where: { id }, include: { assignments: true } });
    if (!incident) throw new NotFoundException('Incident not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.incident.update({
        where: { id },
        data: { status: 'CLOSED', closedAt: new Date() },
      });
      for (const a of incident.assignments) {
        await tx.resource.update({
          where: { id: a.resourceId },
          data: {
            status: 'AVAILABLE',
            currentIncidentId: null,
            etaMinutes: null,
            statusChangedAt: new Date(),
          },
        });
      }
    });

    await this.events.append({
      type: 'INCIDENT_CLOSED',
      entityType: 'incident',
      entityId: id,
      payload: {},
      incidentId: id,
    });

    const updated = await this.get(id);
    this.gateway.broadcastIncidentUpdated(updated);
    return updated;
  }
}
