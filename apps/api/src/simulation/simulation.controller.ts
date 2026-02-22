import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { SeedService } from './seed.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('simulation')
@UseGuards(JwtAuthGuard)
export class SimulationController {
  constructor(
    private readonly simulation: SimulationService,
    private readonly seed: SeedService
  ) {}

  @Get('state')
  getState() {
    return this.simulation.getState();
  }

  @Post('start')
  @UseGuards(AdminGuard)
  start() {
    return this.simulation.start();
  }

  @Post('stop')
  @UseGuards(AdminGuard)
  stop() {
    return this.simulation.stop();
  }

  @Post('seed-waikato')
  @UseGuards(AdminGuard)
  seedWaikato() {
    return this.seed.runWaikatoSeed();
  }
}
