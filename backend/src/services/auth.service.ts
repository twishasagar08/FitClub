import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { User } from '../entities/user.entity';
import { GoogleUser } from '../interfaces/google-user.interface';
import axios from 'axios';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
  ) {}

  /**
   * Refreshes Google access token using refresh token
   */
  async refreshGoogleAccessToken(userId: string): Promise<string> {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      this.logger.error(`User not found: ${userId}`);
      throw new UnauthorizedException('User not found');
    }
    
    if (!user.googleRefreshToken) {
      this.logger.error(`No refresh token for user ${user.email}. User needs to re-authenticate.`);
      throw new UnauthorizedException('No refresh token available. Please re-authenticate via Google.');
    }

    try {
      this.logger.log(`Refreshing access token for user ${user.email}`);
      
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: user.googleRefreshToken,
        grant_type: 'refresh_token',
      });

      const newAccessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600; // Default 1 hour
      
      // Update user's access token and expiry
      user.googleAccessToken = newAccessToken;
      user.googleTokenExpiresAt = Date.now() + (expiresIn * 1000);
      await this.usersService.save(user);

      this.logger.log(`Successfully refreshed token for user ${user.email}`);
      return newAccessToken;
    } catch (error) {
      const errorMsg = error.response?.data?.error_description || error.response?.data?.error || error.message;
      this.logger.error(`Failed to refresh token for user ${user.email}: ${errorMsg}`);
      
      // Check if it's an invalid grant (revoked/expired refresh token)
      if (error.response?.data?.error === 'invalid_grant') {
        throw new UnauthorizedException('Refresh token is invalid or expired. Please log in again via Google.');
      }
      
      throw new UnauthorizedException(`Failed to refresh token: ${errorMsg}. Please re-authenticate.`);
    }
  }

  /**
   * Gets valid access token, refreshing if necessary
   */
  async getValidAccessToken(userId: string): Promise<string> {
    const user = await this.usersService.findById(userId);
    
    if (!user || !user.googleAccessToken) {
      throw new UnauthorizedException('No access token found');
    }

    // Check if token is expired, will expire in next 5 minutes, or expiry is unknown (NULL)
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    if (!user.googleTokenExpiresAt || user.googleTokenExpiresAt < fiveMinutesFromNow) {
      this.logger.log(`Token expired, expiring soon, or no expiry set for user ${user.email}, refreshing...`);
      return await this.refreshGoogleAccessToken(userId);
    }

    return user.googleAccessToken;
  }

  /**
   * Creates or updates a user with Google OAuth data
   * IMPORTANT: Only updates refresh token if it's non-null to prevent overwriting
   */
  async createOrUpdateGoogleUser(googleUser: GoogleUser): Promise<User> {
    const { profile, accessToken, refreshToken } = googleUser;
    const googleId = profile.id;
    const email = profile.emails[0].value;
    const name = profile.displayName;

    // Access tokens typically expire in 1 hour
    const tokenExpiresAt = Date.now() + (3600 * 1000);

    // Find user by Google ID
    let user = await this.usersService.findByGoogleId(googleId);

    if (user) {
      // User exists - update tokens
      user.googleAccessToken = accessToken;
      user.googleTokenExpiresAt = tokenExpiresAt;
      
      // CRITICAL: Only update refresh token if Google returns one
      // This prevents overwriting an existing refresh token with null
      if (refreshToken) {
        user.googleRefreshToken = refreshToken;
        this.logger.log(`Updated refresh token for user ${email}`);
      }
      
      return await this.usersService.save(user);
    }

    // User doesn't exist by Google ID - check by email
    user = await this.usersService.findByEmail(email);

    if (user) {
      // User exists with email but no Google ID - link accounts
      user.googleId = googleId;
      user.googleAccessToken = accessToken;
      user.googleTokenExpiresAt = tokenExpiresAt;
      
      // Only set refresh token if provided
      if (refreshToken) {
        user.googleRefreshToken = refreshToken;
        this.logger.log(`Linked Google account and set refresh token for user ${email}`);
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
    newUser.googleTokenExpiresAt = tokenExpiresAt;
    newUser.totalSteps = 0;
    
    this.logger.log(`Created new user ${email} with Google account`);
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
