import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { AarService } from './aar.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { DispatchDecisionDto } from './dto/dispatch-decision.dto';

@Controller('incidents')
@UseGuards(JwtAuthGuard)
export class IncidentsController {
  constructor(
    private readonly incidents: IncidentsService,
    private readonly aar: AarService
  ) {}

  @Post()
  create(@Body() dto: CreateIncidentDto) {
    return this.incidents.create(dto);
  }

  @Get()
  list(@Query('status') status?: string) {
    return this.incidents.list(status);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.incidents.get(id);
  }

  @Post(':id/dispatch')
  dispatch(@Param('id') id: string, @Body() dto: DispatchDecisionDto) {
    return this.incidents.dispatch(id, dto.assignments);
  }

  @Post(':id/close')
  close(@Param('id') id: string) {
    return this.incidents.close(id);
  }

  @Get(':id/aar')
  getAar(@Param('id') id: string) {
    return this.aar.getAar(id);
  }
}
