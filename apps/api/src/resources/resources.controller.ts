import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { ResourceStatusUpdateDto } from './dto/resource-status-update.dto';

@Controller('resources')
@UseGuards(JwtAuthGuard)
export class ResourcesController {
  constructor(private readonly resources: ResourcesService) {}

  @Get()
  list() {
    return this.resources.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.resources.get(id);
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  updateStatus(@Param('id') id: string, @Body() dto: ResourceStatusUpdateDto) {
    return this.resources.updateStatus(id, dto.status);
  }
}
