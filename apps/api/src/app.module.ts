import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './auth/auth.module';
import { StationsModule } from './stations/stations.module';
import { ResourcesModule } from './resources/resources.module';
import { IncidentsModule } from './incidents/incidents.module';
import { RulesModule } from './rules/rules.module';
import { SimulationModule } from './simulation/simulation.module';
import { EventsModule } from './events/events.module';
import { RealtimeModule } from './realtime/realtime.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma.module';

const redisUrl = process.env.REDIS_URL;
const redisConnection = redisUrl
  ? { url: redisUrl }
  : {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      password: process.env.REDIS_PASSWORD ?? undefined,
    };

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({ connection: redisConnection }),
    PrismaModule,
    AuthModule,
    StationsModule,
    ResourcesModule,
    IncidentsModule,
    RulesModule,
    SimulationModule,
    EventsModule,
    RealtimeModule,
    HealthModule,
  ],
})
export class AppModule {}
