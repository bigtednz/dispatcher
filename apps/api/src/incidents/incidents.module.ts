import { Module } from '@nestjs/common';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { AarService } from './aar.service';
import { SimulationModule } from '../simulation/simulation.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RulesModule } from '../rules/rules.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [SimulationModule, RealtimeModule, RulesModule, EventsModule],
  controllers: [IncidentsController],
  providers: [IncidentsService, AarService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
