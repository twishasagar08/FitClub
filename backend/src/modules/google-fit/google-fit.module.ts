import { Module, forwardRef } from '@nestjs/common';
import { GoogleFitService } from './google-fit.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [
    GoogleFitService,
    {
      provide: 'AuthService',
      useFactory: (authModule) => authModule?.authService,
      inject: [{ token: AuthModule, optional: true }],
    },
  ],
  exports: [GoogleFitService],
})
export class GoogleFitModule {}
