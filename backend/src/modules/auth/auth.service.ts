import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { GoogleUser } from './interfaces/google-user.interface';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async handleGoogleLogin(googleUser: GoogleUser): Promise<{
    id: string;
    name: string;
    email: string;
  }> {
    const { profile, accessToken, refreshToken } = googleUser;
    const googleId = profile.id;
    const email = profile.emails[0].value;
    const name = profile.displayName;

    // Check if user exists by Google ID
    let user = await this.usersService.findByGoogleId(googleId);

    if (!user) {
      // Check if user exists by email
      user = await this.usersService.findByEmail(email);

      if (user) {
        // User exists with email but no Google ID - link accounts
        user.googleId = googleId;
        user.googleAccessToken = accessToken;
        user.googleRefreshToken = refreshToken;
        await this.usersService.save(user);
      } else {
        // Create new user
        const newUser = new User();
        newUser.name = name;
        newUser.email = email;
        newUser.googleId = googleId;
        newUser.googleAccessToken = accessToken;
        newUser.googleRefreshToken = refreshToken;
        newUser.totalSteps = 0;
        user = await this.usersService.save(newUser);
      }
    } else {
      // Update tokens for existing user
      user.googleAccessToken = accessToken;
      if (refreshToken) {
        user.googleRefreshToken = refreshToken;
      }
      await this.usersService.save(user);
    }

    // Return safe user data
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  async refreshGoogleAccessToken(user: User): Promise<string> {
    if (!user.googleRefreshToken) {
      throw new UnauthorizedException('No refresh token available');
    }

    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.configService.get<string>('GOOGLE_CLIENT_ID'),
        client_secret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
        refresh_token: user.googleRefreshToken,
        grant_type: 'refresh_token',
      });

      const newAccessToken = response.data.access_token;

      // Update user's access token
      user.googleAccessToken = newAccessToken;
      await this.usersService.save(user);

      return newAccessToken;
    } catch (error) {
      throw new UnauthorizedException(
        'Failed to refresh access token: ' + error.message,
      );
    }
  }
}
