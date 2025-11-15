import { Module } from '@nestjs/common';
import { StepSyncService } from './step-sync.service';
import { UsersModule } from '../users/users.module';
import { StepsModule } from '../steps/steps.module';

@Module({
  imports: [UsersModule, StepsModule],
  providers: [StepSyncService],
})
export class SchedulerModule {}
