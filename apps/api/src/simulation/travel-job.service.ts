import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';

const ROAD_FACTOR = 1.25;
const AVG_SPEED_KMH = 50; // approximate urban/rural mix

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

@Injectable()
export class TravelJobService {
  constructor(
    @InjectQueue('travel') private readonly travelQueue: Queue,
    private readonly prisma: PrismaService
  ) {}

  async scheduleTravel(resourceId: string, stationId: string, incidentId: string, incidentLat: number, incidentLng: number) {
    const station = await this.prisma.station.findUnique({ where: { id: stationId } });
    if (!station) return;

    const distanceKm = haversineKm(station.lat, station.lng, incidentLat, incidentLng) * ROAD_FACTOR;
    const etaMinutes = Math.max(1, Math.round((distanceKm / AVG_SPEED_KMH) * 60));

    await this.prisma.resource.update({
      where: { id: resourceId },
      data: { etaMinutes },
    });

    await this.travelQueue.add(
      'transition',
      {
        resourceId,
        incidentId,
        phase: 'ENROUTE',
        etaMinutes,
      },
      { delay: 0 }
    );

    await this.travelQueue.add(
      'transition',
      {
        resourceId,
        incidentId,
        phase: 'ON_SCENE',
        etaMinutes: 0,
      },
      { delay: etaMinutes * 60 * 1000 }
    );
  }
}
