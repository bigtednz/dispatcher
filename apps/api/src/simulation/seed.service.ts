import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WAIKATO_STATIONS, RESOURCES_BY_STATION } from '../../prisma/waikato-seed.data';

@Injectable()
export class SeedService {
  constructor(private readonly prisma: PrismaService) {}

  async runWaikatoSeed() {
    const existing = await this.prisma.station.findFirst({ where: { name: 'Morrinsville' } });
    if (existing) {
      return { message: 'Waikato seed already applied', stations: await this.prisma.station.count() };
    }

    for (const s of WAIKATO_STATIONS) {
      const station = await this.prisma.station.create({
        data: { name: s.name, lat: s.lat, lng: s.lng, address: s.address },
      });
      const resources = RESOURCES_BY_STATION[s.name] ?? [];
      for (const r of resources) {
        await this.prisma.resource.create({
          data: {
            stationId: station.id,
            callSign: r.callSign,
            capabilities: r.capabilities,
          },
        });
      }
    }

    return { message: 'Waikato seed applied', stations: WAIKATO_STATIONS.length };
  }
}
