import { Controller, Get, Post, Put, Body, Param, ValidationPipe } from '@nestjs/common';
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
}
