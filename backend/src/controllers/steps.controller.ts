import { Controller, Get, Post, Put, Body, Param, Query, ValidationPipe } from '@nestjs/common';
import { StepsService } from '../services/steps.service';
import { CreateStepDto } from '../dto/create-step.dto';
import { StepRecord } from '../entities/step.entity';
import { StepSyncService } from '../services/step-sync.service';

@Controller('steps')
export class StepsController {
  constructor(
    private readonly stepsService: StepsService,
    private readonly stepSyncService: StepSyncService,
  ) {}

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
   * Sync all users with Google Fit
   * POST /steps/sync-all
   */
  @Post('sync-all')
  async syncAllUsers(): Promise<{ message: string; timestamp: string }> {
    await this.stepSyncService.manualSyncAllUsers();
    return {
      message: 'Sync initiated for all users with Google Fit',
      timestamp: new Date().toISOString(),
    };
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
