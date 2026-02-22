import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EventsService } from '../events/events.service';
import { RulesService } from '../rules/rules.service';

@Processor('simulation-tick')
@Injectable()
export class SimulationTickProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly rules: RulesService
  ) {
    super();
  }

  async process(_job: Job) {
    const state = await this.prisma.simulationState.findFirst();
    if (!state?.isRunning) return;

    const active = await this.prisma.incident.findMany({
      where: { status: 'ACTIVE' },
      include: { assignments: { include: { resource: true } } },
    });

    for (const incident of active) {
      const recommended = await this.rules.evaluate({
        type: incident.type as 'HOUSE_FIRE' | 'VEHICLE_CRASH' | 'VEGETATION_FIRE' | 'MEDICAL_ASSIST' | 'HAZMAT_SUSPECTED' | 'ALARM_ACTIVATION',
        priority: incident.priority,
      });
      const onScene = incident.assignments.filter((a) => a.resource.status === 'ON_SCENE');
      const capabilityCounts: Record<string, number> = {};
      for (const a of onScene) {
        for (const cap of a.resource.capabilities) {
          capabilityCounts[cap] = (capabilityCounts[cap] ?? 0) + 1;
        }
      }
      const meetsRecommendation = recommended
        ? (recommended.requiredCapabilities.every((cap) => (capabilityCounts[cap] ?? 0) >= (recommended.minimumCounts?.[cap] ?? 1)) ?? false)
        : true;

      let newSeverity = incident.severity;
      if (meetsRecommendation) {
        newSeverity = Math.max(0, incident.severity - 2);
      } else {
        newSeverity = Math.min(100, incident.severity + 3);
      }

      if (newSeverity !== incident.severity) {
        await this.prisma.incident.update({
          where: { id: incident.id },
          data: { severity: newSeverity },
        });
        await this.events.append({
          type: 'SEVERITY_CHANGE',
          entityType: 'incident',
          entityId: incident.id,
          payload: { from: incident.severity, to: newSeverity },
          incidentId: incident.id,
        });
      }

      if (newSeverity <= 10 && incident.status === 'ACTIVE') {
        await this.prisma.incident.update({
          where: { id: incident.id },
          data: { status: 'CONTAINED' },
        });
        await this.events.append({
          type: 'INCIDENT_CONTAINED',
          entityType: 'incident',
          entityId: incident.id,
          payload: {},
          incidentId: incident.id,
        });
      }
    }

    if (Math.random() < 0.1) {
      const newCalls = await this.prisma.incident.findMany({
        where: { status: { in: ['NEW', 'TRIAGED'] } },
        take: 1,
      });
      for (const inc of newCalls) {
        await this.events.append({
          type: 'CALL_UPDATE',
          entityType: 'incident',
          entityId: inc.id,
          payload: { note: 'Simulated call update' },
          incidentId: inc.id,
        });
      }
    }
  }
}
