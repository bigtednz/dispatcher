import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SimulationController } from './simulation.controller';
import { SimulationService } from './simulation.service';
import { TravelJobService } from './travel-job.service';
import { SeedService } from './seed.service';
import { TravelProcessor } from './processors/travel.processor';
import { SimulationTickProcessor } from './processors/tick.processor';
import { RulesModule } from '../rules/rules.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'travel' }),
    BullModule.registerQueue({ name: 'simulation-tick' }),
    RulesModule,
    RealtimeModule,
    EventsModule,
  ],
  controllers: [SimulationController],
  providers: [SimulationService, TravelJobService, SeedService, TravelProcessor, SimulationTickProcessor],
  exports: [TravelJobService],
})
export class SimulationModule {}
