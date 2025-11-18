import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
      accessType: 'offline',
      prompt: 'consent',
      scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.activity.write',
      ],
    });
    console.log('GoogleStrategy initialized with callback:', process.env.GOOGLE_REDIRECT_URI);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    console.log('=== Google Strategy Validate ===');
    console.log('Profile ID:', profile.id);
    console.log('Profile Email:', profile.emails?.[0]?.value);
    console.log('Access Token received:', !!accessToken);
    console.log('Refresh Token received:', !!refreshToken);
    console.log('Access Token length:', accessToken?.length);
    console.log('Refresh Token length:', refreshToken?.length);
    
    const googleUser = {
      profile: {
        id: profile.id,
        displayName: profile.displayName,
        emails: profile.emails,
        photos: profile.photos,
      },
      accessToken,
      refreshToken,
    };

    console.log('Passing to controller:', {
      hasProfile: !!googleUser.profile,
      hasAccessToken: !!googleUser.accessToken,
      hasRefreshToken: !!googleUser.refreshToken,
    });

    done(null, googleUser);
  }
}
