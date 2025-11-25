import { Module } from '@nestjs/common';
import { UsersModule } from '../modules/users.module';
import { StepsModule } from '../modules/steps.module';
import { GoogleFitModule } from '../modules/google-fit.module';

@Module({
  imports: [UsersModule, StepsModule, GoogleFitModule],
})
export class SchedulerModule {}
