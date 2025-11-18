import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StepsController } from '../controllers/steps.controller';
import { StepsService } from '../services/steps.service';
import { StepRecord } from '../entities/step.entity';
import { UsersModule } from '../modules/users.module';
import { GoogleFitModule } from '../modules/google-fit.module';

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
