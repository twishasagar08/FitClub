import { Injectable } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { User } from '../entities/user.entity';
import { GoogleUser } from '../interfaces/google-user.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
  ) {}

  /**
   * Creates or updates a user with Google OAuth data
   * IMPORTANT: Only updates refresh token if it's non-null to prevent overwriting
   */
  async createOrUpdateGoogleUser(googleUser: GoogleUser): Promise<User> {
    const { profile, accessToken, refreshToken } = googleUser;
    const googleId = profile.id;
    const email = profile.emails[0].value;
    const name = profile.displayName;

    // Find user by Google ID
    let user = await this.usersService.findByGoogleId(googleId);

    if (user) {
      // User exists - update tokens
      user.googleAccessToken = accessToken;
      
      // CRITICAL: Only update refresh token if Google returns one
      // This prevents overwriting an existing refresh token with null
      if (refreshToken) {
        user.googleRefreshToken = refreshToken;
      }
      
      return await this.usersService.save(user);
    }

    // User doesn't exist by Google ID - check by email
    user = await this.usersService.findByEmail(email);

    if (user) {
      // User exists with email but no Google ID - link accounts
      user.googleId = googleId;
      user.googleAccessToken = accessToken;
      
      // Only set refresh token if provided
      if (refreshToken) {
        user.googleRefreshToken = refreshToken;
      }
      
      return await this.usersService.save(user);
    }

    // Create new user
    const newUser = new User();
    newUser.name = name;
    newUser.email = email;
    newUser.googleId = googleId;
    newUser.googleAccessToken = accessToken;
    newUser.googleRefreshToken = refreshToken; // Can be null for new users
    newUser.totalSteps = 0;
    
    return await this.usersService.save(newUser);
  }

  async handleGoogleLogin(googleUser: GoogleUser): Promise<{
    id: string;
    name: string;
    email: string;
  }> {
    const user = await this.createOrUpdateGoogleUser(googleUser);

    // Return safe user data
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}
