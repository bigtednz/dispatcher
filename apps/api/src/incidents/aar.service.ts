import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RulesService } from '../rules/rules.service';
import type { Capability, IncidentType } from '@dispatcher/shared';

@Injectable()
export class AarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rules: RulesService
  ) {}

  async getAar(incidentId: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        assignments: { include: { resource: { include: { station: true } } } },
        eventLogs: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    if (incident.status !== 'CLOSED') {
      throw new Error('AAR only available for closed incidents');
    }

    const recommended = await this.rules.evaluate({
      type: incident.type as IncidentType,
      priority: incident.priority,
      peopleInsideUnknown: incident.peopleInsideUnknown,
    });

    const sent = incident.assignments.map((a) => ({
      resourceId: a.resource.id,
      callSign: a.resource.callSign,
      capabilities: a.resource.capabilities as Capability[],
    }));

    const created = incident.createdAt.getTime();
    let firstUnitOnScene: Date | undefined;
    let containedAt: Date | undefined;
    for (const e of incident.eventLogs) {
      if (e.type === 'RESOURCE_ON_SCENE' && !firstUnitOnScene) {
        firstUnitOnScene = e.createdAt;
      }
      if (e.type === 'INCIDENT_CONTAINED') {
        containedAt = e.createdAt;
      }
    }

    const responseTimeMs = firstUnitOnScene ? firstUnitOnScene.getTime() - created : undefined;
    const timeToContainmentMs = containedAt ? containedAt.getTime() - created : undefined;

    const recCaps = recommended?.requiredCapabilities ?? [];
    const recCounts = recommended?.minimumCounts ?? {};
    const sentCounts: Record<string, number> = {};
    for (const s of sent) {
      for (const cap of s.capabilities) {
        sentCounts[cap] = (sentCounts[cap] ?? 0) + 1;
      }
    }
    let appropriateness = 100;
    for (const cap of recCaps) {
      const need = recCounts[cap] ?? 1;
      const have = sentCounts[cap] ?? 0;
      if (have < need) appropriateness -= (need - have) * 15;
      if (have > need + 1) appropriateness -= 5;
    }
    appropriateness = Math.max(0, Math.min(100, appropriateness));

    let efficiency = 100;
    const totalSent = sent.length;
    const totalRecommended = recCaps.reduce((sum, cap) => sum + (recCounts[cap] ?? 1), 0);
    if (totalSent > totalRecommended + 2) efficiency -= (totalSent - totalRecommended - 2) * 10;
    if (totalSent < totalRecommended - 1) efficiency -= 15;
    efficiency = Math.max(0, Math.min(100, efficiency));

    const responseTimeScore = responseTimeMs != null ? Math.max(0, 100 - Math.floor(responseTimeMs / 60000)) : 50;
    const outcomeScore = (100 - incident.severity) * 0.5 + (timeToContainmentMs != null ? Math.max(0, 50 - Math.floor(timeToContainmentMs / 60000) * 0.5) : 25);
    const overall = Math.round((appropriateness * 0.3 + efficiency * 0.2 + responseTimeScore * 0.2 + outcomeScore * 0.3));

    const narrative = this.buildNarrative(incident, sent, recommended, firstUnitOnScene, containedAt);

    return {
      incidentId: incident.id,
      type: incident.type,
      recommended: recommended ?? { requiredCapabilities: [], minimumCounts: {}, explanation: 'No rule matched' },
      sent,
      timings: {
        firstUnitOnScene: firstUnitOnScene?.toISOString(),
        timeToContainment: timeToContainmentMs != null ? `${Math.round(timeToContainmentMs / 60000)} min` : undefined,
        closedAt: incident.closedAt?.toISOString(),
      },
      scores: {
        responseTime: Math.round(responseTimeScore),
        appropriateness: Math.round(appropriateness),
        efficiency: Math.round(efficiency),
        outcome: Math.round(outcomeScore),
        overall: Math.min(100, Math.max(0, overall)),
      },
      narrative,
    };
  }

  private buildNarrative(
    incident: { type: string; severity: number; createdAt: Date },
    sent: { callSign: string }[],
    recommended: { requiredCapabilities: string[]; explanation: string } | null,
    firstUnitOnScene?: Date,
    containedAt?: Date
  ): string {
    const parts: string[] = [];
    parts.push(`Incident type: ${incident.type}. Recommended: ${recommended?.explanation ?? 'N/A'}.`);
    parts.push(`Dispatched ${sent.length} unit(s): ${sent.map((s) => s.callSign).join(', ')}.`);
    if (firstUnitOnScene) {
      const mins = Math.round((firstUnitOnScene.getTime() - incident.createdAt.getTime()) / 60000);
      parts.push(`First unit on scene at ${mins} minute(s) from call.`);
    }
    if (containedAt) {
      const mins = Math.round((containedAt.getTime() - incident.createdAt.getTime()) / 60000);
      parts.push(`Contained at ${mins} minute(s).`);
    }
    parts.push(`Final severity: ${incident.severity}/100.`);
    return parts.join(' ');
  }
}
