import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { Capability, DispatchRecommendation, IncidentType } from '@dispatcher/shared';

interface RuleWhen {
  type?: IncidentType | IncidentType[];
  priority?: number | number[];
  [key: string]: unknown;
}

interface RuleRecommend {
  requiredCapabilities: Capability[];
  minimumCounts?: Record<string, number>;
  maxTravelMinutes?: number;
}

function matchesCondition(when: RuleWhen, context: { type: IncidentType; priority: number }) {
  if (when.type !== undefined) {
    const types = Array.isArray(when.type) ? when.type : [when.type];
    if (!types.includes(context.type)) return false;
  }
  if (when.priority !== undefined) {
    const priorities = Array.isArray(when.priority) ? when.priority : [when.priority];
    if (!priorities.includes(context.priority)) return false;
  }
  return true;
}

@Injectable()
export class RulesService {
  constructor(private readonly prisma: PrismaService) {}

  async listActiveRuleSets() {
    return this.prisma.ruleSet.findMany({
      where: { isActive: true },
      include: { rules: { orderBy: { priority: 'desc' } } },
      orderBy: { name: 'asc' },
    });
  }

  async getRuleSet(id: string) {
    return this.prisma.ruleSet.findUnique({
      where: { id },
      include: { rules: { orderBy: { priority: 'desc' } } },
    });
  }

  async activateRuleSet(id: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.ruleSet.updateMany({ data: { isActive: false } });
      await tx.ruleSet.update({ where: { id }, data: { isActive: true } });
    });
    return this.getRuleSet(id);
  }

  async evaluate(
    context: { type: IncidentType; priority: number; peopleInsideUnknown?: boolean }
  ): Promise<DispatchRecommendation | null> {
    const active = await this.prisma.ruleSet.findFirst({
      where: { isActive: true },
      include: { rules: { orderBy: { priority: 'desc' } } },
    });
    if (!active?.rules.length) return null;

    for (const rule of active.rules) {
      const when = rule.when as RuleWhen;
      if (!matchesCondition(when, context)) continue;
      const rec = rule.recommend as unknown as RuleRecommend;
      const minimumCounts: Partial<Record<Capability, number>> = {};
      if (rec.minimumCounts) {
        for (const [cap, count] of Object.entries(rec.minimumCounts)) {
          minimumCounts[cap as Capability] = count;
        }
      }
      return {
        requiredCapabilities: rec.requiredCapabilities ?? [],
        minimumCounts,
        maxTravelMinutes: rec.maxTravelMinutes,
        explanation: `Matched rule: ${rule.name}`,
        ruleName: rule.name,
      };
    }
    return null;
  }

  async seedDefaultRules() {
    const existing = await this.prisma.ruleSet.findFirst({ where: { name: 'default-v1' } });
    if (existing) return this.getRuleSet(existing.id);

    await this.prisma.ruleSet.updateMany({ data: { isActive: false } });

    const ruleSet = await this.prisma.ruleSet.create({
      data: {
        name: 'default-v1',
        version: 1,
        isActive: true,
        description: 'Default capability-based dispatch rules (placeholder)',
        rules: {
          create: [
            {
              name: 'house-fire-priority-1-2',
              priority: 100,
              when: { type: 'HOUSE_FIRE', priority: [1, 2] },
              recommend: {
                requiredCapabilities: ['PUMP', 'RESCUE', 'COMMAND'],
                minimumCounts: { PUMP: 2, RESCUE: 1, COMMAND: 1 },
                maxTravelMinutes: 15,
              },
            },
            {
              name: 'house-fire-default',
              priority: 50,
              when: { type: 'HOUSE_FIRE' },
              recommend: {
                requiredCapabilities: ['PUMP', 'RESCUE'],
                minimumCounts: { PUMP: 1, RESCUE: 1 },
                maxTravelMinutes: 20,
              },
            },
            {
              name: 'vehicle-crash',
              priority: 60,
              when: { type: 'VEHICLE_CRASH' },
              recommend: {
                requiredCapabilities: ['RESCUE', 'PUMP', 'MEDICAL_SUPPORT'],
                minimumCounts: { RESCUE: 1, PUMP: 1 },
                maxTravelMinutes: 15,
              },
            },
            {
              name: 'vegetation-fire',
              priority: 55,
              when: { type: 'VEGETATION_FIRE' },
              recommend: {
                requiredCapabilities: ['PUMP', 'WATER_SUPPLY_SUPPORT'],
                minimumCounts: { PUMP: 2 },
                maxTravelMinutes: 25,
              },
            },
            {
              name: 'hazmat-suspected',
              priority: 90,
              when: { type: 'HAZMAT_SUSPECTED' },
              recommend: {
                requiredCapabilities: ['HAZMAT_SUPPORT', 'COMMAND', 'PUMP'],
                minimumCounts: { HAZMAT_SUPPORT: 1, COMMAND: 1 },
                maxTravelMinutes: 20,
              },
            },
            {
              name: 'alarm-activation',
              priority: 30,
              when: { type: 'ALARM_ACTIVATION' },
              recommend: {
                requiredCapabilities: ['PUMP'],
                minimumCounts: { PUMP: 1 },
                maxTravelMinutes: 10,
              },
            },
            {
              name: 'medical-assist',
              priority: 70,
              when: { type: 'MEDICAL_ASSIST' },
              recommend: {
                requiredCapabilities: ['MEDICAL_SUPPORT', 'RESCUE'],
                minimumCounts: { MEDICAL_SUPPORT: 1 },
                maxTravelMinutes: 12,
              },
            },
            {
              name: 'fallback',
              priority: 1,
              when: {},
              recommend: {
                requiredCapabilities: ['PUMP'],
                minimumCounts: { PUMP: 1 },
                maxTravelMinutes: 25,
              },
            },
          ],
        },
      },
      include: { rules: true },
    });
    return this.getRuleSet(ruleSet.id);
  }
}
