import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth.module';
import { UsersModule } from './modules/users.module';
import { StepsModule } from './modules/steps.module';
import { GoogleFitModule } from './modules/google-fit.module';
import { LeaderboardModule } from './modules/leaderboard.module';
import { SchedulerModule } from './modules/scheduler.module';
import { User } from './entities/user.entity';
import { StepRecord } from './entities/step.entity';
import { DataSourceOptions } from 'typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: 'postgresql://neondb_owner:npg_LGmOsW3Pq1ip@ep-muddy-dust-a17yjitz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',   // <--- use the Neon URL
      autoLoadEntities: true,          // loads all entities automatically
      synchronize: true,               // only for development
      ssl: {
        rejectUnauthorized: false,     // Neon requires SSL
      },
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    StepsModule,
    GoogleFitModule,
    LeaderboardModule,
    SchedulerModule,
  ],
})
export class AppModule {}
