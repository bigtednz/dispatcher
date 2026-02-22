import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list(@Query('incidentId') incidentId?: string, @Query('limit') limit?: string) {
    if (incidentId) {
      return this.events.listByIncident(incidentId);
    }
    return this.events.listRecent(limit ? parseInt(limit, 10) : 100);
  }
}
