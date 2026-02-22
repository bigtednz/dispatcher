import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.station.findMany({
      include: { resources: true },
      orderBy: { name: 'asc' },
    });
  }

  async get(id: string) {
    const station = await this.prisma.station.findUnique({
      where: { id },
      include: { resources: true },
    });
    if (!station) return null;
    return station;
  }
}
