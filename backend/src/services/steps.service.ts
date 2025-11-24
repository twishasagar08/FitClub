import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StepRecord } from '../entities/step.entity';
import { CreateStepDto } from '../dto/create-step.dto';
import { UsersService } from '../services/users.service';
import { GoogleFitService } from '../services/google-fit.service';

@Injectable()
export class StepsService {
  constructor(
    @InjectRepository(StepRecord)
    private stepRecordsRepository: Repository<StepRecord>,
    private usersService: UsersService,
    private googleFitService: GoogleFitService,
  ) {}

  async create(createStepDto: CreateStepDto): Promise<StepRecord> {
    const user = await this.usersService.findOne(createStepDto.userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if record already exists for today
    const existingRecord = await this.stepRecordsRepository.findOne({
      where: {
        userId: createStepDto.userId,
        date: today,
      },
    });

    if (existingRecord) {
      // Update existing record
      existingRecord.steps = createStepDto.steps;
      const savedRecord = await this.stepRecordsRepository.save(existingRecord);

      // Recalculate total steps
      await this.recalculateTotalSteps(createStepDto.userId);
      
      return savedRecord;
    }

    // Create new record
    const stepRecord = this.stepRecordsRepository.create({
      userId: createStepDto.userId,
      date: today,
      steps: createStepDto.steps,
    });

    const savedRecord = await this.stepRecordsRepository.save(stepRecord);

    // Update user's total steps
    await this.usersService.updateTotalSteps(createStepDto.userId, createStepDto.steps);

    return savedRecord;
  }

  async findByUserId(userId: string): Promise<StepRecord[]> {
    const user = await this.usersService.findOne(userId);
    return await this.stepRecordsRepository.find({
      where: { userId },
      order: { date: 'DESC' },
    });
  }

  async syncFromGoogleFit(userId: string): Promise<StepRecord> {
    const user = await this.usersService.findOne(userId);

    if (!user.googleAccessToken) {
      throw new NotFoundException('User does not have Google Fit access token');
    }

    // Use the method that handles token refresh automatically
    const steps = await this.googleFitService.fetchDailyStepsWithRefresh(user);

    return await this.create({
      userId,
      steps,
    });
  }

  /**
   * Creates or updates a step record for a specific date
   * Used by the cron job to save yesterday's steps
   */
  async createForDate(
    userId: string,
    date: Date,
    steps: number,
  ): Promise<StepRecord> {
    const user = await this.usersService.findOne(userId);

    // Normalize the date to midnight (00:00:00)
    const normalizedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    // Check if record already exists for this date
    const existingRecord = await this.stepRecordsRepository.findOne({
      where: {
        userId,
        date: normalizedDate,
      },
    });

    if (existingRecord) {
      // Calculate the difference to update total steps
      const stepDifference = steps - existingRecord.steps;
      
      // Update existing record
      existingRecord.steps = steps;
      const savedRecord = await this.stepRecordsRepository.save(existingRecord);

      // Update user's total steps
      if (stepDifference !== 0) {
        await this.usersService.addToTotalSteps(userId, stepDifference);
      }

      return savedRecord;
    }

    // Create new record
    const stepRecord = this.stepRecordsRepository.create({
      userId,
      date: normalizedDate,
      steps,
    });

    const savedRecord = await this.stepRecordsRepository.save(stepRecord);

    // Update user's total steps
    await this.usersService.addToTotalSteps(userId, steps);

    return savedRecord;
  }

  /**
   * Saves yesterday's step count for a user
   * Used by the midnight cron job
   */
  async saveDailySteps(userId: string, steps: number): Promise<StepRecord> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return await this.createForDate(userId, yesterday, steps);
  }

  private async recalculateTotalSteps(userId: string): Promise<void> {
    const records = await this.stepRecordsRepository.find({
      where: { userId },
    });

    const totalSteps = records.reduce((sum, record) => sum + record.steps, 0);

    const user = await this.usersService.findOne(userId);
    user.totalSteps = totalSteps;
    
    await this.usersService['usersRepository'].save(user);
  }
}
