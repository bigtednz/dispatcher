import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DispatchGateway } from '../realtime/dispatch.gateway';
import { RESOURCE_STATUSES } from '@dispatcher/shared';
import type { ResourceStatus } from '@dispatcher/shared';

@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: DispatchGateway
  ) {}

  async list() {
    return this.prisma.resource.findMany({
      include: { station: true },
      orderBy: [{ station: { name: 'asc' } }, { callSign: 'asc' }],
    });
  }

  async get(id: string) {
    return this.prisma.resource.findUnique({
      where: { id },
      include: { station: true },
    });
  }

  async updateStatus(id: string, status: ResourceStatus) {
    if (!RESOURCE_STATUSES.includes(status)) {
      throw new Error('Invalid status');
    }
    const updated = await this.prisma.resource.update({
      where: { id },
      data: {
        status,
        statusChangedAt: new Date(),
        ...(status === 'AVAILABLE' ? { currentIncidentId: null, etaMinutes: null } : {}),
      },
      include: { station: true },
    });
    this.gateway.broadcastResourceUpdated(updated);
    return updated;
  }
}
