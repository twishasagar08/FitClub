import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StepsController } from './steps.controller';
import { StepsService } from './steps.service';
import { StepRecord } from './step.entity';
import { UsersModule } from '../users/users.module';
import { GoogleFitModule } from '../google-fit/google-fit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StepRecord]),
    UsersModule,
    GoogleFitModule,
  ],
  controllers: [StepsController],
  providers: [StepsService],
  exports: [StepsService],
})
export class StepsModule {}
