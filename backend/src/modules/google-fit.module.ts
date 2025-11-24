import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleFitService } from '../services/google-fit.service';
import { User } from '../entities/user.entity';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule,
  ],
  providers: [GoogleFitService],
  exports: [GoogleFitService],
})
export class GoogleFitModule {}
