import { Module } from '@nestjs/common';
import { StepSyncService } from '../services/step-sync.service';
import { UsersModule } from '../modules/users.module';
import { StepsModule } from '../modules/steps.module';

@Module({
  imports: [UsersModule, StepsModule],
  providers: [StepSyncService],
})
export class SchedulerModule {}
