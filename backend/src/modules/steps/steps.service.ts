import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StepRecord } from './step.entity';
import { CreateStepDto } from './dto/create-step.dto';
import { UsersService } from '../users/users.service';
import { GoogleFitService } from '../google-fit/google-fit.service';

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

    const steps = await this.googleFitService.fetchDailySteps(user.googleAccessToken);

    return await this.create({
      userId,
      steps,
    });
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
