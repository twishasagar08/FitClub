import { Module, forwardRef } from '@nestjs/common';
import { GoogleFitService } from '../services/google-fit.service';
import { AuthModule } from '../modules/auth.module';

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
