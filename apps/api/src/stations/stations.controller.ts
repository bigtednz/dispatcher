import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { StationsService } from './stations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('stations')
@UseGuards(JwtAuthGuard)
export class StationsController {
  constructor(private readonly stations: StationsService) {}

  @Get()
  list() {
    return this.stations.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.stations.get(id);
  }
}
