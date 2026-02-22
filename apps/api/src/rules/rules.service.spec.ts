import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RulesService } from './rules.service';
import { PrismaService } from '../prisma.service';

describe('RulesService', () => {
  let service: RulesService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      ruleSet: {
        findFirst: vi.fn(),
      },
    } as unknown as PrismaService;
    service = new RulesService(prisma);
  });

  it('evaluate returns null when no active ruleset', async () => {
    vi.mocked(prisma.ruleSet.findFirst).mockResolvedValue(null);
    const result = await service.evaluate({ type: 'HOUSE_FIRE', priority: 2 });
    expect(result).toBeNull();
  });

  it('evaluate returns first matching rule by priority', async () => {
    vi.mocked(prisma.ruleSet.findFirst).mockResolvedValue({
      id: 'rs1',
      rules: [
        { name: 'low', priority: 10, when: { type: 'HOUSE_FIRE' }, recommend: { requiredCapabilities: ['PUMP'] } },
        { name: 'high', priority: 100, when: { type: 'HOUSE_FIRE', priority: [1, 2] }, recommend: { requiredCapabilities: ['PUMP', 'RESCUE', 'COMMAND'], minimumCounts: { PUMP: 2 } } },
      ],
    } as never);
    const result = await service.evaluate({ type: 'HOUSE_FIRE', priority: 2 });
    expect(result).not.toBeNull();
    expect(result?.ruleName).toBe('high');
    expect(result?.requiredCapabilities).toContain('PUMP');
    expect(result?.requiredCapabilities).toContain('RESCUE');
    expect(result?.minimumCounts?.PUMP).toBe(2);
  });

  it('evaluate skips non-matching type', async () => {
    vi.mocked(prisma.ruleSet.findFirst).mockResolvedValue({
      id: 'rs1',
      rules: [
        { name: 'house', priority: 50, when: { type: 'HOUSE_FIRE' }, recommend: { requiredCapabilities: ['PUMP'] } },
      ],
    } as never);
    const result = await service.evaluate({ type: 'VEHICLE_CRASH', priority: 2 });
    expect(result).toBeNull();
  });
});
