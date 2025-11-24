import { Module } from '@nestjs/common';
import { StepSyncService } from '../services/step-sync.service';
import { UsersModule } from '../modules/users.module';
import { StepsModule } from '../modules/steps.module';
import { GoogleFitModule } from '../modules/google-fit.module';

@Module({
  imports: [UsersModule, StepsModule, GoogleFitModule],
  providers: [StepSyncService],
})
export class SchedulerModule {}
