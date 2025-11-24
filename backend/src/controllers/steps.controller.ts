import { Controller, Get, Post, Put, Body, Param, Query, ValidationPipe } from '@nestjs/common';
import { StepsService } from '../services/steps.service';
import { CreateStepDto } from '../dto/create-step.dto';
import { StepRecord } from '../entities/step.entity';

@Controller('steps')
export class StepsController {
  constructor(private readonly stepsService: StepsService) {}

  @Post()
  async create(
    @Body(ValidationPipe) createStepDto: CreateStepDto,
  ): Promise<StepRecord> {
    return await this.stepsService.create(createStepDto);
  }

  @Get(':userId')
  async findByUserId(@Param('userId') userId: string): Promise<StepRecord[]> {
    return await this.stepsService.findByUserId(userId);
  }

  @Put('sync/:userId')
  async syncFromGoogleFit(@Param('userId') userId: string): Promise<StepRecord> {
    return await this.stepsService.syncFromGoogleFit(userId);
  }

  /**
   * Sync historical data for a user (backfill missing days)
   * GET /steps/sync-history/:userId?days=7
   */
  @Get('sync-history/:userId')
  async syncHistoricalData(
    @Param('userId') userId: string,
    @Query('days') days?: string,
  ): Promise<{ synced: number; records: StepRecord[] }> {
    const daysToSync = days ? parseInt(days, 10) : 7;
    return await this.stepsService.syncHistoricalData(userId, daysToSync);
  }
}
