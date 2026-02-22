import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';

const TICK_INTERVAL_MS = 5000;

@Injectable()
export class SimulationService {
  private repeatableJobId: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('simulation-tick') private readonly tickQueue: Queue
  ) {}

  async getState() {
    let state = await this.prisma.simulationState.findFirst();
    if (!state) {
      state = await this.prisma.simulationState.create({
        data: {},
      });
    }
    return {
      isRunning: state.isRunning,
      startedAt: state.startedAt,
      pausedAt: state.pausedAt,
    };
  }

  async start() {
    let state = await this.prisma.simulationState.findFirst();
    if (!state) {
      state = await this.prisma.simulationState.create({ data: {} });
    }
    await this.prisma.simulationState.update({
      where: { id: state.id },
      data: { isRunning: true, startedAt: new Date(), pausedAt: null },
    });
    const repeat = await this.tickQueue.add('tick', {}, { repeat: { every: TICK_INTERVAL_MS } });
    this.repeatableJobId = repeat.repeatJobKey ?? null;
    return this.getState();
  }

  async stop() {
    if (this.repeatableJobId) {
      try {
        await this.tickQueue.removeRepeatableByKey(this.repeatableJobId);
      } catch (_) {}
      this.repeatableJobId = null;
    }
    const state = await this.prisma.simulationState.findFirst();
    if (state) {
      await this.prisma.simulationState.update({
        where: { id: state.id },
        data: { isRunning: false, pausedAt: new Date() },
      });
    }
    return this.getState();
  }
}
