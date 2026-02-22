import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimulationService } from './simulation.service';
import { PrismaService } from '../prisma.service';

describe('SimulationService', () => {
  let service: SimulationService;
  let prisma: PrismaService;
  let tickQueue: { add: ReturnType<typeof vi.fn>; removeRepeatableByKey: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = {
      simulationState: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    } as unknown as PrismaService;
    tickQueue = { add: vi.fn(), removeRepeatableByKey: vi.fn() };
    tickQueue.add.mockResolvedValue({ repeatJobKey: 'repeat-key-1' });
    service = new SimulationService(prisma, tickQueue as never);
  });

  it('getState creates state if missing', async () => {
    vi.mocked(prisma.simulationState.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.simulationState.create).mockResolvedValue({
      id: 's1',
      isRunning: false,
      startedAt: null,
      pausedAt: null,
      updatedAt: new Date(),
    } as never);
    const state = await service.getState();
    expect(state.isRunning).toBe(false);
    expect(prisma.simulationState.create).toHaveBeenCalled();
  });

  it('start sets isRunning and adds repeatable job', async () => {
    vi.mocked(prisma.simulationState.findFirst).mockResolvedValue({ id: 's1' } as never);
    vi.mocked(prisma.simulationState.update).mockResolvedValue({} as never);
    await service.start();
    expect(prisma.simulationState.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: expect.objectContaining({ isRunning: true }) })
    );
    expect(tickQueue.add).toHaveBeenCalledWith('tick', {}, expect.objectContaining({ repeat: expect.any(Object) }));
  });

  it('stop removes repeatable job and sets isRunning false', async () => {
    (service as { repeatableJobId: string | null }).repeatableJobId = 'repeat-key-1';
    vi.mocked(prisma.simulationState.findFirst).mockResolvedValue({ id: 's1' } as never);
    vi.mocked(prisma.simulationState.update).mockResolvedValue({} as never);
    await service.stop();
    expect(tickQueue.removeRepeatableByKey).toHaveBeenCalledWith('repeat-key-1');
    expect(prisma.simulationState.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: expect.objectContaining({ isRunning: false }) })
    );
  });
});
