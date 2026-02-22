import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RulesService } from './rules.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('rules')
@UseGuards(JwtAuthGuard)
export class RulesController {
  constructor(private readonly rules: RulesService) {}

  @Get('active')
  listActive() {
    return this.rules.listActiveRuleSets();
  }

  @Get('sets/:id')
  get(@Param('id') id: string) {
    return this.rules.getRuleSet(id);
  }

  @Post('sets/:id/activate')
  @UseGuards(AdminGuard)
  activate(@Param('id') id: string) {
    return this.rules.activateRuleSet(id);
  }

  @Post('seed-default')
  @UseGuards(AdminGuard)
  seedDefault() {
    return this.rules.seedDefaultRules();
  }
}
