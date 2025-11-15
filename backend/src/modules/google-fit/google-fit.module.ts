import { Module } from '@nestjs/common';
import { GoogleFitService } from './google-fit.service';

@Module({
  providers: [GoogleFitService],
  exports: [GoogleFitService],
})
export class GoogleFitModule {}
