import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { User } from '../entities/user.entity';

@Injectable()
export class GoogleFitService {
  private readonly logger = new Logger(GoogleFitService.name);
  private readonly GOOGLE_FIT_API_URL = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Refreshes the Google OAuth access token using a refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    if (!refreshToken) {
      throw new HttpException(
        'No refresh token available',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      this.logger.log('Refreshing Google access token...');
      
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      const newAccessToken = response.data.access_token;
      this.logger.log('Successfully refreshed access token');
      
      return newAccessToken;
    } catch (error) {
      this.logger.error('Failed to refresh access token:', error.response?.data || error.message);
      throw new HttpException(
        `Failed to refresh access token: ${error.response?.data?.error_description || error.message}`,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /**
   * Gets a valid access token for the user
   * Automatically refreshes if the current token is expired
   */
  async getValidAccessToken(user: User): Promise<string> {
    if (!user.googleAccessToken) {
      throw new HttpException(
        'User does not have a Google access token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Try using the current access token first
    return user.googleAccessToken;
  }

  /**
   * Fetches step count from Google Fit API for a specific time range
   * Throws TOKEN_EXPIRED error if the token is invalid (401)
   */
  async fetchSteps(
    accessToken: string,
    startMillis: number,
    endMillis: number,
  ): Promise<number> {
    try {
      const requestBody = {
        aggregateBy: [
          {
            dataTypeName: 'com.google.step_count.delta',
          },
        ],
        bucketByTime: {
          durationMillis: endMillis - startMillis,
        },
        startTimeMillis: startMillis,
        endTimeMillis: endMillis,
      };

      const response = await axios.post(this.GOOGLE_FIT_API_URL, requestBody, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Parse the response to extract step count
      let totalSteps = 0;

      if (response.data.bucket && response.data.bucket.length > 0) {
        response.data.bucket.forEach((bucket) => {
          if (bucket.dataset && bucket.dataset.length > 0) {
            bucket.dataset.forEach((dataset) => {
              if (dataset.point && dataset.point.length > 0) {
                dataset.point.forEach((point) => {
                  if (point.value && point.value.length > 0) {
                    totalSteps += point.value[0].intVal || 0;
                  }
                });
              }
            });
          }
        });
      }

      return totalSteps;
    } catch (error) {
      if (error.response) {
        // Check if it's an authentication error (401)
        if (error.response.status === 401) {
          this.logger.warn('Google Fit API returned 401 - token expired');
          throw new HttpException('TOKEN_EXPIRED', HttpStatus.UNAUTHORIZED);
        }
        this.logger.error('Google Fit API error:', error.response.data);
        throw new HttpException(
          `Google Fit API error: ${error.response.data.error?.message || 'Unknown error'}`,
          error.response.status,
        );
      }
      this.logger.error('Failed to fetch data from Google Fit:', error.message);
      throw new HttpException(
        'Failed to fetch data from Google Fit',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Fetches steps for a user with automatic token refresh on expiry
   */
  async fetchStepsWithAutoRefresh(
    user: User,
    startMillis: number,
    endMillis: number,
  ): Promise<number> {
    try {
      const accessToken = await this.getValidAccessToken(user);
      return await this.fetchSteps(accessToken, startMillis, endMillis);
    } catch (error) {
      // If token expired, refresh and retry
      if (error.message === 'TOKEN_EXPIRED' && user.googleRefreshToken) {
        try {
          this.logger.log(`Attempting to refresh token for user ${user.id}`);
          
          // Refresh the access token
          const newAccessToken = await this.refreshAccessToken(user.googleRefreshToken);
          
          // Update user's access token in database
          user.googleAccessToken = newAccessToken;
          await this.usersRepository.save(user);
          
          this.logger.log(`Token refreshed successfully for user ${user.id}`);
          
          // Retry the request with new token
          return await this.fetchSteps(newAccessToken, startMillis, endMillis);
        } catch (refreshError) {
          this.logger.error(
            `Failed to refresh token for user ${user.id}:`,
            refreshError.message,
          );
          throw new HttpException(
            'Failed to refresh token and fetch steps. User may need to re-authenticate.',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }
      throw error;
    }
  }

  /**
   * Fetches today's step count for a user
   */
  async fetchDailySteps(accessToken: string): Promise<number> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startTimeMillis = today.getTime();
    const endTimeMillis = tomorrow.getTime();

    return await this.fetchSteps(accessToken, startTimeMillis, endTimeMillis);
  }

  /**
   * Fetches yesterday's step count for a user with auto-refresh
   */
  async fetchYesterdaySteps(user: User): Promise<number> {
    const { startMillis, endMillis } = this.getYesterdayMillis();
    return await this.fetchStepsWithAutoRefresh(user, startMillis, endMillis);
  }

  /**
   * Returns the start and end timestamps for yesterday (00:00 - 23:59)
   */
  getYesterdayMillis(): { startMillis: number; endMillis: number } {
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return {
      startMillis: yesterday.getTime(),
      endMillis: today.getTime(),
    };
  }

  /**
   * Legacy method for backward compatibility
   */
  async fetchDailyStepsWithRefresh(user: User): Promise<number> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await this.fetchStepsWithAutoRefresh(
      user,
      today.getTime(),
      tomorrow.getTime(),
    );
  }
}
