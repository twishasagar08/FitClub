import { Injectable, HttpException, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import axios from 'axios';
import { User } from '../users/user.entity';

@Injectable()
export class GoogleFitService {
  private readonly GOOGLE_FIT_API_URL = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';

  constructor(
    @Inject(forwardRef(() => 'AuthService'))
    private authService: any,
  ) {}

  async fetchDailySteps(accessToken: string): Promise<number> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const startTimeMillis = today.getTime();
      const endTimeMillis = tomorrow.getTime();

      const requestBody = {
        aggregateBy: [
          {
            dataTypeName: 'com.google.step_count.delta',
          },
        ],
        bucketByTime: {
          durationMillis: 86400000, // 1 day in milliseconds
        },
        startTimeMillis,
        endTimeMillis,
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
        const bucket = response.data.bucket[0];
        if (bucket.dataset && bucket.dataset.length > 0) {
          const dataset = bucket.dataset[0];
          if (dataset.point && dataset.point.length > 0) {
            dataset.point.forEach((point) => {
              if (point.value && point.value.length > 0) {
                totalSteps += point.value[0].intVal || 0;
              }
            });
          }
        }
      }

      return totalSteps;
    } catch (error) {
      if (error.response) {
        // Check if it's an authentication error (401)
        if (error.response.status === 401) {
          throw new HttpException(
            'Google Fit token expired or invalid',
            HttpStatus.UNAUTHORIZED,
          );
        }
        throw new HttpException(
          `Google Fit API error: ${error.response.data.error?.message || 'Unknown error'}`,
          error.response.status,
        );
      }
      throw new HttpException(
        'Failed to fetch data from Google Fit',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async fetchDailyStepsWithRefresh(user: User): Promise<number> {
    try {
      return await this.fetchDailySteps(user.googleAccessToken);
    } catch (error) {
      // If token expired, refresh and retry
      if (error.status === HttpStatus.UNAUTHORIZED && this.authService) {
        try {
          const newAccessToken = await this.authService.refreshGoogleAccessToken(user);
          return await this.fetchDailySteps(newAccessToken);
        } catch (refreshError) {
          throw new HttpException(
            'Failed to refresh token and fetch steps',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }
      throw error;
    }
  }
}
